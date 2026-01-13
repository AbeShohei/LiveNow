
let twitchAccessToken: string | null = null;
let tokenExpiry: number = 0;

export async function getTwitchAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn('Twitch credentials missing (Client ID or Secret). Falling back to Mock mode.');
        return null;
    }

    // Reuse valid token
    if (twitchAccessToken && Date.now() < tokenExpiry) {
        return twitchAccessToken;
    }

    console.log('Fetching new Twitch Access Token...');

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get Twitch token: ${response.statusText}`);
    }

    const data = await response.json();
    twitchAccessToken = data.access_token;
    // Set expiry slightly earlier than actual to be safe (expires_in is seconds)
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

    return twitchAccessToken;
}

export async function fetchTwitchStreams(userLogins: string[], tokenOverride?: string) {
    if (userLogins.length === 0) return [];

    const token = tokenOverride || await getTwitchAccessToken();

    // If token is null, it means we don't have credentials. Return empty to trigger fallback.
    if (!token) return [];

    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;

    // Build Query: ?user_login=a&user_login=b
    const params = new URLSearchParams();
    userLogins.forEach(login => params.append('user_login', login));

    const response = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
        headers: {
            'Client-Id': clientId,
            'Authorization': `Bearer ${token}`,
        },
        next: { revalidate: 30 }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data; // Array of stream info
}

export async function fetchTwitchUsers(userLogins: string[], tokenOverride?: string) {
    if (userLogins.length === 0) return [];

    const token = tokenOverride || await getTwitchAccessToken();
    if (!token) return [];

    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
    const params = new URLSearchParams();
    userLogins.forEach(login => params.append('login', login));

    const response = await fetch(`https://api.twitch.tv/helix/users?${params.toString()}`, {
        headers: {
            'Client-Id': clientId,
            'Authorization': `Bearer ${token}`,
        },
        next: { revalidate: 3600 } // Cache users longer (avatars don't change often)
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data; // Array of user info
}

// Fetch past broadcasts (VODs) for a user
export async function fetchTwitchVideos(userId: string, tokenOverride?: string) {
    if (!userId) return [];

    const token = tokenOverride || await getTwitchAccessToken();
    if (!token) return [];

    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;

    // Get the most recent past broadcast (type=archive means VODs)
    const response = await fetch(
        `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=1`,
        {
            headers: {
                'Client-Id': clientId,
                'Authorization': `Bearer ${token}`,
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.data; // Array of video info [{id, created_at, duration, title, ...}]
}

// Kick API (Unofficial / Optional)
// Note: Kick API often blocks server-side requests with Cloudflare.
// User supplied "API keys", so maybe they have a proper endpoint.
// For now, we keep logic placeholder.
export async function fetchKickStream(channelSlug: string) {
    try {
        // Mock implementation or real fetch if URL provided
        if (process.env.KICK_API_URL) {
            // Assume simple fetch
            return null;
        }
        // Return null to fallback to existing mock behavior or empty
        return null;
    } catch (e) {
        return null;
    }
}
