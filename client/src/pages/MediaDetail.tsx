import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowLeft, Download, Trash2, RefreshCw, Calendar, Camera,
  Tag, Brain, Clock, FileImage, Video
} from 'lucide-react';
import { mediaApi, type MediaItem } from '../lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────────────────
// Media Detail Page
// Full viewing of a single image or video with AI metadata panel.
// ─────────────────────────────────────────────────────────────────────────────

export default function MediaDetail() {
  const { id }        = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const [item, setItem]     = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    if (!id) return;
    mediaApi.get(id)
      .then(r => setItem(r.data))
      .catch(() => { toast.error('Media not found'); navigate('/library'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!item || !window.confirm('Delete this media item permanently?')) return;
    setDeleting(true);
    try {
      await mediaApi.delete(item.id);
      toast.success('Deleted');
      navigate('/library');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleReanalyze = async () => {
    if (!item) return;
    setReanalyzing(true);
    try {
      await mediaApi.reanalyze(item.id);
      toast.success('Re-analysis queued — refresh in a moment');
    } catch {
      toast.error('Re-analysis failed');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDownload = async () => {
    if (!item) return;
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.filename;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="flex h-full animate-fade-in">
      {/* Media viewer */}
      <div className="flex-1 bg-black flex items-center justify-center relative">
        <button
          onClick={() => navigate('/library')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80
                     flex items-center justify-center text-white transition-colors z-10"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {item.type === 'video' ? (
          <video src={item.url} controls className="max-w-full max-h-full" />
        ) : (
          <img
            src={item.url}
            alt={item.description || item.filename}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Metadata panel */}
      <aside className="w-80 shrink-0 bg-surface-elevated border-l border-surface-border overflow-y-auto">
        <div className="p-5 space-y-6">
          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={handleDownload} className="btn-secondary flex-1 text-xs">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="btn-secondary !px-3 !py-2"
              title="Re-run AI analysis"
            >
              <RefreshCw className={clsx('w-4 h-4', reanalyzing && 'animate-spin')} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger !px-3 !py-2"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* File info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">File Info</h3>
            <div className="space-y-2">
              <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Captured">
                {format(new Date(item.timestamp), 'MMM d, yyyy • HH:mm')}
              </InfoRow>
              <InfoRow icon={item.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <FileImage className="w-3.5 h-3.5" />} label="Type">
                <span className="capitalize">{item.type}</span>
              </InfoRow>
              <InfoRow icon={<Camera className="w-3.5 h-3.5" />} label="Camera">
                {item.cameraId}
              </InfoRow>
              {item.durationSec && (
                <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Duration">
                  {Math.round(item.durationSec)}s
                </InfoRow>
              )}
              {item.width && item.height && (
                <InfoRow icon={<FileImage className="w-3.5 h-3.5" />} label="Resolution">
                  {item.width} × {item.height}
                </InfoRow>
              )}
              {item.fileSize && (
                <InfoRow icon={<FileImage className="w-3.5 h-3.5" />} label="Size">
                  {(item.fileSize / 1024 / 1024).toFixed(1)} MB
                </InfoRow>
              )}
            </div>
          </section>

          {/* AI Analysis */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> AI Analysis
              </h3>
              {item.aiProcessed && (
                <span className="badge bg-brand-600/15 text-brand-400 border border-brand-600/25 text-[10px]">
                  Analyzed
                </span>
              )}
            </div>

            {item.aiProcessed ? (
              <div className="space-y-4">
                {item.description && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Description</p>
                    <p className="text-sm text-gray-200 leading-relaxed bg-surface rounded-lg p-3 border border-surface-border">
                      {item.description}
                    </p>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Not yet analyzed</p>
                <button onClick={handleReanalyze} disabled={reanalyzing} className="mt-3 btn-primary text-xs">
                  <RefreshCw className={clsx('w-3 h-3', reanalyzing && 'animate-spin')} />
                  Run AI Analysis
                </button>
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function InfoRow({ icon, label, children }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-gray-500 mt-0.5 shrink-0">{icon}</span>
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-gray-300 flex-1">{children}</span>
    </div>
  );
}
