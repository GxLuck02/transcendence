import db from '../db.js';

export default async function rpsRoutes(app) {
  // Create a new RPS match
  app.post('/api/rps/matches/create/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const { player2_id } = request.body || {};
    const player1_id = request.user.userId;

    try {
      const stmt = db.prepare(`
        INSERT INTO rps_matches (player1_id, player2_id, status)
        VALUES (?, ?, 'pending')
      `);
      const result = stmt.run(player1_id, player2_id || null);

      const match = db.prepare('SELECT * FROM rps_matches WHERE id = ?').get(result.lastInsertRowid);
      reply.code(201).send(match);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Failed to create match' });
    }
  });

  // Make a choice (rock, paper, scissors)
  app.post('/api/rps/matches/:id/choice/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const matchId = Number(request.params.id);
    const userId = request.user.userId;
    const { choice } = request.body || {};

    if (!choice || !['rock', 'paper', 'scissors'].includes(choice)) {
      return reply.code(400).send({ error: 'Invalid choice. Must be rock, paper, or scissors' });
    }

    const match = db.prepare('SELECT * FROM rps_matches WHERE id = ?').get(matchId);
    if (!match) {
      return reply.code(404).send({ error: 'Match not found' });
    }

    if (match.status !== 'pending') {
      return reply.code(400).send({ error: 'Match already completed' });
    }

    try {
      if (userId === match.player1_id && !match.player1_choice) {
        db.prepare('UPDATE rps_matches SET player1_choice = ? WHERE id = ?').run(choice, matchId);
      } else if (userId === match.player2_id && !match.player2_choice) {
        db.prepare('UPDATE rps_matches SET player2_choice = ? WHERE id = ?').run(choice, matchId);
      } else {
        return reply.code(400).send({ error: 'Invalid player or choice already made' });
      }

      // Check if both players have made their choice
      const updatedMatch = db.prepare('SELECT * FROM rps_matches WHERE id = ?').get(matchId);
      if (updatedMatch.player1_choice && updatedMatch.player2_choice) {
        // Determine winner
        const winner = determineWinner(updatedMatch.player1_choice, updatedMatch.player2_choice);
        let winnerId = null;

        if (winner === 1) {
          winnerId = updatedMatch.player1_id;
          db.prepare('UPDATE users SET rps_wins = rps_wins + 1, wins = wins + 1 WHERE id = ?').run(updatedMatch.player1_id);
          db.prepare('UPDATE users SET rps_losses = rps_losses + 1, losses = losses + 1 WHERE id = ?').run(updatedMatch.player2_id);
        } else if (winner === 2) {
          winnerId = updatedMatch.player2_id;
          db.prepare('UPDATE users SET rps_wins = rps_wins + 1, wins = wins + 1 WHERE id = ?').run(updatedMatch.player2_id);
          db.prepare('UPDATE users SET rps_losses = rps_losses + 1, losses = losses + 1 WHERE id = ?').run(updatedMatch.player1_id);
        }

        db.prepare('UPDATE rps_matches SET winner_id = ?, status = ? WHERE id = ?').run(
          winnerId,
          'completed',
          matchId
        );
      }

      const finalMatch = db.prepare('SELECT * FROM rps_matches WHERE id = ?').get(matchId);
      reply.send(finalMatch);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Failed to make choice' });
    }
  });

  // Get match details
  app.get('/api/rps/matches/:id/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const matchId = Number(request.params.id);
    const match = db.prepare('SELECT * FROM rps_matches WHERE id = ?').get(matchId);

    if (!match) {
      return reply.code(404).send({ error: 'Match not found' });
    }

    reply.send(match);
  });

  // Get match history
  app.get('/api/rps/matches/history/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    const matches = db.prepare(`
      SELECT
        rm.*,
        u1.username as player1_username,
        u1.display_name as player1_display_name,
        u2.username as player2_username,
        u2.display_name as player2_display_name
      FROM rps_matches rm
      LEFT JOIN users u1 ON u1.id = rm.player1_id
      LEFT JOIN users u2 ON u2.id = rm.player2_id
      WHERE (rm.player1_id = ? OR rm.player2_id = ?)
      AND rm.status = 'completed'
      ORDER BY rm.created_at DESC
      LIMIT 50
    `).all(userId, userId);

    reply.send(matches);
  });
}

function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return 0; // Draw

  if (
    (choice1 === 'rock' && choice2 === 'scissors') ||
    (choice1 === 'paper' && choice2 === 'rock') ||
    (choice1 === 'scissors' && choice2 === 'paper')
  ) {
    return 1; // Player 1 wins
  }

  return 2; // Player 2 wins
}
