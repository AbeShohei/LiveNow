// Basic Mock implementation for now, as proper API V2 requires OAuth 2.0 with callback.
// Implementing full OAuth flow for TwitCasting might be complex for this scope.
// However, there is a "Get Movie Info" endpoint that might work if we have a movie ID... but we only have user ID.
// Most reliable public way is "Get User Info" which returns 'is_live' status.
// Endpoint: https://apiv2.twitcasting.tv/users/:user_id

// We need a server-side Token (App Basic Auth or Bearer)
// TwitCasting supports "App Access Token" which is base64(ClientId:ClientSecret).

export async function fetchTwitCastingCombined(userIds: string[]) {
    if (userIds.length === 0) return {};

    // Check for credentials
    // Note: User can provide these in .env.local
    const clientId = process.env.TWITCASTING_CLIENT_ID;
    const clientSecret = process.env.TWITCASTING_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        // Fallback to mock if no credentials
        console.warn("TwitCasting Config Missing. Using Mock.");
        return null;
    }

    // Prepare Basic Auth Header
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'X-Api-Version': '2.0'
    };

    // TwitCasting doesn't have a batch user endpoint in V2 publicly listed as common as Twitch.
    // We have to iterate.
    const results: Record<string, any> = {};

    await Promise.all(userIds.map(async (id) => {
        try {
            const response = await fetch(`https://apiv2.twitcasting.tv/users/${id}`, {
                headers,
                next: { revalidate: 60 }
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;
                if (user) {
                    results[id] = {
                        is_live: user.is_live,
                        profile_image: user.image,
                        // If live, we need movie info for details? 
                        // user object has 'last_movie_id'. We can fetch movie if needed, 
                        // but 'is_live' is enough for status.
                    };

                    // If live, let's try to get more current live info if possible, 
                    // or just use 'is_live' (boolean).
                    if (user.is_live) {
                        // We can't easily get 'started_at' from user object alone usually.
                        // We might need to fetch `current_live` endpoint?
                        // Endpoint: https://apiv2.twitcasting.tv/users/:user_id/current_live
                        try {
                            const liveResp = await fetch(`https://apiv2.twitcasting.tv/users/${id}/current_live`, {
                                headers,
                                next: { revalidate: 60 }
                            });
                            if (liveResp.ok) {
                                const liveData = await liveResp.json();
                                if (liveData.movie) {
                                    results[id].started_at = new Date(liveData.movie.created * 1000).toISOString();
                                    results[id].viewers = liveData.movie.current_viewers;
                                    results[id].thumbnail = liveData.movie.large_thumbnail;
                                }
                            }
                        } catch (e) {
                            console.error("TwitCasting live details fetch error", e);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`TwitCasting fetch error for ${id}`, e);
        }
    }));

    return results;
}

// Fetch past movies (archives) for a TwitCasting user
export async function fetchTwitCastingMovies(userId: string) {
    if (!userId) return [];

    const clientId = process.env.TWITCASTING_CLIENT_ID;
    const clientSecret = process.env.TWITCASTING_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn("TwitCasting Config Missing for movies fetch.");
        return [];
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'X-Api-Version': '2.0'
    };

    try {
        // Get most recent movie (limit=1)
        const response = await fetch(
            `https://apiv2.twitcasting.tv/users/${userId}/movies?limit=1`,
            {
                headers,
                next: { revalidate: 300 }
            }
        );

        if (!response.ok) {
            console.warn(`TwitCasting Movies API returned ${response.status} for ${userId}`);
            return [];
        }

        const data = await response.json();
        // Returns { movies: [{id, created, title, ...}] }
        return data.movies || [];
    } catch (e) {
        console.error(`Failed to fetch TwitCasting movies for ${userId}:`, e);
        return [];
    }
}
