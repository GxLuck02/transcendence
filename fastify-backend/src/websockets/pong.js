import db from '../db.js';
import { PongGameEngine } from './pong_engine_server.js';

// Store active Pong rooms
const rooms = new Map(); // roomCode -> { sockets: [{socket, userId, playerNumber, displayName}], gameEngine, gameLoop, broadcastLoop, lastUpdateTime }

export default async function pongWebSocket(app) {
  app.get('/ws/pong/:room', { websocket: true }, (socket, req) => {
    const roomCode = req.params.room;
    let userId = null;
    let playerNumber = null;
    let displayName = null;

    // Initialize room if it doesn't exist
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        sockets: [],
        gameEngine: new PongGameEngine({
          width: 800,
          height: 600,
          maxScore: 11,
          player1Name: 'Player 1',
          player2Name: 'Player 2',
          onScoreUpdate: (scores) => {
            // Broadcast score update to room
            broadcastToRoom(roomCode, {
              type: 'score_update',
              player1Score: scores.player1,
              player2Score: scores.player2
            });
          },
          onGameOver: (results) => {
            // Broadcast game over to room
            const player1 = room.sockets.find(p => p.playerNumber === 1);
            const player2 = room.sockets.find(p => p.playerNumber === 2);
            
            broadcastToRoom(roomCode, {
              type: 'game_over',
              winner: results.winner,
              player1Score: results.player1Score,
              player2Score: results.player2Score,
              player1Name: player1?.displayName || 'Player 1',
              player2Name: player2?.displayName || 'Player 2'
            });
            stopGameLoop(roomCode);
          }
        }),
        gameLoop: null,
        broadcastLoop: null,
        lastUpdateTime: Date.now(),
        player1Ready: false,
        player2Ready: false
      });
    }

    const room = rooms.get(roomCode);

    // Assign player number
    if (room.sockets.length === 0) {
      playerNumber = 1;
    } else if (room.sockets.length === 1) {
      playerNumber = 2;
      // Wait for both players to be ready before starting
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
    // Include existing players info
    const existingPlayers = {};
    room.sockets.forEach(p => {
      if (p.playerNumber !== playerNumber && p.displayName) {
        existingPlayers[`player${p.playerNumber}Name`] = p.displayName;
      }
    });

    socket.send(JSON.stringify({
      type: 'player_assigned',
      player_number: playerNumber,
      is_host: playerNumber === 1,
      ...existingPlayers
    }));

    // Handle incoming messages
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`📩 WS Message in room ${roomCode}:`, data.type, data);

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
                broadcastToRoom(roomCode, {
                  type: 'game_start',
                  message: 'Both players connected! Press SPACE when ready.'
                });
              }
            } catch (error) {
              socket.send(JSON.stringify({
                type: 'auth_error',
                message: 'Invalid token'
              }));
            }
            break;

          case 'player_ready':
            // Player marks themselves as ready
            console.log(`Player ${playerNumber} is ready in room ${roomCode}`);
            if (playerNumber === 1) {
              room.player1Ready = true;
            } else if (playerNumber === 2) {
              room.player2Ready = true;
            }

            // Broadcast ready status to all players
            broadcastToRoom(roomCode, {
              type: 'player_ready',
              player_number: playerNumber
            });

            // If both players are ready, start the game
            if (room.player1Ready && room.player2Ready) {
              const player1 = room.sockets.find(p => p.playerNumber === 1);
              const player2 = room.sockets.find(p => p.playerNumber === 2);
              
              console.log(`Both players ready in room ${roomCode}, starting countdown...`);
              
              // Marquer qu'on est en countdown
              room.gameEngine.inCountdown = true;
              
              // Centrer la balle au début du countdown
              room.gameEngine.centerBall();
              
              // Démarrer la boucle de jeu IMMÉDIATEMENT pour permettre le mouvement des paddles
              startGameLoop(roomCode);
              
              broadcastToRoom(roomCode, {
                type: 'both_players_ready',
                message: 'Both players ready! Starting countdown...',
                player1Name: player1?.displayName || 'Player 1',
                player2Name: player2?.displayName || 'Player 2'
              });
              
              // Démarrer le moteur de jeu après le countdown
              setTimeout(() => {
                // Use start() method which properly initializes everything
                room.gameEngine.start();
                room.gameEngine.inCountdown = false;
                console.log(`✅ Game ACTUALLY started in room ${roomCode} - running: ${room.gameEngine.running}, started: ${room.gameEngine.started}, gameTime: ${room.gameEngine.gameTime}`);
              }, 13000); // 10 seconds to match 10s countdown + 1s "GO!" and 2 seconds for player to be ready
            }
            break;

          case 'paddle_move':
            // Update paddle position in game engine
            if (playerNumber === 1) {
              room.gameEngine.player1.y = data.y;
            } else if (playerNumber === 2) {
              room.gameEngine.player2.y = data.y;
            }
            break;

          case 'key_input':
            // Handle keyboard input for paddle control
            if (data.key && data.state !== undefined && playerNumber) {
              const playerKey = playerNumber === 1 ? 'player1' : 'player2';
              room.gameEngine.handleInput(playerKey, {
                key: data.key.toLowerCase(),
                state: data.state
              });
              // Log first input to verify it's received
              if (data.state) {
                console.log(`Player ${playerNumber} pressed ${data.key} in room ${roomCode}`);
              }
            }
            break;

          case 'restart_game':
            // Only allow restart if game is over
            if (!room.gameEngine.gameOver) {
              socket.send(JSON.stringify({
                type: 'error',
                message: 'Cannot restart game that is not over'
              }));
              break;
            }

            // Stop any running loops
            stopGameLoop(roomCode);

            // Reset game engine
            room.gameEngine.restart();

            // Reset ready flags
            room.player1Ready = false;
            room.player2Ready = false;

            // Notify all players that game is restarting
            broadcastToRoom(roomCode, {
              type: 'game_restart',
              message: 'Game restarting! Press SPACE when ready.'
            });
            
            console.log(`Game restarted in room ${roomCode}`);
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
        // Stop game loop
        stopGameLoop(roomCode);

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

// Game loop functions
function startGameLoop(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.gameLoop) {
    if (room && room.gameLoop) {
      console.log(`⚠️ Game loop already running for room ${roomCode}`);
    }
    return;
  }

  console.log(`🎮 Starting game loop for room ${roomCode}`);
  
  const TICK_RATE = 60; // 60 FPS
  const TICK_INTERVAL = 1000 / TICK_RATE;
  const BROADCAST_RATE = 60; // 60 updates per second
  const BROADCAST_INTERVAL = 1000 / BROADCAST_RATE;

  room.lastUpdateTime = Date.now();

  // Game physics update loop
  room.gameLoop = setInterval(() => {
    const now = Date.now();
    const dt = (now - room.lastUpdateTime) / 1000; // Delta time in seconds
    room.lastUpdateTime = now;

    // Update game engine
    room.gameEngine.update(dt);
  }, TICK_INTERVAL);

  // Broadcast game state to clients
  room.broadcastLoop = setInterval(() => {
    const gameState = {
      type: 'game_state',
      ball: room.gameEngine.ball,
      player1: {
        y: room.gameEngine.player1.y,
        score: room.gameEngine.player1.score
      },
      player2: {
        y: room.gameEngine.player2.y,
        score: room.gameEngine.player2.score
      },
      gameOver: room.gameEngine.gameOver,
      started: room.gameEngine.started,
      gameTime: room.gameEngine.gameTime
    };

    broadcastToRoom(roomCode, gameState);
  }, BROADCAST_INTERVAL);
}

function stopGameLoop(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  if (room.gameLoop) {
    clearInterval(room.gameLoop);
    room.gameLoop = null;
  }

  if (room.broadcastLoop) {
    clearInterval(room.broadcastLoop);
    room.broadcastLoop = null;
  }
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
