export async function fetchKickStreamResult(channelSlug: string) {
    // Default to unofficial public API if not overridden
    const apiUrl = process.env.KICK_API_URL || 'https://kick.com/api/v1/channels';

    // Some private APIs might require a Key in headers
    const apiKey = process.env.KICK_API_KEY;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'StreamPulse/1.0',
    };

    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
        const cleanSlug = channelSlug.trim();
        if (!cleanSlug) return null;

        const endpoint = `${apiUrl}/${cleanSlug}`;
        console.log(`Fetching Kick: ${endpoint}`);

        const response = await fetch(endpoint, {
            headers,
            next: { revalidate: 60 }
        });

        if (response.status === 403 || response.status === 404) {
            console.warn(`Kick API returned ${response.status} for ${cleanSlug}. (Might be Cloudflare protected if 403)`);
            return null;
        }

        if (!response.ok) {
            throw new Error(`Kick API Error: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (e) {
        console.error(`Failed to fetch Kick stream for ${channelSlug}:`, e);
        return null;
    }
}

// Fetch past videos (VODs) for a Kick channel
export async function fetchKickVideos(channelSlug: string) {
    const cleanSlug = channelSlug.trim();
    if (!cleanSlug) return [];

    const apiKey = process.env.KICK_API_KEY;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'StreamPulse/1.0',
    };

    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
        // Kick API v2 for videos
        const endpoint = `https://kick.com/api/v2/channels/${cleanSlug}/videos`;
        console.log(`Fetching Kick videos: ${endpoint}`);

        const response = await fetch(endpoint, {
            headers,
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            console.warn(`Kick Videos API returned ${response.status} for ${cleanSlug}`);
            return [];
        }

        const data = await response.json();
        // DEBUG: Log full response to understand structure
        console.log(`[DEBUG] Kick videos response for ${cleanSlug}:`, JSON.stringify(data, null, 2).substring(0, 1500));

        // Kick API might return different structures
        const videos = data.videos || data.data || (Array.isArray(data) ? data : []);
        console.log(`[DEBUG] Kick videos extracted:`, videos.length, 'videos');

        return videos;
    } catch (e) {
        console.error(`Failed to fetch Kick videos for ${channelSlug}:`, e);
        return [];
    }
}
