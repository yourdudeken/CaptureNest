import fs from 'fs-extra';
import { analyzeImage, generateEmbedding, transcribeAudio, structureTextEntry } from './ollamaService';
import { upsertEmbedding, deleteEmbedding } from './qdrantService';
import { updateEntryAnalysis, updateEntrySourceText, getEntryById, saveTextEntry, saveImageEntry, saveAudioEntry, saveDocumentEntry } from '../media/entryService';
import { QdrantPayload } from '../../types';

export async function processTextEntry(text: string): Promise<void> {
  const structured = await structureTextEntry(text);
  
  const entry = await saveTextEntry({
    title: structured.title,
    content: structured.content,
    summary: structured.summary || undefined,
    mood: structured.mood || undefined,
    tags: structured.tags,
    sourceText: text,
  });

  const embeddingText = [
    structured.title,
    structured.content,
    structured.summary,
    ...structured.tags,
  ].filter(Boolean).join(', ');

  const vector = await generateEmbedding(embeddingText);

  const payload: QdrantPayload = {
    entryId: entry.id,
    content: structured.content,
    summary: structured.summary,
    tags: structured.tags,
    mood: structured.mood,
    timestamp: entry.timestamp,
    type: entry.type,
    thumbnailUrl: entry.thumbnailUrl,
  };

  await upsertEmbedding(entry.id, vector, payload);
  console.log(`[AI Pipeline] ✓ Text entry processed: ${entry.id}`);
}

export async function processAudioEntry(entryId: string): Promise<void> {
  const entry = getEntryById(entryId);
  if (!entry || entry.type !== 'audio' || !entry.filePath) {
    console.error(`[AI Pipeline] Audio entry ${entryId} not found or missing file`);
    return;
  }

  try {
    const audioBuffer = await fs.readFile(entry.filePath);
    const base64 = audioBuffer.toString('base64');
    
    const transcription = await transcribeAudio(base64);
    if (!transcription) {
      console.error(`[AI Pipeline] No transcription for ${entryId}`);
      return;
    }

    updateEntrySourceText(entryId, transcription);

    const structured = await structureTextEntry(transcription);

    updateEntryAnalysis(
      entryId,
      structured.title,
      structured.content,
      structured.summary,
      structured.mood,
      structured.tags
    );

    const embeddingText = [
      structured.title,
      structured.content,
      structured.summary,
      ...structured.tags,
    ].filter(Boolean).join(', ');

    const vector = await generateEmbedding(embeddingText);

    const payload: QdrantPayload = {
      entryId: entry.id,
      content: structured.content,
      summary: structured.summary,
      tags: structured.tags,
      mood: structured.mood,
      timestamp: entry.timestamp,
      type: entry.type,
      thumbnailUrl: entry.thumbnailUrl,
    };

    await upsertEmbedding(entry.id, vector, payload);
    console.log(`[AI Pipeline] ✓ Audio entry processed: ${entryId}`);
  } catch (err) {
    console.error(`[AI Pipeline] Error processing audio ${entryId}:`, (err as Error).message);
  }
}

export async function processImageEntry(entryId: string): Promise<void> {
  const entry = getEntryById(entryId);
  if (!entry || entry.type !== 'image' || !entry.filePath) {
    console.error(`[AI Pipeline] Image entry ${entryId} not found or missing file`);
    return;
  }

  try {
    const imageBuffer = await fs.readFile(entry.filePath);
    const base64 = imageBuffer.toString('base64');

    const analysis = await analyzeImage(base64);

    const content = analysis.description;
    const structured = await structureTextEntry(content);

    updateEntryAnalysis(
      entryId,
      structured.title,
      content,
      structured.summary,
      structured.mood,
      analysis.tags
    );

    const embeddingText = [
      content,
      ...analysis.tags,
      ...(analysis.objects ?? []),
    ].join(', ');

    const vector = await generateEmbedding(embeddingText);

    const payload: QdrantPayload = {
      entryId: entry.id,
      content,
      summary: structured.summary,
      tags: analysis.tags,
      mood: structured.mood,
      timestamp: entry.timestamp,
      type: entry.type,
      thumbnailUrl: entry.thumbnailUrl,
    };

    await upsertEmbedding(entry.id, vector, payload);
    console.log(`[AI Pipeline] ✓ Image entry processed: ${entryId}`);
  } catch (err) {
    console.error(`[AI Pipeline] Error processing image ${entryId}:`, (err as Error).message);
  }
}

export async function processDocumentEntry(entryId: string): Promise<void> {
  const entry = getEntryById(entryId);
  if (!entry || entry.type !== 'document' || !entry.filePath) {
    console.error(`[AI Pipeline] Document entry ${entryId} not found or missing file`);
    return;
  }

  try {
    const content = await extractTextFromDocument(entry.filePath);
    if (!content) {
      console.error(`[AI Pipeline] Could not extract text from ${entryId}`);
      return;
    }

    updateEntrySourceText(entryId, content);

    const structured = await structureTextEntry(content);

    updateEntryAnalysis(
      entryId,
      structured.title,
      structured.content,
      structured.summary,
      structured.mood,
      structured.tags
    );

    const embeddingText = [
      structured.title,
      structured.content,
      structured.summary,
      ...structured.tags,
    ].filter(Boolean).join(', ');

    const vector = await generateEmbedding(embeddingText);

    const payload: QdrantPayload = {
      entryId: entry.id,
      content: structured.content,
      summary: structured.summary,
      tags: structured.tags,
      mood: structured.mood,
      timestamp: entry.timestamp,
      type: entry.type,
      thumbnailUrl: entry.thumbnailUrl,
    };

    await upsertEmbedding(entry.id, vector, payload);
    console.log(`[AI Pipeline] ✓ Document entry processed: ${entryId}`);
  } catch (err) {
    console.error(`[AI Pipeline] Error processing document ${entryId}:`, (err as Error).message);
  }
}

async function extractTextFromDocument(filepath: string): Promise<string | null> {
  const ext = filepath.split('.').pop()?.toLowerCase();
  
  if (ext === 'txt' || ext === 'md') {
    return fs.readFile(filepath, 'utf-8');
  }

  console.log(`[AI Pipeline] Document type ${ext} text extraction not fully implemented`);
  return null;
}

export async function reanalyzeEntry(entryId: string): Promise<void> {
  await deleteEmbedding(entryId).catch(() => null);
  
  const entry = getEntryById(entryId);
  if (!entry) {
    console.error(`[AI Pipeline] Entry ${entryId} not found for reanalysis`);
    return;
  }

  switch (entry.type) {
    case 'text':
      if (entry.sourceText) {
        await processTextEntry(entry.sourceText);
      }
      break;
    case 'audio':
      await processAudioEntry(entryId);
      break;
    case 'image':
      await processImageEntry(entryId);
      break;
    case 'document':
      await processDocumentEntry(entryId);
      break;
    default:
      console.log(`[AI Pipeline] Reanalysis not supported for type: ${entry.type}`);
  }
}