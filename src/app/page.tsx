'use client';

import { useState } from 'react';
import { useStreamers } from '@/hooks/useStreamers';
import { StreamerCard } from '@/components/StreamerCard';
import { AddStreamerModal } from '@/components/AddStreamerModal';
import { Activity, Plus, RefreshCw, Radio } from 'lucide-react';
import { TwitchConnect } from '@/components/TwitchConnect';

export default function Home() {
  const { streamers, addStreamer, removeStreamer, refresh, loading } = useStreamers();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const liveStreamers = streamers.filter(s => s.status === 'live');
  const offlineStreamers = streamers.filter(s => s.status !== 'live');

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      {/* Abstract Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-md">
                <Activity className="text-purple-400" size={24} />
              </div>
              <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                StreamPulse
              </h1>
            </div>
            <p className="text-gray-400 text-lg">リアルタイム配信監視 & AI予測ダッシュボード</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => refresh()}
              className="p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white transition-all border border-gray-700/50"
              title="ステータス更新"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              追加する
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : streamers.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-gray-800 rounded-3xl bg-white/5 backdrop-blur-sm">
            <Radio className="mx-auto h-16 w-16 text-gray-700 mb-4" />
            <h3 className="text-2xl font-bold text-gray-300 mb-2">追跡中のストリーマーがいません</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">TwitchやKickのお気に入りの配信者を追加して、配信状況の追跡と次の配信予測を開始しましょう。</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
            >
              まずは追加する
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Live Section */}
            {liveStreamers.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-wide">配信中</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveStreamers.map(s => (
                    <StreamerCard key={s.id} streamer={s} onRemove={removeStreamer} />
                  ))}
                </div>
              </section>
            )}

            {/* Offline Section */}
            {offlineStreamers.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <h2 className="text-xl font-bold text-gray-400 tracking-wide">オフライン / 予測中</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                  {offlineStreamers.map(s => (
                    <StreamerCard key={s.id} streamer={s} onRemove={removeStreamer} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <AddStreamerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={addStreamer}
        />
      </div>
    </main>
  );
}
