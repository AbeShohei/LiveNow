import { NextResponse } from 'next/server';
import { fetchTwitchStreams, fetchTwitchUsers, fetchTwitchVideos } from '@/lib/twitch-api';
import { fetchKickStreamResult } from '@/lib/kick-api';
import { fetchTwitCastingCombined, fetchTwitCastingMovies } from '@/lib/twitcasting-api';

import { Platform, StreamStatus } from '@/types/streamer';

interface RequestBody {
    streamers: {
        name: string;
        platform: Platform;
    }[];
    twitchToken?: string;
}

export async function POST(request: Request) {
    try {
        const body: RequestBody = await request.json();
        const { streamers, twitchToken } = body;

        const twitchNames = streamers.filter(s => s.platform === 'twitch').map(s => s.name);
        const kickNames = streamers.filter(s => s.platform === 'kick').map(s => s.name);
        const castNames = streamers.filter(s => s.platform === 'twitcasting').map(s => s.name);


        const results: Record<string, any> = {};

        // 1. Fetch Twitch Data
        if (twitchNames.length > 0) {
            const hasCredentials = !!process.env.TWITCH_CLIENT_SECRET || !!twitchToken;
            let apiStreams: any[] = [];
            let apiUsers: any[] = [];

            if (hasCredentials) {
                try {
                    const [streamsData, usersData] = await Promise.all([
                        fetchTwitchStreams(twitchNames, twitchToken),
                        fetchTwitchUsers(twitchNames, twitchToken)
                    ]);

                    apiStreams = streamsData || [];
                    apiUsers = usersData || [];

                    await Promise.all(twitchNames.map(async (name) => {
                        const stream = apiStreams.find((s: any) => s.user_login.toLowerCase() === name.toLowerCase());
                        const user = apiUsers.find((u: any) => u.login.toLowerCase() === name.toLowerCase());
                        const avatarUrl = user?.profile_image_url || stream?.thumbnail_url?.replace('{width}', '320').replace('{height}', '180');

                        if (stream) {
                            results[`twitch:${name}`] = {
                                status: 'live',
                                displayName: stream.user_name || user?.display_name,
                                startedAt: stream.started_at,
                                viewerCount: stream.viewer_count,
                                thumbnailUrl: avatarUrl,
                                streamTitle: stream.title,
                                streamThumbnailUrl: stream.thumbnail_url?.replace('{width}', '400').replace('{height}', '225'),
                            };
                        } else {
                            let lastStreamEndTime: string | undefined;
                            if (user?.id) {
                                try {
                                    const videos = await fetchTwitchVideos(user.id, twitchToken);
                                    if (videos && videos.length > 0) {
                                        const video = videos[0];
                                        const createdAt = new Date(video.created_at);
                                        const duration = parseTwitchDuration(video.duration);
                                        lastStreamEndTime = new Date(createdAt.getTime() + duration).toISOString();
                                    }
                                } catch (e) {
                                    console.error(`Failed to fetch Twitch videos for ${name}`, e);
                                }
                            }
                            results[`twitch:${name}`] = {
                                status: 'offline',
                                displayName: user?.display_name,
                                thumbnailUrl: avatarUrl,
                                lastStreamEndTime,
                            };
                        }
                    }));
                } catch (e) {
                    console.error("Twitch API real fetch failed", e);
                    twitchNames.forEach(name => {
                        results[`twitch:${name}`] = { status: 'offline', error: true };
                    });
                }
            } else {
                console.warn("No Twitch Secret found. Returning config_error.");
                twitchNames.forEach((name) => {
                    results[`twitch:${name}`] = {
                        status: 'offline',
                        error: true,
                        configMissing: true
                    };
                });
            }
        }

        // 2. Fetch Kick Data
        // Note: Kick API is protected by Cloudflare, past stream data is unreliable
        if (kickNames.length > 0) {
            await Promise.all(kickNames.map(async (name) => {
                try {
                    const data = await fetchKickStreamResult(name);
                    const livestream = data?.livestream;
                    const avatarUrl = data?.user?.profile_pic;

                    if (livestream) {
                        let startedAtISO: string;
                        const rawStartTime = livestream.start_time || livestream.started_at || livestream.created_at;
                        if (rawStartTime && typeof rawStartTime === 'string') {
                            startedAtISO = rawStartTime.replace(' ', 'T') + 'Z';
                        } else {
                            startedAtISO = new Date().toISOString();
                        }

                        const thumbData = livestream.thumbnail;
                        let streamThumb: string | undefined;
                        if (typeof thumbData === 'string') {
                            streamThumb = thumbData;
                        } else if (thumbData && typeof thumbData === 'object') {
                            streamThumb = thumbData.src || thumbData.url;
                        }

                        results[`kick:${name}`] = {
                            status: 'live',
                            displayName: data?.user?.username,
                            startedAt: startedAtISO,
                            viewerCount: livestream.viewer_count || livestream.viewers || 0,
                            thumbnailUrl: avatarUrl,
                            streamTitle: livestream.session_title || livestream.title,
                            streamThumbnailUrl: streamThumb,
                        };
                    } else {
                        // Offline: Kick API doesn't reliably provide past stream data
                        // Videos API returns 403 (Cloudflare), previous_livestreams often empty
                        results[`kick:${name}`] = {
                            status: 'offline',
                            displayName: data?.user?.username,
                            thumbnailUrl: avatarUrl,
                        };
                    }
                } catch (error) {
                    console.error(`Kick processing error for ${name}`, error);
                    results[`kick:${name}`] = { status: 'offline', error: true };
                }
            }));
        }

        // 3. Fetch TwitCasting Data
        if (castNames.length > 0) {
            try {
                const castData = await fetchTwitCastingCombined(castNames);
                if (castData) {
                    await Promise.all(Object.entries(castData).map(async ([userId, data]: [string, any]) => {
                        if (data.is_live) {
                            results[`twitcasting:${userId}`] = {
                                status: 'live',
                                displayName: data.name,
                                startedAt: data.started_at || new Date().toISOString(),
                                viewerCount: data.viewers || 0,
                                thumbnailUrl: data.profile_image,
                                streamTitle: data.title,
                                streamThumbnailUrl: data.thumbnail
                            };
                        } else {
                            let lastStreamEndTime: string | undefined;
                            try {
                                const movies = await fetchTwitCastingMovies(userId);
                                if (movies && movies.length > 0) {
                                    const movie = movies[0];
                                    const createdAt = movie.created * 1000;
                                    const duration = movie.duration ? movie.duration * 1000 : 0;
                                    lastStreamEndTime = new Date(createdAt + duration).toISOString();
                                }
                            } catch (e) {
                                console.error(`Failed to fetch TwitCasting movies for ${userId}`, e);
                            }
                            results[`twitcasting:${userId}`] = {
                                status: 'offline',
                                displayName: data.name,
                                thumbnailUrl: data.profile_image,
                                lastStreamEndTime,
                            };
                        }
                    }));
                } else {
                    castNames.forEach(name => {
                        results[`twitcasting:${name}`] = {
                            status: 'offline',
                            error: true,
                            configMissing: true
                        };
                    });
                }
            } catch (e) {
                console.error("TwitCasting error", e);
                castNames.forEach(name => {
                    results[`twitcasting:${name}`] = { status: 'offline', error: true };
                });
            }
        }




        return NextResponse.json({ results });

    } catch (error) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function parseTwitchDuration(duration: string): number {
    if (!duration) return 0;

    let total = 0;
    const hours = duration.match(/(\d+)h/);
    const minutes = duration.match(/(\d+)m/);
    const seconds = duration.match(/(\d+)s/);

    if (hours) total += parseInt(hours[1]) * 60 * 60 * 1000;
    if (minutes) total += parseInt(minutes[1]) * 60 * 1000;
    if (seconds) total += parseInt(seconds[1]) * 1000;

    return total;
}
