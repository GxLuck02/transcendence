import db from '../db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export default async function authRoutes(app) {
    // ROUTE 1: Register
    app.post('/api/users/register/', async (request, reply) => {
      const { username, email, display_name, password, password_confirm } = request.body || {};

      // Champs requis
      if (!username || !email || !display_name || !password || !password_confirm) {
        return reply.code(400).send({ error: 'Missing required fields' });
      }

      // Validation (adaptable si tu veux des règles plus strictes)
      if (username.length < 3) {
        return reply.code(400).send({ error: 'Username must be at least 3 characters' });
      }

      if (!email.includes('@')) {
        return reply.code(400).send({ error: 'Invalid email' });
      }

      if (password !== password_confirm) {
        return reply.code(400).send({ error: 'Passwords do not match' });
      }

      // Vérifier si username ou email existe
      const exists = db.prepare(
        'SELECT id FROM users WHERE username = ? OR email = ?'
      ).get(username.toLowerCase(), email.toLowerCase());

      if (exists) {
        return reply.code(400).send({ error: 'Username or email already exists' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Insérer dans SQLite
      const result = db.prepare(`
        INSERT INTO users (username, email, display_name, password_hash, last_seen, is_online)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
      `).run(
        username.trim().toLowerCase(),
        email.trim().toLowerCase(),
        display_name.trim(),
        passwordHash
      );

      // Récupérer user depuis DB
      const user = db.prepare('SELECT * FROM users WHERE id = ?')
                     .get(result.lastInsertRowid);

      // Générer tokens
      const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: '1h' });
      const refreshToken = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

      // Retourner la réponse
      reply.send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          avatar: user.avatar,
          wins: user.wins,
          losses: user.losses,
          created_at: user.created_at,
        },
        tokens: {
          access: accessToken,
          refresh: refreshToken,
        },
      });
    });

    // ROUTE 2: Login
    app.post('/api/users/login/', async (request, reply) => {
      const { username, password } = request.body || {};

      // Vérification des champs
      if (!username || !password) {
        return reply.code(400).send({ error: 'Missing credentials' });
      }

      // Récupérer l'utilisateur avec le username
      const user = db.prepare('SELECT * FROM users WHERE username = ?')
                     .get(username.trim().toLowerCase());

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Vérifier le password hash
      const ok = await verifyPassword(user.password_hash, password);
      if (!ok) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Marquer l'utilisateur comme online
      db.prepare('UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?')
        .run(user.id);

      // Générer tokens
      const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: '1h' });
      const refreshToken = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

      // Réponse
      reply.send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          avatar: user.avatar,
          wins: user.wins,
          losses: user.losses,
          created_at: user.created_at
        },
        tokens: {
          access: accessToken,
          refresh: refreshToken,
        },
      });
    });

    // ROUTE 3: Me (user profile from JWT)
    app.get('/api/users/me/', async (request, reply) => {
      try {
        // Vérifie le token
        const decoded = await request.jwtVerify();  // -> { userId: ... }

        // Récupère le user depuis SQLite
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);

        // Si le token est valide mais l'utilisateur n'existe plus → DB reset ?
        if (!user) {
          return reply.code(401).send({ error: 'User no longer exists' });
        }

        // Renvoie le profil (sans password_hash)
        reply.send({
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          avatar: user.avatar,
          wins: user.wins,
          losses: user.losses,
          is_online: user.is_online,
          last_seen: user.last_seen,
          created_at: user.created_at
        });

      } catch (err) {
        return reply.code(401).send({ error: 'Invalid or missing token' });
      }
    });
}
