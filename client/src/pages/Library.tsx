import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Images, Video, Brain, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { mediaApi, type MediaItem } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Media Library Page
// Responsive grid of captured media with type filter and pagination.
// ─────────────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'image' | 'video';
const PAGE_SIZE = 32;

export default function Library() {
  const [items, setItems]     = useState<MediaItem[]>([]);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState<Filter>('all');
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaApi.list({
        type:   filter === 'all' ? undefined : filter,
        limit:  PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-gray-400 text-sm mt-1">{total} captures total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex gap-1 p-1 bg-surface-elevated border border-surface-border rounded-lg">
            {(['all', 'image', 'video'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'image' ? 'Photos' : 'Videos'}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-secondary !px-3 !py-2" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <Images className="w-14 h-14 mb-4 opacity-30" />
          <p className="text-base font-medium">No media found</p>
          <p className="text-sm mt-1">Capture a photo or video to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {items.map(item => (
            <Link key={item.id} to={`/library/${item.id}`} className="media-thumb">
              {/* Thumbnail */}
              {(item.thumbnailUrl || item.type === 'image') ? (
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.description || item.filename}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface">
                  <Video className="w-6 h-6 text-gray-500" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[10px] text-gray-300 truncate">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </p>
                  {item.tags.slice(0, 2).map(t => (
                    <span key={t} className="tag mr-1 mt-0.5 text-[9px] !px-1 !py-0">{t}</span>
                  ))}
                </div>
              </div>

              {/* Badges */}
              {item.type === 'video' && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="badge bg-red-500/80 text-white text-[9px] !px-1.5 !py-0.5">VID</span>
                </div>
              )}
              {item.aiProcessed && (
                <div className="absolute top-1.5 right-1.5">
                  <Brain className="w-3 h-3 text-brand-400 drop-shadow-lg" />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
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
