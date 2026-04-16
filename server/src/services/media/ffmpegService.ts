import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs-extra';
import { VIDEOS_DIR } from './entryService';

// ─────────────────────────────────────────────────────────────────────────────
// FFmpeg Service
// Wraps fluent-ffmpeg for video recording, format conversion, and thumbnail
// extraction. FFmpeg must be available in PATH (or set FFMPEG_PATH env var).
// ─────────────────────────────────────────────────────────────────────────────

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

interface ActiveRecording {
  command: ffmpeg.FfmpegCommand;
  filepath: string;
  startTime: number;
}

// Track in-progress recordings per camera
const recordings = new Map<string, ActiveRecording>();

/**
 * Start recording from an RTSP or local device source.
 * Returns the output file path.
 */
export function startRecording(
  cameraId: string,
  source: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (recordings.has(cameraId)) {
      return reject(new Error(`Camera ${cameraId} already recording`));
    }

    const filename = `${Date.now()}-${cameraId}.mp4`;
    const filepath = path.join(VIDEOS_DIR, filename);

    const command = ffmpeg(source)
      .outputOptions([
        '-c:v libx264',
        '-preset ultrafast',
        '-crf 23',
        '-c:a aac',
        '-movflags +faststart',   // web-playback optimisation
      ])
      .output(filepath)
      .on('start', () => {
        console.log(`[FFmpeg] Recording started: ${filepath}`);
        resolve(filepath);
      })
      .on('error', (err) => {
        recordings.delete(cameraId);
        reject(err);
      });

    recordings.set(cameraId, { command, filepath, startTime: Date.now() });
    command.run();
  });
}

/**
 * Stop recording for the given camera.
 * Returns { filepath, durationSec }.
 */
export function stopRecording(
  cameraId: string
): Promise<{ filepath: string; durationSec: number }> {
  return new Promise((resolve, reject) => {
    const rec = recordings.get(cameraId);
    if (!rec) return reject(new Error(`No active recording for camera ${cameraId}`));

    const durationSec = (Date.now() - rec.startTime) / 1000;

    rec.command.on('end', () => {
      recordings.delete(cameraId);
      resolve({ filepath: rec.filepath, durationSec });
    });

    rec.command.kill('SIGINT');
  });
}

/** Returns whether a camera is currently recording */
export function isRecording(cameraId: string): boolean {
  return recordings.has(cameraId);
}

/** Extract a single frame (thumbnail) from a video at 1 second */
export function extractVideoThumbnail(
  videoPath: string,
  outputPath: string,
  timeMark = '00:00:01'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    const filename = path.basename(outputPath);

    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timeMark],
        filename,
        folder: dir,
        size: '400x300',
      })
      .on('end', () => resolve())
      .on('error', reject);
  });
}

/** Convert a video to a web-friendly format */
export function convertVideo(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-c:v libx264', '-preset fast', '-crf 22', '-c:a aac'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}

/** Get video duration in seconds */
export function getVideoDuration(filepath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filepath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });
}
