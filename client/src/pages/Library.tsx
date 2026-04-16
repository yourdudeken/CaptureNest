import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Mic, Image, Video, File, Brain, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { entryApi, type Entry, type EntryType } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

type Filter = 'all' | EntryType;
const PAGE_SIZE = 32;

export default function Library() {
  const [items, setItems]     = useState<Entry[]>([]);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState<Filter>('all');
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await entryApi.list({
        type:   filter === 'all' ? undefined : filter,
        limit:  PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getIcon = (type: EntryType) => {
    switch (type) {
      case 'text': return <FileText className="w-6 h-6" />;
      case 'audio': return <Mic className="w-6 h-6" />;
      case 'image': return <Image className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'document': return <File className="w-6 h-6" />;
    }
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Timeline</h1>
          <p className="text-gray-400 text-sm mt-1">{total} entries total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-surface-elevated border border-surface-border rounded-lg">
            {(['all', 'text', 'audio', 'image', 'video', 'document'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-secondary !px-3 !py-2" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <FileText className="w-14 h-14 mb-4 opacity-30" />
          <p className="text-base font-medium">No entries found</p>
          <p className="text-sm mt-1">Start journaling to see your entries here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map(item => (
            <Link key={item.id} to={`/library/${item.id}`} className="card p-4 hover:border-brand-500/40 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-gray-400">
                  {getIcon(item.type)}
                </div>
                <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                {item.aiProcessed && <Brain className="w-3 h-3 text-brand-400 ml-auto" />}
              </div>
              
              {item.type === 'image' && item.thumbnailUrl && (
                <img src={item.thumbnailUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              
              <p className="text-sm text-white line-clamp-2 mb-2">
                {item.title || item.content || item.summary || 'Untitled'}
              </p>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
                {item.mood && (
                  <span className="tag text-[10px]">{item.mood}</span>
                )}
              </div>
              
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag text-[9px] !px-1 !py-0">{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary !px-3 !py-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn-secondary !px-3 !py-2"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}