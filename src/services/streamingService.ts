import { Platform, StreamStatus } from '@/types/streamer';

export interface StreamStatusResult {
    status: StreamStatus;
    displayName?: string;
    startedAt?: string; // ISO String if live
    viewerCount?: number;
    thumbnailUrl?: string;
    streamTitle?: string;
    streamThumbnailUrl?: string;
    lastStreamEndTime?: string; // ISO String - when last stream ended (for offline)
    error?: boolean;
}

interface IStreamingService {
    getStreamStatus(platform: Platform, channelName: string): Promise<StreamStatusResult>;
    getBatchStatus(streamers: { name: string; platform: Platform }[], twitchToken?: string): Promise<Record<string, StreamStatusResult>>;
}

class RealStreamingService implements IStreamingService {
    // Single fetch (backward compatibility, but batch is better)
    async getStreamStatus(platform: Platform, channelName: string): Promise<StreamStatusResult> {
        const results = await this.getBatchStatus([{ name: channelName, platform }]);
        const key = `${platform}:${channelName}`;
        return results[key] || { status: 'offline' };
    }

    // Batch fetch via our own API
    async getBatchStatus(streamers: { name: string; platform: Platform }[], twitchToken?: string): Promise<Record<string, StreamStatusResult>> {
        try {
            const response = await fetch('/api/streamers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ streamers, twitchToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch status');
            }

            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error('Service Error:', error);
            // Fallback: return all offline
            const fallback: Record<string, StreamStatusResult> = {};
            streamers.forEach(s => {
                fallback[`${s.platform}:${s.name}`] = { status: 'offline', error: true };
            });
            return fallback;
        }
    }
}

export const streamingService = new RealStreamingService();
