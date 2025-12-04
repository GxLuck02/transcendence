import { nanoid } from 'nanoid';
import db from '../db.js';

export default async function pongRoutes(app) {
  // Create a new pong match
  app.post('/api/pong/matches/create/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const { player2_id, game_mode } = request.body || {};
    const player1_id = request.user.userId;

    if (!game_mode) {
      return reply.code(400).send({ error: 'game_mode is required' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO pong_matches (player1_id, player2_id, game_mode, status)
        VALUES (?, ?, ?, 'pending')
      `);
      const result = stmt.run(player1_id, player2_id || null, game_mode);

      const match = db.prepare('SELECT * FROM pong_matches WHERE id = ?').get(result.lastInsertRowid);
      reply.code(201).send(match);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Failed to create match' });
    }
  });

  // Get match details
  app.get('/api/pong/matches/:id/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const matchId = Number(request.params.id);
    const match = db.prepare('SELECT * FROM pong_matches WHERE id = ?').get(matchId);

    if (!match) {
      return reply.code(404).send({ error: 'Match not found' });
    }

    reply.send(match);
  });

  // Update match result
  app.post('/api/pong/matches/:id/result/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const matchId = Number(request.params.id);
    const userId = request.user.userId;
    const { winner_id, player1_score, player2_score } = request.body || {};

    const match = db.prepare('SELECT * FROM pong_matches WHERE id = ?').get(matchId);
    if (!match) {
      return reply.code(404).send({ error: 'Match not found' });
    }

    // SECURITY: Verify user is a participant in this match (IDOR protection)
    if (match.player1_id !== userId && match.player2_id !== userId) {
      return reply.code(403).send({ error: 'You are not a participant in this match' });
    }

    // SECURITY: Validate winner_id is one of the players
    if (winner_id && winner_id !== match.player1_id && winner_id !== match.player2_id) {
      return reply.code(400).send({ error: 'Invalid winner_id' });
    }

    // SECURITY: Validate score bounds
    const score1 = Number(player1_score) || 0;
    const score2 = Number(player2_score) || 0;
    if (score1 < 0 || score1 > 100 || score2 < 0 || score2 > 100) {
      return reply.code(400).send({ error: 'Invalid score values' });
    }

    try {
      const updateStmt = db.prepare(`
        UPDATE pong_matches
        SET winner_id = ?, player1_score = ?, player2_score = ?, status = 'completed'
        WHERE id = ?
      `);
      updateStmt.run(winner_id, score1, score2, matchId);

      // Update user stats
      if (winner_id === match.player1_id) {
        db.prepare('UPDATE users SET pong_wins = pong_wins + 1, wins = wins + 1 WHERE id = ?').run(match.player1_id);
        if (match.player2_id) {
          db.prepare('UPDATE users SET pong_losses = pong_losses + 1, losses = losses + 1 WHERE id = ?').run(match.player2_id);
        }
      } else if (winner_id === match.player2_id) {
        db.prepare('UPDATE users SET pong_wins = pong_wins + 1, wins = wins + 1 WHERE id = ?').run(match.player2_id);
        db.prepare('UPDATE users SET pong_losses = pong_losses + 1, losses = losses + 1 WHERE id = ?').run(match.player1_id);
      }

      const updatedMatch = db.prepare('SELECT * FROM pong_matches WHERE id = ?').get(matchId);
      reply.send(updatedMatch);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Failed to update match' });
    }
  });

  // Create a room for remote play
  app.post('/api/pong/rooms/create/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const { match_id } = request.body || {};
    const host_id = request.user.userId;

    if (!match_id) {
      return reply.code(400).send({ error: 'match_id is required' });
    }

    const roomCode = nanoid(6).toUpperCase();

    try {
      const stmt = db.prepare(`
        INSERT INTO pong_rooms (room_code, match_id, host_id, status)
        VALUES (?, ?, ?, 'waiting')
      `);
      const result = stmt.run(roomCode, match_id, host_id);

      const room = db.prepare('SELECT * FROM pong_rooms WHERE id = ?').get(result.lastInsertRowid);
      reply.code(201).send({
        id: room.id,
        room_code: room.room_code,
        match_id: room.match_id,
        status: room.status
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Failed to create room' });
    }
  });

  // Get room details
  app.get('/api/pong/rooms/:code/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const roomCode = request.params.code;
    const room = db.prepare('SELECT * FROM pong_rooms WHERE room_code = ?').get(roomCode);

    if (!room) {
      return reply.code(404).send({ error: 'Room not found' });
    }

    reply.send(room);
  });

  // Join matchmaking queue
  app.post('/api/pong/matchmaking/join/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    // Check if already in queue
    const existing = db.prepare('SELECT * FROM pong_queue WHERE user_id = ?').get(userId);
    if (existing) {
      return reply.send({ status: 'waiting', message: 'Already in queue' });
    }

    // Add to queue
    db.prepare('INSERT INTO pong_queue (user_id) VALUES (?)').run(userId);

    // Try to match with another player
    const waiting = db.prepare(`
      SELECT user_id FROM pong_queue
      WHERE user_id != ?
      ORDER BY joined_at ASC
      LIMIT 1
    `).get(userId);

    if (waiting) {
      // Create match
      const matchStmt = db.prepare(`
        INSERT INTO pong_matches (player1_id, player2_id, game_mode, status)
        VALUES (?, ?, '2p_remote', 'pending')
      `);
      const matchResult = matchStmt.run(userId, waiting.user_id);
      const matchId = matchResult.lastInsertRowid;

      // Create room
      const roomCode = nanoid(6).toUpperCase();
      db.prepare(`
        INSERT INTO pong_rooms (room_code, match_id, host_id, guest_id, status)
        VALUES (?, ?, ?, ?, 'ready')
      `).run(roomCode, matchId, userId, waiting.user_id);

      // Remove both from queue
      db.prepare('DELETE FROM pong_queue WHERE user_id IN (?, ?)').run(userId, waiting.user_id);

      // Get opponent info
      const opponent = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(waiting.user_id);

      reply.send({
        status: 'matched',
        room_code: roomCode,
        match_id: matchId,
        opponent: opponent
      });
    } else {
      reply.send({ status: 'waiting', message: 'Waiting for opponent' });
    }
  });

  // Get matchmaking status
  app.get('/api/pong/matchmaking/status/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    const inQueue = db.prepare('SELECT * FROM pong_queue WHERE user_id = ?').get(userId);
    if (!inQueue) {
      return reply.send({ status: 'not_in_queue' });
    }

    // Check if matched while waiting
    const match = db.prepare(`
      SELECT pm.id, pm.player1_id, pm.player2_id, pr.room_code
      FROM pong_matches pm
      LEFT JOIN pong_rooms pr ON pr.match_id = pm.id
      WHERE (pm.player1_id = ? OR pm.player2_id = ?)
      AND pm.status = 'pending'
      ORDER BY pm.created_at DESC
      LIMIT 1
    `).get(userId, userId);

    if (match && match.room_code) {
      // Remove from queue
      db.prepare('DELETE FROM pong_queue WHERE user_id = ?').run(userId);

      const opponentId = match.player1_id === userId ? match.player2_id : match.player1_id;
      const opponent = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(opponentId);

      reply.send({
        status: 'matched',
        room_code: match.room_code,
        match_id: match.id,
        opponent: opponent
      });
    } else {
      reply.send({ status: 'waiting' });
    }
  });

  // Leave matchmaking queue
  app.post('/api/pong/matchmaking/leave/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    const result = db.prepare('DELETE FROM pong_queue WHERE user_id = ?').run(userId);

    if (result.changes === 0) {
      return reply.code(404).send({ error: 'Not in queue' });
    }

    reply.send({ message: 'Left queue successfully' });
  });

  // Get match history
  app.get('/api/pong/matches/history/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    const matches = db.prepare(`
      SELECT
        pm.*,
        u1.username as player1_username,
        u1.display_name as player1_display_name,
        u2.username as player2_username,
        u2.display_name as player2_display_name
      FROM pong_matches pm
      LEFT JOIN users u1 ON u1.id = pm.player1_id
      LEFT JOIN users u2 ON u2.id = pm.player2_id
      WHERE (pm.player1_id = ? OR pm.player2_id = ?)
      AND pm.status = 'completed'
      ORDER BY pm.created_at DESC
      LIMIT 50
    `).all(userId, userId);

    reply.send(matches);
  });
}
