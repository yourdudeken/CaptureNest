import { FastifyPluginAsync } from 'fastify';
import { 
  listEntries, 
  getEntryById, 
  deleteEntry,
  saveTextEntry,
  saveAudioEntry,
  saveImageEntry,
  saveDocumentEntry,
  saveVideoEntry
} from '../../services/media/entryService';
import { processTextEntry, processAudioEntry, processImageEntry, processDocumentEntry, reanalyzeEntry } from '../../services/ai/analysisPipeline';
import { EntryType } from '../../types';

const entryRoutes: FastifyPluginAsync = async (fastify) => {

  /**
   * GET /api/entries
   * Query: type, limit, offset, aiProcessed, tag
   */
  fastify.get('/', async (req, reply) => {
    const query = req.query as {
      type?: EntryType;
      limit?: number;
      offset?: number;
      aiProcessed?: boolean;
      tag?: string;
    };

    const result = listEntries({
      type: query.type,
      limit: query.limit ? parseInt(String(query.limit), 10) : undefined,
      offset: query.offset ? parseInt(String(query.offset), 10) : undefined,
      aiProcessed: query.aiProcessed === true ? true : query.aiProcessed === false ? false : undefined,
      tag: query.tag,
    });

    return reply.send(result);
  });

  /**
   * GET /api/entries/:id
   */
  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const entry = getEntryById(id);

    if (!entry) {
      return reply.code(404).send({ error: 'Entry not found' });
    }

    return reply.send(entry);
  });

  /**
   * POST /api/entries/text
   * Body: { content: string }
   */
  fastify.post('/text', async (req, reply) => {
    const body = req.body as { content?: string };

    if (!body?.content?.trim()) {
      return reply.code(400).send({ error: 'content is required' });
    }

    try {
      await processTextEntry(body.content);
      return reply.code(201).send({ status: 'processing' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to process text entry' });
    }
  });

  /**
   * POST /api/entries/audio
   * Body: multipart form with audio file
   */
  fastify.post('/audio', async (req, reply) => {
    try {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({ error: 'Audio file is required' });
      }

      const buffer = await file.toBuffer();
      const duration = req.headers['x-duration'] ? parseFloat(String(req.headers['x-duration'])) : undefined;

      const entry = await saveAudioEntry(buffer, file.filename, duration);
      
      processAudioEntry(entry.id).catch(err => {
        fastify.log.error(`[Entry] Background audio processing failed: ${err}`);
      });

      return reply.code(201).send(entry);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to save audio entry' });
    }
  });

  /**
   * POST /api/entries/image
   * Body: multipart form with image file
   */
  fastify.post('/image', async (req, reply) => {
    try {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({ error: 'Image file is required' });
      }

      const buffer = await file.toBuffer();
      const entry = await saveImageEntry(buffer, file.filename);

      processImageEntry(entry.id).catch(err => {
        fastify.log.error(`[Entry] Background image processing failed: ${err}`);
      });

      return reply.code(201).send(entry);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to save image entry' });
    }
  });

  /**
   * POST /api/entries/video
   * Body: multipart form with video file
   */
  fastify.post('/video', async (req, reply) => {
    try {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({ error: 'Video file is required' });
      }

      const buffer = await file.toBuffer();
      const duration = req.headers['x-duration'] ? parseFloat(String(req.headers['x-duration'])) : undefined;
      
      const ext = file.filename.split('.').pop() || 'mp4';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { VIDEOS_DIR } = await import('../../services/media/entryService');
      const filepath = `${VIDEOS_DIR}/${filename}`;
      const fs = await import('fs-extra');
      await fs.writeFile(filepath, buffer);

      const entry = await saveVideoEntry(filepath, file.filename, duration);

      return reply.code(201).send(entry);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to save video entry' });
    }
  });

  /**
   * POST /api/entries/document
   * Body: multipart form with document file
   */
  fastify.post('/document', async (req, reply) => {
    try {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({ error: 'Document file is required' });
      }

      const buffer = await file.toBuffer();
      const entry = await saveDocumentEntry(buffer, file.filename);

      processDocumentEntry(entry.id).catch(err => {
        fastify.log.error(`[Entry] Background document processing failed: ${err}`);
      });

      return reply.code(201).send(entry);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to save document entry' });
    }
  });

  /**
   * DELETE /api/entries/:id
   */
  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const deleted = await deleteEntry(id);

    if (!deleted) {
      return reply.code(404).send({ error: 'Entry not found' });
    }

    return reply.send({ status: 'deleted' });
  });

  /**
   * POST /api/entries/:id/reanalyze
   */
  fastify.post('/:id/reanalyze', async (req, reply) => {
    const { id } = req.params as { id: string };
    const entry = getEntryById(id);

    if (!entry) {
      return reply.code(404).send({ error: 'Entry not found' });
    }

    try {
      await reanalyzeEntry(id);
      return reply.send({ status: 'reanalyzing' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to reanalyze entry' });
    }
  });
};

export default entryRoutes;