import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Loader2, Brain, Sparkles, FileText, Mic, Image, Video, File, Clock } from 'lucide-react';
import { searchApi, type SearchResult, type EntryType } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const EXAMPLE_QUERIES = [
  'when was I feeling stressed',
  'happy moments',
  'entries about work',
  'vacation memories',
  'family gatherings',
  'things I learned',
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

  const getIcon = (type: EntryType) => {
    switch (type) {
      case 'text': return <FileText className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-brand-400" />
          Memory Search
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Search your journal entries using natural language — powered by local AI
        </p>
      </div>

      <div className="relative mb-3">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder='Try: "when was I feeling happy" or "entries about my trip"'
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

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No matches found</p>
          <p className="text-sm mt-1">Try a broader description or ensure entries have been analyzed</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map(item => (
              <Link key={item.id} to={`/library/${item.id}`} className="card p-4 hover:border-brand-500/40 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-surface-elevated flex items-center justify-center text-gray-400">
                    {getIcon(item.type)}
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                  <span className="ml-auto text-xs text-brand-400 font-mono">
                    {Math.round(item.score * 100)}%
                  </span>
                </div>

                {item.type === 'image' && item.thumbnailUrl && (
                  <img src={item.thumbnailUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
                )}

                <p className="text-sm text-white line-clamp-2 mb-2">
                  {item.title || item.content || item.summary || 'Untitled'}
                </p>

                {item.mood && (
                  <span className="tag text-[10px] mb-2">{item.mood}</span>
                )}

                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}