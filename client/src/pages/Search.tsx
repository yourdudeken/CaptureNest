import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Loader2, Brain, Sparkles, Video, Clock } from 'lucide-react';
import { searchApi, type SearchResult } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// AI Search Page — Natural language media search powered by Qdrant + Ollama
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  'person sitting at a desk',
  'laptop on a table',
  'someone walking indoors',
  'outdoor scene with trees',
  'empty room',
  'multiple people gathered',
];

export default function Search() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const res = await searchApi.search(q, { limit: 24 });
      setResults(res.data.results);
      if (res.data.results.length === 0) {
        toast('No results found. Try a different query.');
      }
    } catch {
      toast.error('Search failed. Is Ollama running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-brand-400" />
          AI Search
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Search your media using natural language — powered by local vector embeddings
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder='Try: "person at a desk" or "outdoor daytime scene"'
          className="input !pl-10 !pr-28 !py-3.5 !text-base"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Search
        </button>
      </div>

      {/* Example queries */}
      {!searched && (
        <div className="mb-8">
          <p className="text-xs text-gray-500 mb-2">Example queries:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => { setQuery(q); handleSearch(q); }}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-elevated border border-surface-border
                           text-gray-400 hover:text-white hover:border-brand-500/40 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No matches found</p>
          <p className="text-sm mt-1">Try a broader description or ensure media has been analyzed</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              Found <span className="text-white font-semibold">{results.length}</span> results
              for "<span className="text-brand-400">{query}</span>"
            </p>
          </div>

          <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
            {results.map(item => (
              <Link key={item.id} to={`/library/${item.id}`} className="media-thumb">
                {(item.thumbnailUrl || item.type === 'image') ? (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.description || item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface">
                    <Video className="w-6 h-6 text-gray-500" />
                  </div>
                )}

                {/* Similarity score badge */}
                <div className="absolute top-1.5 right-1.5">
                  <span className="badge bg-brand-600/70 text-white text-[9px] !px-1.5 font-mono">
                    {(item.score * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[10px] text-gray-300 line-clamp-2 leading-snug">
                      {item.description || item.filename}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
