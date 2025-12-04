import db from '../db.js';

// Store active chat connections
const chatConnections = new Map(); // userId -> socket

export default async function chatWebSocket(app) {
  app.get('/ws/chat/', { websocket: true }, (connection, req) => {
    const { socket } = connection;
    let userId = null;

    // Handle incoming messages
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'authenticate':
            // Authenticate user with JWT token
            try {
              const decoded = app.jwt.verify(data.token);
              userId = decoded.userId;

              // Store connection
              chatConnections.set(userId, socket);

              // Mark user as online
              db.prepare('UPDATE users SET is_online = 1 WHERE id = ?').run(userId);

              // Get user info
              const user = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(userId);

              // Send authentication success
              socket.send(JSON.stringify({
                type: 'authenticated',
                user: user
              }));

              // Broadcast user list to all
              broadcastUserList();
            } catch (error) {
              socket.send(JSON.stringify({
                type: 'auth_error',
                message: 'Invalid token'
              }));
            }
            break;

          case 'global_message':
            if (!userId) {
              socket.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            // Get sender info
            const sender = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(userId);

            // Broadcast to all connected users
            const messagePayload = {
              type: 'global_message',
              sender: sender,
              content: data.content,
              timestamp: new Date().toISOString()
            };

            broadcastToAll(messagePayload);
            break;

          case 'typing':
            if (!userId) return;

            const typingUser = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(userId);
            broadcastToAll({
              type: 'user_typing',
              user: typingUser,
              isTyping: data.isTyping
            }, userId);
            break;
        }
      } catch (error) {
        console.error('Error handling chat message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Internal error'
        }));
      }
    });

    // Handle disconnect
    socket.on('close', () => {
      if (userId) {
        chatConnections.delete(userId);

        // Mark user as offline
        db.prepare('UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

        // Broadcast updated user list
        broadcastUserList();
      }
    });
  });
}

function broadcastToAll(message, excludeUserId = null) {
  const data = JSON.stringify(message);
  chatConnections.forEach((socket, uid) => {
    if (uid !== excludeUserId && socket.readyState === 1) {
      socket.send(data);
    }
  });
}

function broadcastUserList() {
  const onlineUsers = db.prepare(`
    SELECT id, username, display_name
    FROM users
    WHERE is_online = 1
    ORDER BY display_name
  `).all();

  const message = {
    type: 'user_list',
    users: onlineUsers
  };

  broadcastToAll(message);
}
