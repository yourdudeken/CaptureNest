import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Mic, Image, Video, File, Brain, Clock, ArrowRight, PenLine, Search } from 'lucide-react';
import { entryApi, type Entry, type EntryStats } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function Dashboard() {
  const [stats, setStats] = useState<EntryStats | null>(null);
  const [recent, setRecent] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      entryApi.list({ limit: 8 }),
      entryApi.list({ limit: 100 }),
    ]).then(([recentRes, allRes]) => {
      setRecent(recentRes.data.items);
      const items = allRes.data.items;
      const counts = { text: 0, audio: 0, image: 0, video: 0, document: 0, analyzed: 0 };
      items.forEach((item: Entry) => {
        if (item.type in counts) counts[item.type as keyof typeof counts]++;
        if (item.aiProcessed) counts.analyzed++;
      });
      setStats({
        total: allRes.data.total,
        ...counts
      });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Journal</h1>
        <p className="text-gray-400 text-sm mt-1">Your AI-powered personal memory system</p>
      </div>

      <div className="grid grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        <Link to="/journal" className="card hover:border-brand-500/40 transition-all duration-200 flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-brand-600/15 border border-brand-600/20 flex items-center justify-center group-hover:bg-brand-600/25 transition-colors">
            <PenLine className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">New Entry</p>
            <p className="text-xs text-gray-500">Write or dictate</p>
          </div>
        </Link>
        <Link to="/library" className="card hover:border-brand-500/40 transition-all duration-200 flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Timeline</p>
            <p className="text-xs text-gray-500">Browse entries</p>
          </div>
        </Link>
        <Link to="/search" className="card hover:border-brand-500/40 transition-all duration-200 flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Memory Search</p>
            <p className="text-xs text-gray-500">Natural language</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Entries" value={stats?.total ?? '—'} icon={<FileText className="w-5 h-5" />} color="brand" loading={loading} />
        <StatCard label="Text" value={stats?.text ?? '—'} icon={<FileText className="w-5 h-5" />} color="blue" loading={loading} />
        <StatCard label="Audio" value={stats?.audio ?? '—'} icon={<Mic className="w-5 h-5" />} color="emerald" loading={loading} />
        <StatCard label="Images" value={stats?.image ?? '—'} icon={<Image className="w-5 h-5" />} color="purple" loading={loading} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Recent Entries
          </h2>
          <Link to="/library" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-surface-elevated animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <PenLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No entries yet. Start journaling!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recent.map(item => (
              <Link key={item.id} to={`/library/${item.id}`} className="card p-4 hover:border-brand-500/40 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  {item.type === 'text' && <FileText className="w-4 h-4 text-brand-400" />}
                  {item.type === 'audio' && <Mic className="w-4 h-4 text-emerald-400" />}
                  {item.type === 'image' && <Image className="w-4 h-4 text-purple-400" />}
                  {item.type === 'video' && <Video className="w-4 h-4 text-blue-400" />}
                  {item.type === 'document' && <File className="w-4 h-4 text-amber-400" />}
                  <span className="text-xs text-gray-500">{item.type}</span>
                </div>
                <p className="text-sm text-white line-clamp-2 mb-2">{item.title || item.content || 'Untitled'}</p>
                <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</p>
                {item.mood && (
                  <span className="tag mt-2">{item.mood}</span>
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