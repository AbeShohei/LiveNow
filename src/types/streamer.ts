export type Platform = 'twitch' | 'kick' | 'twitcasting';

export type StreamStatus = 'live' | 'offline';

export interface StreamHistory {
    startTime: string; // ISO string
    endTime?: string; // ISO string
}

export interface Streamer {
    id: string;
    name: string;
    displayName?: string; // Display name (nickname) separate from ID
    platform: Platform;
    status: StreamStatus;
    avatarUrl?: string;
    channelUrl: string;
    history: StreamHistory[];
    lastLiveStart?: string; // If currently live, when it started
    streamTitle?: string;
    streamThumbnailUrl?: string;
    viewerCount?: number;
    lastStreamEndTime?: string; // ISO String - when last stream ended (from API)
    error?: boolean; // If API fetch failed
}
