import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Video, FlipHorizontal, Square, Loader2,
  CheckCircle2, AlertCircle, Circle, X
} from 'lucide-react';
import { captureApi } from '../lib/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Camera Page — Live preview with photo/video capture
// Uses the browser MediaDevices API for the live feed.
// Captured frames are sent to the backend as base64.
// Video recording uses MediaRecorder (browser-side) and uploads on stop.
// ─────────────────────────────────────────────────────────────────────────────

type Mode = 'photo' | 'video';

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [mode, setMode] = useState<Mode>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (stream) stream.getTracks().forEach(t => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      setStream(s);
      setFacingMode(facing);
      setError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
    } catch (e) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, [stream]);

  useEffect(() => {
    startCamera('environment');
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Photo capture ──────────────────────────────────────────────────────────
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setLastCapture(dataUrl);

    setUploading(true);
    try {
      await captureApi.captureImage(dataUrl);
      toast.success('Photo saved & queued for AI analysis');
    } catch {
      toast.error('Failed to save photo');
    } finally {
      setUploading(false);
    }
  };

  // ── Video recording ────────────────────────────────────────────────────────
  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']
      .find(t => MediaRecorder.isTypeSupported(t)) || '';

    const mr = new MediaRecorder(stream, { mimeType });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = uploadVideo;
    mediaRecorderRef.current = mr;
    mr.start(1000);
    setIsRecording(true);
    setRecordSec(0);
    timerRef.current = setInterval(() => setRecordSec(s => s + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const uploadVideo = async () => {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('media', blob, `recording-${Date.now()}.webm`);

    setUploading(true);
    try {
      // Upload directly to the server endpoint as multipart
      const res = await fetch('/api/capture/image', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        toast.success('Video saved to library');
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      toast.error('Failed to save video');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex h-screen bg-black relative overflow-hidden">
      {/* Live Preview */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-center text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <p className="text-sm">{error}</p>
            <button className="mt-4 btn-secondary" onClick={() => startCamera(facingMode)}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2
                              bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/30">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-blink" />
                <span className="text-sm font-mono text-white">{formatTime(recordSec)}</span>
              </div>
            )}

            {/* Last capture thumbnail */}
            {lastCapture && (
              <div className="absolute bottom-32 left-5">
                <div className="relative">
                  <img src={lastCapture} alt="Last capture"
                    className="w-16 h-16 rounded-lg border-2 border-white/20 object-cover" />
                  <button onClick={() => setLastCapture(null)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              </div>
            )}

            {uploading && (
              <div className="absolute top-5 right-5 flex items-center gap-2
                              bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                <span className="text-xs text-white">Saving…</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls panel */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-8 pt-4
                      bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        {/* Mode selector */}
        <div className="flex gap-1 mb-6 bg-white/10 backdrop-blur-sm rounded-full p-1">
          {(['photo', 'video'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => !isRecording && setMode(m)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                mode === m ? 'bg-white text-black' : 'text-white/70 hover:text-white'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-10">
          {/* Flip camera */}
          <button
            onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')}
            className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center
                       hover:bg-white/25 transition-colors"
          >
            <FlipHorizontal className="w-5 h-5 text-white" />
          </button>

          {/* Shutter */}
          {mode === 'photo' ? (
            <button
              onClick={capturePhoto}
              disabled={uploading || !stream}
              className="w-18 h-18 w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center
                         hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={uploading || !stream}
              className={`w-[72px] h-[72px] rounded-full border-4 flex items-center justify-center
                         hover:scale-105 active:scale-95 transition-all disabled:opacity-40
                         ${isRecording ? 'border-red-500' : 'border-white'}`}
            >
              {isRecording ? (
                <div className="w-8 h-8 rounded-md bg-red-500" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-red-500" />
              )}
            </button>
          )}

          {/* Placeholder for symmetry */}
          <div className="w-11 h-11" />
        </div>
      </div>
    </div>
  );
}
