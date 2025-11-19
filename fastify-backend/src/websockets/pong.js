import db from '../db.js';

// Store active Pong rooms
const rooms = new Map(); // roomCode -> { sockets: [{socket, userId, playerNumber, displayName}], gameState }

export default async function pongWebSocket(app) {
  app.get('/ws/pong/:room', { websocket: true }, (connection, req) => {
    const roomCode = req.params.room;
    const { socket } = connection;
    let userId = null;
    let playerNumber = null;
    let displayName = null;

    // Initialize room if it doesn't exist
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        sockets: [],
        gameState: {
          ball: { x: 400, y: 250, vx: 5, vy: 3 },
          paddle1: { y: 200 },
          paddle2: { y: 200 },
          score: { player1: 0, player2: 0 },
          status: 'waiting' // waiting, playing, finished
        }
      });
    }

    const room = rooms.get(roomCode);

    // Assign player number
    if (room.sockets.length === 0) {
      playerNumber = 1;
      room.gameState.status = 'waiting';
    } else if (room.sockets.length === 1) {
      playerNumber = 2;
      room.gameState.status = 'playing';
    } else {
      // Room is full
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Room is full'
      }));
      socket.close();
      return;
    }

    // Add socket to room
    const playerInfo = { socket, userId, playerNumber, displayName };
    room.sockets.push(playerInfo);

    // Send player assignment (snake_case as expected by frontend)
    socket.send(JSON.stringify({
      type: 'player_assigned',
      player_number: playerNumber,
      is_host: playerNumber === 1
    }));

    // Handle incoming messages
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'authenticate':
            // Authenticate user with JWT
            try {
              const decoded = app.jwt.verify(data.token);
              userId = decoded.userId;
              playerInfo.userId = userId;

              // Get user info
              const user = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(userId);
              displayName = user.display_name;
              playerInfo.displayName = displayName;

              // Notify ALL players (including self) about this player joining
              broadcastToRoom(roomCode, {
                type: 'player_joined',
                player_number: playerNumber,
                display_name: displayName,
                username: user.username
              });

              // If both players are authenticated, start the game
              if (room.sockets.length === 2 && room.sockets.every(p => p.userId !== null)) {
                room.gameState.status = 'playing';
                broadcastToRoom(roomCode, {
                  type: 'game_start',
                  message: 'Both players ready, game starting!'
                });
              }
            } catch (error) {
              socket.send(JSON.stringify({
                type: 'auth_error',
                message: 'Invalid token'
              }));
            }
            break;

          case 'paddle_move':
            // Update paddle position
            if (playerNumber === 1) {
              room.gameState.paddle1.y = data.y;
            } else if (playerNumber === 2) {
              room.gameState.paddle2.y = data.y;
            }

            // Broadcast to other player (snake_case)
            broadcastToRoom(roomCode, {
              type: 'paddle_move',
              player_number: playerNumber,
              y: data.y
            }, socket);
            break;

          case 'ball_update':
            // Only host (player 1) can update ball position
            if (playerNumber === 1 && data.ball) {
              room.gameState.ball = data.ball;

              // Broadcast as ball_state (snake_case)
              broadcastToRoom(roomCode, {
                type: 'ball_state',
                ball: data.ball
              }, socket);
            }
            break;

          case 'score_update':
            // Only host can update score
            if (playerNumber === 1 && data.player1Score !== undefined && data.player2Score !== undefined) {
              room.gameState.score = {
                player1: data.player1Score,
                player2: data.player2Score
              };

              // Broadcast with snake_case
              broadcastToRoom(roomCode, {
                type: 'score_update',
                player1Score: data.player1Score,
                player2Score: data.player2Score
              });
            }
            break;

          case 'game_over':
            // Only host can declare game over
            if (playerNumber === 1) {
              room.gameState.status = 'finished';

              broadcastToRoom(roomCode, {
                type: 'game_over',
                winner: data.winner,
                player1Score: room.gameState.score.player1,
                player2Score: room.gameState.score.player2
              });

              // Clean up room after a delay
              setTimeout(() => {
                rooms.delete(roomCode);
              }, 5000);
            }
            break;
        }
      } catch (error) {
        console.error('Error handling Pong message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Internal error'
        }));
      }
    });

    // Handle disconnect
    socket.on('close', () => {
      const room = rooms.get(roomCode);
      if (room) {
        // Remove socket from room
        room.sockets = room.sockets.filter(p => p.socket !== socket);

        // Notify other player
        broadcastToRoom(roomCode, {
          type: 'player_disconnected',
          player_number: playerNumber,
          display_name: displayName
        });

        // Clean up empty room
        if (room.sockets.length === 0) {
          rooms.delete(roomCode);
        }
      }
    });
  });
}

function broadcastToRoom(roomCode, message, excludeSocket = null) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const data = JSON.stringify(message);
  room.sockets.forEach(({ socket }) => {
    if (socket !== excludeSocket && socket.readyState === 1) {
      socket.send(data);
    }
  });
}
