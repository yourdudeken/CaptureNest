import fs from 'fs-extra';
import path from 'path';
import { analyzeImage, generateEmbedding } from './ollamaService';
import { upsertEmbedding, deleteEmbedding } from './qdrantService';
import { updateMediaAnalysis, getMediaById, saveImage } from '../media/mediaService';
import { QdrantPayload } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// AI Analysis Pipeline
//
// Orchestrates:
//  1. Read image file → base64
//  2. Call Ollama for description + tags
//  3. Generate text embedding from description + tags
//  4. Store embedding in Qdrant
//  5. Update SQLite with description + tags
// ─────────────────────────────────────────────────────────────────────────────

/** Run the full AI pipeline for a newly captured image */
export async function runAnalysisPipeline(mediaId: string): Promise<void> {
  const media = getMediaById(mediaId);
  if (!media) {
    console.error(`[AI Pipeline] Media ${mediaId} not found`);
    return;
  }

  // Only images can be directly analyzed; for video we skip for now
  if (media.type !== 'image') {
    console.log(`[AI Pipeline] Skipping video ${mediaId} (video frame analysis not yet implemented)`);
    return;
  }

  console.log(`[AI Pipeline] Analyzing media ${mediaId}…`);

  try {
    // ①  Read image and encode as base64
    const imageBuffer = await fs.readFile(media.filepath);
    const base64 = imageBuffer.toString('base64');

    // ②  Call vision model
    const analysis = await analyzeImage(base64);
    console.log(`[AI Pipeline] Description: "${analysis.description}", Tags: [${analysis.tags.join(', ')}]`);

    // ③  Persist analysis to SQLite
    updateMediaAnalysis(mediaId, analysis.description, analysis.tags);

    // ④  Generate embedding from combined text
    const embeddingText = [
      analysis.description,
      ...analysis.tags,
      ...(analysis.objects ?? []),
    ].join(', ');

    const vector = await generateEmbedding(embeddingText);

    // ⑤  Upsert into Qdrant
    const updatedMedia = getMediaById(mediaId)!;
    const payload: QdrantPayload = {
      mediaId,
      description:  analysis.description,
      tags:         analysis.tags,
      timestamp:    updatedMedia.timestamp,
      type:         updatedMedia.type,
      thumbnailUrl: updatedMedia.thumbnailUrl,
    };

    await upsertEmbedding(mediaId, vector, payload);

    console.log(`[AI Pipeline] ✓ Complete for media ${mediaId}`);
  } catch (err) {
    console.error(`[AI Pipeline] Error for media ${mediaId}:`, (err as Error).message);
  }
}

/** Manually trigger re-analysis (e.g. called from Settings) */
export async function reanalyzeMedia(mediaId: string): Promise<void> {
  await deleteEmbedding(mediaId).catch(() => null);         // clear old vector
  await runAnalysisPipeline(mediaId);
}
