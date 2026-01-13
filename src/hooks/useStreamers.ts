import { useState, useEffect, useCallback } from 'react';
import { Streamer, StreamStatus } from '@/types/streamer';
import { streamingService } from '@/services/streamingService';

const STORAGE_KEY = 'stream_pulse_data';

export const useStreamers = () => {
    const [streamers, setStreamers] = useState<Streamer[]>([]);
    const [loading, setLoading] = useState(true);

    // Load from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setStreamers(JSON.parse(stored));
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

            setStreamers(prev => prev.map(s => {
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
            }));
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

        const updatedList = [...streamers, newStreamer];
        setStreamers(updatedList);

        // Trigger immediate update using the new list
        checkStatuses(updatedList);
        return true;
    };

    const removeStreamer = (id: string) => {
        setStreamers(prev => prev.filter(s => s.id !== id));
    };

    // Expose a manual refresh for UI
    const refresh = () => checkStatuses();

    return { streamers, addStreamer, removeStreamer, refresh, loading };
};
