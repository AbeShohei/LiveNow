import React, { useState } from 'react';
import { Streamer, Platform } from '@/types/streamer';
import { X, Plus, Twitch, AlertCircle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (streamer: Streamer) => boolean;
}

export const AddStreamerModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState<Platform>('twitch');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setError(null);
        setName('');
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) return;

        const newStreamer: Streamer = {
            id: crypto.randomUUID(),
            name: name.trim(),
            platform,
            status: 'offline', // Default, will update on next poll
            channelUrl: platform === 'twitch'
                ? `https://twitch.tv/${name.trim()}`
                : platform === 'kick'
                    ? `https://kick.com/${name.trim()}`
                    : `https://twitcasting.tv/${name.trim()}`,
            history: [],
            // Mock avatar? Or leave empty
        };

        const success = onAdd(newStreamer);
        if (success) {
            setName('');
            onClose();
        } else {
            setError('このストリーマーは既に追加されています');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Content */}
            <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">ストリーマーを追加</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">配信者名 (ID)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            placeholder={platform === 'twitch' ? '例: shroud' : '例: user_id'}
                            className={`w-full bg-gray-950 border ${error ? 'border-red-500' : 'border-gray-800'} rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors`}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">プラットフォーム</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setPlatform('twitch')}
                                className={`flex items-center justify-center gap-1 p-3 rounded-lg border transition-all text-sm ${platform === 'twitch' ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                            >
                                <Twitch size={16} />
                                Twitch
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlatform('kick')}
                                className={`flex items-center justify-center gap-1 p-3 rounded-lg border transition-all text-sm ${platform === 'kick' ? 'bg-green-600/20 border-green-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                            >
                                <img src="/kick.png" alt="Kick" className="w-4 h-4 object-contain" />
                                Kick
                            </button>

                            <button
                                type="button"
                                onClick={() => setPlatform('twitcasting')}
                                className={`flex items-center justify-center gap-1 p-3 rounded-lg border transition-all text-sm ${platform === 'twitcasting' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                            >
                                <img src="/twicas.png" alt="TwCas" className="w-4 h-4 object-contain" />
                                ツイキャス
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-red-400 text-sm">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            トラッカーに追加
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
