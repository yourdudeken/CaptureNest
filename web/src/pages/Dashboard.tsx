import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Images, Video, Brain, Clock, ArrowRight, Camera, Search, Zap } from 'lucide-react';
import { mediaApi, type MediaItem, type MediaStats } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Page
// Shows stats overview + recent captures grid
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats]   = useState<MediaStats | null>(null);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mediaApi.stats(),
      mediaApi.list({ limit: 8 }),
    ]).then(([statsRes, mediaRes]) => {
      setStats(statsRes.data);
      setRecent(mediaRes.data.items);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Your AI-powered media capture overview</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link to="/camera" className="card hover:border-brand-500/40 transition-all duration-200 flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-brand-600/15 border border-brand-600/20 flex items-center justify-center group-hover:bg-brand-600/25 transition-colors">
            <Camera className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Open Camera</p>
            <p className="text-xs text-gray-500">Capture photo or video</p>
          </div>
        </Link>
        <Link to="/library" className="card hover:border-brand-500/40 transition-all duration-200 flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <Images className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Media Library</p>
            <p className="text-xs text-gray-500">Browse your captures</p>
          </div>
        </Link>
        <Link to="/search" className="card hover:border-brand-500/40 transition-all duration-200 flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Search</p>
            <p className="text-xs text-gray-500">Natural language query</p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Media"
          value={stats?.total ?? '—'}
          icon={<Images className="w-5 h-5" />}
          color="brand"
          loading={loading}
        />
        <StatCard
          label="Photos"
          value={stats?.images ?? '—'}
          icon={<Images className="w-5 h-5" />}
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Videos"
          value={stats?.videos ?? '—'}
          icon={<Video className="w-5 h-5" />}
          color="emerald"
          loading={loading}
        />
        <StatCard
          label="AI Analyzed"
          value={stats?.analyzed ?? '—'}
          icon={<Brain className="w-5 h-5" />}
          color="purple"
          loading={loading}
        />
      </div>

      {/* AI Processing Status */}
      {stats && stats.unanalyzed > 0 && (
        <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{stats.unanalyzed}</span> items are queued for AI analysis
          </p>
        </div>
      )}

      {/* Recent Captures */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Recent Captures
          </h2>
          <Link to="/library" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-surface-elevated animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No captures yet. Open the camera to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {recent.map(item => (
              <Link key={item.id} to={`/library/${item.id}`} className="media-thumb">
                {item.thumbnailUrl || item.type === 'image' ? (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.description || item.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-elevated">
                    <Video className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs text-gray-300">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {item.type === 'video' && (
                  <div className="absolute top-2 left-2">
                    <span className="badge bg-red-500/80 text-white text-[10px] px-1.5">VIDEO</span>
                  </div>
                )}
                {item.aiProcessed && (
                  <div className="absolute top-2 right-2">
                    <Brain className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, color, loading,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'brand' | 'blue' | 'emerald' | 'purple';
  loading: boolean;
}) {
  const colors = {
    brand:   'bg-brand-600/10 border-brand-600/20 text-brand-400',
    blue:    'bg-blue-500/10  border-blue-500/20  text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple:  'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className="stat-card">
      <div className={clsx('w-9 h-9 rounded-lg border flex items-center justify-center', colors[color])}>
        {icon}
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-surface rounded animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold text-white">{value}</p>
      )}
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
