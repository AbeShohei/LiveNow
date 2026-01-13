import React, { useMemo } from 'react';
import { Streamer } from '@/types/streamer';
import { predictNextStreamStart } from '@/utils/prediction';
import { Trash2, ExternalLink, Twitch, AlertCircle, Star } from 'lucide-react';

interface Props {
    streamer: Streamer;
    onRemove: (id: string) => void;
    onToggleFavorite: (id: string) => void;
}

export const StreamerCard: React.FC<Props> = ({ streamer, onRemove, onToggleFavorite }) => {
    const prediction = useMemo(() => predictNextStreamStart(streamer.history), [streamer.history]);

    const isLive = streamer.status === 'live';

    // Theme colors based on platform
    let badgeColor = 'bg-gray-700';
    let borderColor = 'border-gray-800';
    let shadowColor = 'shadow-gray-500/20';

    if (streamer.platform === 'twitch') {
        badgeColor = 'bg-purple-600';
        borderColor = 'border-purple-500/50';
        shadowColor = 'shadow-purple-500/20';
    } else if (streamer.platform === 'kick') {
        badgeColor = 'bg-green-600';
        borderColor = 'border-green-500/50';
        shadowColor = 'shadow-green-500/20';
    } else if (streamer.platform === 'twitcasting') {
        badgeColor = 'bg-blue-500';
        borderColor = 'border-blue-500/50';
        shadowColor = 'shadow-blue-500/20';
    }


    const getElapsedTime = (startedAt?: string) => {
        if (!startedAt) return '';
        const start = new Date(startedAt);
        const now = new Date();
        const diff = now.getTime() - start.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}時間${minutes}分経過`;
    };



    const getLastStreamTime = () => {
        if (streamer.status === 'live') return '配信中';
        const lastEnd = streamer.lastStreamEndTime || streamer.history[0]?.endTime;

        if (!lastEnd) {
            const lastStart = streamer.history[0]?.startTime;
            if (lastStart) return getElapsedTime(lastStart); // "Started X hours ago"
            return '履歴なし';
        }
        return getElapsedTime(lastEnd);
    };

    const formatPrediction = (date: Date) => {
        const timeStr = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        return `${timeStr}頃`;
    };

    return (
        <div className={`relative group overflow-hidden rounded-2xl bg-gray-900/60 backdrop-blur-md border ${isLive ? borderColor : 'border-gray-800'} ${isLive ? 'shadow-lg ' + shadowColor : ''} transition-all duration-300 hover:scale-[1.02]`}>
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 ${isLive ? badgeColor : 'bg-gray-700'} rounded-full blur-3xl opacity-20 pointer-events-none`} />

            <div className="p-5 relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLive ? badgeColor : 'bg-gray-800'} text-white font-bold text-lg shadow-inner relative`}>
                            {streamer.avatarUrl ? (
                                <img src={streamer.avatarUrl} alt={streamer.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                streamer.name.charAt(0).toUpperCase()
                            )}
                            {isLive && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse" />
                            )}
                        </div>

                        <div>
                            {streamer.displayName && streamer.displayName !== streamer.name ? (
                                <>
                                    <h3 className="text-base md:text-xl font-bold text-white tracking-wide leading-tight">
                                        {streamer.displayName}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium -mt-0.5">@{streamer.name}</p>
                                </>
                            ) : (
                                <h3 className="text-base md:text-xl font-bold text-white tracking-wide">{streamer.name}</h3>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                                {streamer.platform === 'twitch' ? (
                                    <Twitch size={14} className="text-purple-400" />
                                ) : streamer.platform === 'twitcasting' ? (
                                    <img src="/twicas.png" alt="TwitCasting" className="w-4 h-4 object-contain" />
                                ) : (
                                    <img src="/kick.png" alt="Kick" className="w-4 h-4 object-contain" />
                                )}
                                {streamer.platform}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onToggleFavorite(streamer.id)}
                            className={`p-2 rounded-full transition-colors ${streamer.isFavorite ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-600 hover:text-yellow-400 hover:bg-white/5'}`}
                            title={streamer.isFavorite ? "お気に入り解除" : "お気に入りに追加"}
                        >
                            <Star size={18} fill={streamer.isFavorite ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={() => onRemove(streamer.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
                            title="削除"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {isLive ? (
                    <div className="mt-2 space-y-3">
                        {/* Stream Thumbnail & Title */}
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover:border-white/20 transition-colors">
                            {streamer.streamThumbnailUrl ? (
                                <img src={streamer.streamThumbnailUrl} alt="Stream Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full ${badgeColor} opacity-20 flex items-center justify-center`}>
                                    <span className="text-white/50 text-xs">No Thumbnail</span>
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                                <span className="animate-pulse w-1.5 h-1.5 bg-white rounded-full"></span>
                                LIVE
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded">
                                {getElapsedTime(streamer.lastLiveStart)}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1">
                                {streamer.streamTitle || 'Untitled Stream'}
                            </p>
                            <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
                                <span>視聴者: {streamer.viewerCount?.toLocaleString() || '---'}</span>
                                {streamer.error && (
                                    <span className="text-red-400 flex items-center gap-1" title="データ取得エラー: APIキー設定を確認してください">
                                        <AlertCircle size={12} />
                                        API Error
                                    </span>
                                )}
                            </p>
                        </div>

                        <a
                            href={streamer.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block w-full text-center py-2 rounded-lg ${badgeColor} text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg`}
                        >
                            視聴する <ExternalLink size={14} className="inline ml-1" />
                        </a>
                    </div>
                ) : (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center justify-between text-gray-400">
                            <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">前回の配信</p>
                                <p className="text-sm text-gray-300 font-medium whitespace-nowrap">
                                    {getLastStreamTime()}
                                </p>
                            </div>
                            {prediction && (
                                <div className="text-right">
                                    <p className="text-[10px] text-purple-400 mb-0.5">次回予測</p>
                                    <p className="text-sm text-purple-300 font-medium whitespace-nowrap">
                                        {formatPrediction(prediction)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end mt-2">
                            <a
                                href={streamer.channelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
