import { useEffect, useState } from 'react';
import { Twitch } from 'lucide-react';

const CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}` : '';

export const TwitchConnect = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if token exists in storage
        const token = localStorage.getItem('twitch_access_token');
        if (token) {
            setIsAuthenticated(true);
        }

        // Parse hash for new token
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1)); // remove #
            const newToken = params.get('access_token');
            if (newToken) {
                localStorage.setItem('twitch_access_token', newToken);
                setIsAuthenticated(true);
                // Clear hash
                window.history.replaceState(null, '', ' ');
            }
        }
    }, []);

    const login = () => {
        if (!CLIENT_ID) {
            alert('Client IDが設定されていません(.env.local)');
            return;
        }
        // Implicit Grant Flow
        const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email`;
        // scope can be empty for public data, but user:read:email is safe default to check validity
        window.location.href = url;
    };

    const logout = () => {
        localStorage.removeItem('twitch_access_token');
        setIsAuthenticated(false);
        window.location.reload();
    };

    if (isAuthenticated) {
        return (
            <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/50 text-xs font-medium hover:bg-purple-500/30 transition-colors"
            >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Twitch連携中
            </button>
        );
    }

    return (
        <button
            onClick={login}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 text-xs font-medium hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-all"
        >
            <Twitch size={14} />
            Twitchと連携してアイコンを取得
        </button>
    );
};
