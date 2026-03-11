import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/database';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Routes
// ─────────────────────────────────────────────────────────────────────────────

const authRoutes: FastifyPluginAsync = async (app) => {
  // Check if system is already set up
  app.get('/status', async (_req, reply) => {
    const userCount = (getDb().prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
    return reply.send({ isSetup: userCount > 0 });
  });

  // Setup initial admin account
  app.post('/setup', async (req, reply) => {
    const userCount = (getDb().prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
    if (userCount > 0) {
      return reply.code(400).send({ error: 'System is already setup' });
    }

    const { username, password } = req.body as any;
    if (!username || !password || password.length < 6) {
      return reply.code(400).send({ error: 'Valid username and 6+ char password required' });
    }

    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);

    getDb().prepare(`
      INSERT INTO users (id, username, password_hash)
      VALUES (?, ?, ?)
    `).run(id, username, hash);

    const token = app.jwt.sign({ id, username });
    return reply
      .setCookie('token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: false // Homelabs usually use HTTP IP addresses
      })
      .send({ success: true, user: { id, username } });
  });

  // Login
  app.post('/login', async (req, reply) => {
    const { username, password } = req.body as any;
    
    const user = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign({ id: user.id, username: user.username });
    return reply
      .setCookie('token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: false // Homelabs usually use HTTP IP addresses
      })
      .send({ success: true, user: { id: user.id, username: user.username } });
  });

  // Logout
  app.post('/logout', async (_req, reply) => {
    return reply
      .clearCookie('token', { path: '/' })
      .send({ success: true });
  });

  // Get current user (me)
  app.get('/me', async (req, reply) => {
    try {
      await req.jwtVerify();
      return reply.send({ user: req.user });
    } catch (err) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }
  });
};

export default authRoutes;
