import { useState, useEffect, useCallback } from 'react';
import { Streamer, StreamStatus } from '@/types/streamer';
import { streamingService } from '@/services/streamingService';

const STORAGE_KEY = 'stream_pulse_data';

export const useStreamers = () => {
    const [streamers, setStreamers] = useState<Streamer[]>([]);
    const [loading, setLoading] = useState(true);

    const sortStreamers = useCallback((list: Streamer[]) => {
        return [...list].sort((a, b) => {
            // 1. Favorites first
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;

            // 2. Live status
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (a.status !== 'live' && b.status === 'live') return 1;

            return 0;
        });
    }, []);

    // Load from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Ensure sorting on load
                setStreamers(sortStreamers(parsed));
            } catch (e) {
                console.error("Failed to parse stored streamers", e);
            }
        }
        setLoading(false);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (!loading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(streamers));
        }
    }, [streamers, loading]);

    const checkStatuses = useCallback(async (manualStreamers?: Streamer[]) => {
        const targetStreamers = manualStreamers || streamers;
        if (targetStreamers.length === 0) return;

        try {
            // Retrieve optional User Token
            const twitchToken = localStorage.getItem('twitch_access_token') || undefined;

            // Prepare payload
            const targets = targetStreamers.map(s => ({ name: s.name, platform: s.platform }));

            // Batch fetch with token
            const results = await streamingService.getBatchStatus(targets, twitchToken);

            setStreamers(prev => sortStreamers(prev.map(s => {
                const key = `${s.platform}:${s.name}`;
                const result = results[key];

                if (!result) return s;

                let newHistory = [...s.history];
                let lastLiveStart = s.lastLiveStart;

                // Logic to detect NEW live stream and record history
                const wasLive = s.status === 'live';
                const isLive = result.status === 'live';

                if (!wasLive && isLive) {
                    const startTime = result.startedAt || new Date().toISOString();
                    newHistory = [{ startTime }, ...newHistory].slice(0, 10);
                    lastLiveStart = startTime;

                    // Trigger Notification for NEW live stream
                    // Check if initial load (loading is false inside checkStatuses is tough, check lastLiveStart mismatch)
                    // Simplified: Just notify. To prevent notify on page load for existing streams, 
                    // we could check if 'wasLive' was false AND we are not in the first run (maybe optional arg?)
                    // For now, simple implementation
                    sendNotification({ ...s, displayName: result.displayName || s.displayName, avatarUrl: result.thumbnailUrl || s.avatarUrl }, result.streamTitle || 'New Stream');
                } else if (wasLive && !isLive) {
                } else if (wasLive && !isLive) {
                    if (newHistory.length > 0 && !newHistory[0].endTime) {
                        newHistory[0] = { ...newHistory[0], endTime: new Date().toISOString() };
                    }
                } else if (isLive && result.startedAt) {
                    lastLiveStart = result.startedAt;
                }

                return {
                    ...s,
                    status: result.status,
                    error: result.error,
                    displayName: result.displayName || s.displayName, // Update display name
                    lastLiveStart: isLive ? lastLiveStart : undefined,
                    avatarUrl: result.thumbnailUrl || s.avatarUrl,
                    history: newHistory,
                    lastChecked: new Date().toISOString(),
                    streamTitle: isLive ? result.streamTitle : undefined,
                    streamThumbnailUrl: isLive ? result.streamThumbnailUrl : undefined,
                    viewerCount: isLive ? result.viewerCount : undefined,
                    lastStreamEndTime: !isLive ? result.lastStreamEndTime : undefined,
                };
            })));
        } catch (e) {
            console.error("Batch update failed", e);
        }
    }, [streamers]);

    // Polling every 15 seconds (more frequent updates)
    useEffect(() => {
        if (loading) return;

        const interval = setInterval(() => checkStatuses(), 15000);
        return () => clearInterval(interval);
    }, [checkStatuses, loading]);

    const addStreamer = (newStreamer: Streamer) => {
        // Duplicate prevention check
        const exists = streamers.some(s =>
            s.platform === newStreamer.platform &&
            s.name.toLowerCase() === newStreamer.name.toLowerCase()
        );

        if (exists) {
            return false;
        }

        const updatedList = sortStreamers([...streamers, { ...newStreamer, isFavorite: false }]);
        setStreamers(updatedList);

        // Trigger immediate update using the new list
        checkStatuses(updatedList);
        return true;
    };

    const removeStreamer = (id: string) => {
        setStreamers(prev => prev.filter(s => s.id !== id));
    };

    const toggleFavorite = (id: string) => {
        setStreamers(prev => sortStreamers(prev.map(s =>
            s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
        )));
    };

    // Expose a manual refresh for UI
    const refresh = () => checkStatuses();


    // Request Notification Permission
    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) return;
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    };

    // Trigger Notification
    const sendNotification = (streamer: Streamer, title: string) => {
        if (Notification.permission === 'granted') {
            new Notification('🔴 配信開始！ - ' + streamer.displayName || streamer.name, {
                body: `${title}\n${streamer.platform}で配信が始まりました！`,
                icon: streamer.avatarUrl || '/icon-192.png',
                tag: `live-${streamer.platform}-${streamer.name}` // Avoid duplicate notifications
            });
        }
    };

    return { streamers, addStreamer, removeStreamer, toggleFavorite, refresh, loading, requestNotificationPermission };
};
