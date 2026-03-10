import axios from 'axios';
import { AIAnalysis } from '../../types';
import { getSettings } from '../settings/settingsService';

// ─────────────────────────────────────────────────────────────────────────────
// Ollama AI Analysis Service
//
// Uses a local Ollama server with a vision-capable model (e.g. LLaVA) to:
//  • Generate natural-language descriptions
//  • Extract object tags
//  • Produce text embeddings for semantic search
//
// Reference: https://ollama.com/library/llava
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyse a single image by sending it to the Ollama vision model.
 * The image must be provided as a base64-encoded JPEG/PNG string.
 */
export async function analyzeImage(base64Image: string): Promise<AIAnalysis> {
  const settings = getSettings();
  const url = `${settings.ollamaUrl}/api/generate`;

  const prompt = `You are an AI vision assistant for a surveillance and media capture system.

Analyze this image carefully and respond ONLY with a valid JSON object (no markdown, no explanation) in exactly this format:

{
  "description": "A detailed one-sentence description of what you see",
  "tags": ["tag1", "tag2", "tag3"],
  "objects": ["object1", "object2"],
  "scene": "indoor/outdoor/unknown"
}

Rules:
- Description must be accurate and specific (mention people, objects, actions)
- Tags should be lowercase, single words or short phrases
- Objects should list all identifiable items
- Scene must be one of: indoor, outdoor, unknown`;

  try {
    const response = await axios.post(
      url,
      {
        model: settings.ollamaModel,
        prompt,
        images: [base64Image],
        stream: false,
        options: { temperature: 0.1 },
      },
      { timeout: 120_000 }   // 2 minutes – vision models can be slow
    );

    const raw: string = response.data.response || '';

    // Extract JSON from response (model may wrap it in markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Could not parse JSON from model response: ${raw.slice(0, 200)}`);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<AIAnalysis>;

    return {
      description: parsed.description || 'No description available',
      tags:    Array.isArray(parsed.tags)    ? parsed.tags    : [],
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
      scene:   parsed.scene || 'unknown',
    };
  } catch (err) {
    console.error('[Ollama] Analysis error:', err instanceof Error ? err.message : err);
    // Return a graceful fallback so the media item is still saved
    return {
      description: 'AI analysis unavailable',
      tags: [],
      objects: [],
      scene: 'unknown',
    };
  }
}

/**
 * Generate a text embedding using the Ollama embedding endpoint.
 * Falls back to nomic-embed-text if the vision model doesn't support embeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const settings  = getSettings();
  const embedUrl  = `${settings.ollamaUrl}/api/embeddings`;
  // Use a dedicated embedding model if available; fall back to the vision model
  const model = process.env.EMBED_MODEL || 'nomic-embed-text';

  try {
    const response = await axios.post(
      embedUrl,
      { model, prompt: text },
      { timeout: 30_000 }
    );
    return response.data.embedding as number[];
  } catch (err) {
    console.error('[Ollama] Embedding error:', err instanceof Error ? err.message : err);
    // Return a zero vector so Qdrant operations don't fail completely
    return new Array(768).fill(0);
  }
}

/** Health-check the Ollama server */
export async function checkOllamaHealth(): Promise<boolean> {
  const settings = getSettings();
  try {
    await axios.get(settings.ollamaUrl, { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/** List available models from Ollama */
export async function listOllamaModels(): Promise<string[]> {
  const settings = getSettings();
  try {
    const res = await axios.get(`${settings.ollamaUrl}/api/tags`, { timeout: 10_000 });
    return (res.data.models as Array<{ name: string }>).map(m => m.name);
  } catch {
    return [];
  }
}
