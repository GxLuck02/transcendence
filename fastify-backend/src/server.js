import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCookie from '@fastify/cookie';
import db from './db.js';
import { hashPassword, verifyPassword } from './utils/password.js';
import pongRoutes from './routes/pong.js';
import chatRoutes from './routes/chat.js';
import blockchainRoutes from './routes/blockchain.js';
import rpsRoutes from './routes/rps.js';
import oauthRoutes from './routes/oauth.js';
import pongWebSocket from './websockets/pong.js';
import chatWebSocket from './websockets/chat.js';

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me-with-secure-secret';
const PORT = process.env.PORT || 8000;

const app = Fastify({
  logger: true,
});

// CORS configuration
app.register(fastifyCors, {
  origin: ['https://localhost:8443', 'https://127.0.0.1:8443'],
  credentials: true,
});

// JWT configuration
app.register(fastifyJwt, {
  secret: JWT_SECRET,
});

// Authentication decorator
app.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Invalid or missing token' });
  }
});

// Cookie support for OAuth
app.register(fastifyCookie);

// WebSocket support
app.register(fastifyWebsocket);

// Helper functions
const userColumnNames = [
  'id',
  'username',
  'email',
  'display_name',
  'avatar',
  'wins',
  'losses',
  'pong_wins',
  'pong_losses',
  'rps_wins',
  'rps_losses',
  'is_online',
  'last_seen',
  'created_at',
  'updated_at'
];

const buildUserColumns = (alias = 'users') =>
  userColumnNames.map((column) => `${alias}.${column} as ${column}`).join(', ');

const userColumns = buildUserColumns();

const findUserByUsername = db.prepare(`SELECT ${userColumns} FROM users WHERE username = ?`);
const findUserById = db.prepare(`SELECT ${userColumns} FROM users WHERE id = ?`);

const serializeUser = (row) => {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
};

function calcWinRate(wins = 0, losses = 0) {
  const total = Number(wins) + Number(losses);
  if (total === 0) return 0;
  return Math.round((Number(wins) / total) * 10000) / 100;
}

// ==================== USER ROUTES ====================

// Register
app.post('/api/users/register/', async (request, reply) => {
  const { username, email, display_name, password, password_confirm } = request.body || {};
  if (!username || !email || !display_name || !password || !password_confirm) {
    return reply.code(400).send({ error: 'Missing required fields' });
  }
  if (password !== password_confirm) {
    return reply.code(400).send({ error: 'Passwords do not match' });
  }

  const passwordHash = await hashPassword(password);
  try {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, display_name, password_hash, last_seen, is_online)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
    `);
    const result = stmt.run(username.trim().toLowerCase(), email.trim().toLowerCase(), display_name.trim(), passwordHash);
    const user = findUserById.get(result.lastInsertRowid);
    const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: '1h' });
    const refreshToken = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });
    reply.send({
      user: serializeUser(user),
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
    });
  } catch (error) {
    request.log.error(error);
    reply.code(400).send({ error: 'Username, email ou display_name déjà utilisé' });
  }
});

// Login
app.post('/api/users/login/', async (request, reply) => {
  const { username, password } = request.body || {};
  if (!username || !password) {
    return reply.code(400).send({ error: 'Missing credentials' });
  }

  const user = findUserByUsername.get(username.trim().toLowerCase());
  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }
  const rows = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
  const isValid = await verifyPassword(rows?.password_hash, password);
  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  db.prepare('UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: '1h' });
  const refreshToken = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });
  reply.send({
    user: serializeUser(findUserById.get(user.id)),
    tokens: {
      access: accessToken,
      refresh: refreshToken,
    },
  });
});

// Logout
app.post('/api/users/logout/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const userId = request.user.userId;
  db.prepare('UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
  reply.send({ message: 'Successfully logged out' });
});

// Get current user
app.get('/api/users/me/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const user = findUserById.get(request.user.userId);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  reply.send(serializeUser(user));
});

// Get friends list
app.get('/api/users/friends/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const stmt = db.prepare(`
    SELECT ${buildUserColumns('u')}
    FROM friendships f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `);
  const friends = stmt.all(request.user.userId);
  const result = friends.map(friend => ({ friend: serializeUser(friend) }));
  reply.send(result);
});

// Add friend
app.post('/api/users/friends/:id/add/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const friendId = Number(request.params.id);
  if (friendId === request.user.userId) {
    return reply.code(400).send({ error: 'Cannot add yourself' });
  }
  const friend = findUserById.get(friendId);
  if (!friend) {
    return reply.code(404).send({ error: 'User not found' });
  }
  const insert = db.prepare(`INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)`);
  insert.run(request.user.userId, friendId);
  insert.run(friendId, request.user.userId);
  reply.code(201).send({ message: 'Friend added' });
});

// Remove friend
app.delete('/api/users/friends/:id/remove/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const friendId = Number(request.params.id);
  const removeStmt = db.prepare('DELETE FROM friendships WHERE user_id = ? AND friend_id = ?');
  const result = removeStmt.run(request.user.userId, friendId);
  removeStmt.run(friendId, request.user.userId);
  if (result.changes === 0) {
    return reply.code(404).send({ error: 'Friendship not found' });
  }
  reply.send({ message: 'Friend removed' });
});

// Get blocked users
app.get('/api/users/blocked/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const stmt = db.prepare(`
    SELECT ${buildUserColumns('u')}
    FROM blocked_users b
    JOIN users u ON u.id = b.blocked_id
    WHERE b.blocker_id = ?
    ORDER BY b.created_at DESC
  `);
  const blocked = stmt.all(request.user.userId);
  const result = blocked.map(user => ({ blocked: serializeUser(user) }));
  reply.send(result);
});

// Block user
app.post('/api/users/block/:id/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const blockedId = Number(request.params.id);
  if (blockedId === request.user.userId) {
    return reply.code(400).send({ error: 'Cannot block yourself' });
  }
  const target = findUserById.get(blockedId);
  if (!target) {
    return reply.code(404).send({ error: 'User not found' });
  }
  const insert = db.prepare('INSERT OR IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)');
  insert.run(request.user.userId, blockedId);
  // Remove friendship if any
  db.prepare('DELETE FROM friendships WHERE user_id = ? AND friend_id = ?').run(request.user.userId, blockedId);
  db.prepare('DELETE FROM friendships WHERE user_id = ? AND friend_id = ?').run(blockedId, request.user.userId);
  reply.code(201).send({ message: 'User blocked' });
});

// Unblock user
app.delete('/api/users/unblock/:id/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const blockedId = Number(request.params.id);
  const removeStmt = db.prepare('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?');
  const result = removeStmt.run(request.user.userId, blockedId);
  if (result.changes === 0) {
    return reply.code(404).send({ error: 'User not blocked' });
  }
  reply.send({ message: 'User unblocked' });
});

// Get current user stats
app.get('/api/users/stats/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const user = findUserById.get(request.user.userId);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  reply.send({
    username: user.username,
    display_name: user.display_name,
    avatar: user.avatar,
    wins: user.wins,
    losses: user.losses,
    win_rate: calcWinRate(user.wins, user.losses),
    pong_wins: user.pong_wins,
    pong_losses: user.pong_losses,
    pong_win_rate: calcWinRate(user.pong_wins, user.pong_losses),
    rps_wins: user.rps_wins,
    rps_losses: user.rps_losses,
    rps_win_rate: calcWinRate(user.rps_wins, user.rps_losses),
  });
});

// Get user stats by ID
app.get('/api/users/:id/stats/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const userId = Number(request.params.id);
  const user = findUserById.get(userId);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  reply.send({
    username: user.username,
    display_name: user.display_name,
    avatar: user.avatar,
    wins: user.wins,
    losses: user.losses,
    win_rate: calcWinRate(user.wins, user.losses),
    pong_wins: user.pong_wins,
    pong_losses: user.pong_losses,
    pong_win_rate: calcWinRate(user.pong_wins, user.pong_losses),
    rps_wins: user.rps_wins,
    rps_losses: user.rps_losses,
    rps_win_rate: calcWinRate(user.rps_wins, user.rps_losses),
  });
});

// Get profile
app.get('/api/users/profile/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const user = findUserById.get(request.user.userId);
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  reply.send(serializeUser(user));
});

// Update profile
app.put('/api/users/profile/', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { email, display_name } = request.body || {};
  if (!email && !display_name) {
    return reply.code(400).send({ error: 'Nothing to update' });
  }
  try {
    const stmt = db.prepare(`
      UPDATE users
      SET
        email = COALESCE(?, email),
        display_name = COALESCE(?, display_name)
      WHERE id = ?
    `);
    stmt.run(email?.trim().toLowerCase(), display_name?.trim(), request.user.userId);
    const user = findUserById.get(request.user.userId);
    reply.send(serializeUser(user));
  } catch (error) {
    request.log.error(error);
    reply.code(400).send({ error: 'Adresse mail ou display_name déjà utilisé' });
  }
});

// ==================== REGISTER MODULE ROUTES ====================

app.register(pongRoutes);
app.register(chatRoutes);
app.register(blockchainRoutes);
app.register(rpsRoutes);
app.register(oauthRoutes);

// ==================== REGISTER WEBSOCKETS ====================

app.register(pongWebSocket);
app.register(chatWebSocket);

// ==================== START SERVER ====================

const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`✅ Fastify server running on port ${PORT}`);
    app.log.info(`📦 Database: SQLite (as per ft_transcendence requirements)`);
    app.log.info(`🔐 JWT secret configured`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
