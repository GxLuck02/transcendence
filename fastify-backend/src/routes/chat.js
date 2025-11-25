import db from '../db.js';

export default async function chatRoutes(app) {
  // Get conversations list
  app.get('/api/chat/conversations/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    const conversations = db.prepare(`
      WITH targets AS (
        SELECT recipient_id AS other_user_id
        FROM chat_messages
        WHERE sender_id = ?
        UNION
        SELECT sender_id AS other_user_id
        FROM chat_messages
        WHERE recipient_id = ?
      )
      SELECT
        other_user_id AS user_id,
        (
          SELECT MAX(timestamp)
          FROM chat_messages
          WHERE (sender_id = ? AND recipient_id = other_user_id)
             OR (sender_id = other_user_id AND recipient_id = ?)
        ) AS last_message_time,
        (
          SELECT content
          FROM chat_messages
          WHERE (sender_id = other_user_id AND recipient_id = ?)
             OR (sender_id = ? AND recipient_id = other_user_id)
          ORDER BY timestamp DESC
          LIMIT 1
        ) AS last_message_content,
        (
          SELECT COUNT(*)
          FROM chat_messages
          WHERE sender_id = other_user_id
            AND recipient_id = ?
            AND is_read = 0
        ) AS unread_count
      FROM targets
      ORDER BY last_message_time DESC
    `).all(userId, userId, userId, userId, userId, userId, userId);

    const result = [];
    for (const conv of conversations) {
      const user = db.prepare('SELECT id, username, display_name, avatar FROM users WHERE id = ?').get(conv.user_id);
      if (user) {
        result.push({
          user: user,
          last_message: conv.last_message_content ? { content: conv.last_message_content } : null,
          unread_count: conv.unread_count
        });
      }
    }

    reply.send(result);
  });

  // Get direct messages with a user
  app.get('/api/chat/messages/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const otherUserId = Number(request.query.user);
    const limit = Number(request.query.limit) || 50;

    if (!otherUserId) {
      return reply.code(400).send({ error: 'user parameter is required' });
    }

    const messages = db.prepare(`
      SELECT
        cm.*,
        s.id as sender_id,
        s.username as sender_username,
        s.display_name as sender_display_name,
        s.avatar as sender_avatar
      FROM chat_messages cm
      JOIN users s ON s.id = cm.sender_id
      WHERE (cm.sender_id = ? AND cm.recipient_id = ?)
         OR (cm.sender_id = ? AND cm.recipient_id = ?)
      ORDER BY cm.timestamp DESC
      LIMIT ?
    `).all(userId, otherUserId, otherUserId, userId, limit);

    // Mark as read
    db.prepare(`
      UPDATE chat_messages
      SET is_read = 1
      WHERE sender_id = ? AND recipient_id = ? AND is_read = 0
    `).run(otherUserId, userId);

    const result = messages.reverse().map(msg => ({
      id: msg.id,
      sender: {
        id: msg.sender_id,
        username: msg.sender_username,
        display_name: msg.sender_display_name,
        avatar: msg.sender_avatar
      },
      content: msg.content,
      message_type: msg.message_type,
      game_invite_type: msg.game_invite_type,
      game_room_code: msg.game_room_code,
      is_read: msg.is_read,
      timestamp: msg.timestamp
    }));

    reply.send(result);
  });

  // Send a direct message
  app.post('/api/chat/messages/send/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const senderId = request.user.userId;
    const { recipient_id, content, message_type, game_invite_type, game_room_code } = request.body || {};

    if (!recipient_id || !content) {
      return reply.code(400).send({ error: 'recipient_id and content are required' });
    }

    // Check if recipient exists
    const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(recipient_id);
    if (!recipient) {
      return reply.code(404).send({ error: 'Recipient not found' });
    }

    // Check if sender is blocked
    const blocked = db.prepare('SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?').get(recipient_id, senderId);
    if (blocked) {
      return reply.code(403).send({ error: 'Cannot send message to this user' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO chat_messages (sender_id, recipient_id, content, message_type, game_invite_type, game_room_code)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        senderId,
        recipient_id,
        content,
        message_type || 'text',
        game_invite_type || null,
        game_room_code || null
      );

      const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
      reply.code(201).send(message);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Failed to send message' });
    }
  });

  // Get notifications
  app.get('/api/chat/notifications/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const limit = Number(request.query.limit) || 20;

    const notifications = db.prepare(`
      SELECT * FROM chat_notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);

    reply.send(notifications);
  });

  // Mark notification as read
  app.post('/api/chat/notifications/:id/read/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const notificationId = Number(request.params.id);

    const notification = db.prepare('SELECT * FROM chat_notifications WHERE id = ? AND user_id = ?').get(notificationId, userId);
    if (!notification) {
      return reply.code(404).send({ error: 'Notification not found' });
    }

    db.prepare('UPDATE chat_notifications SET is_read = 1 WHERE id = ?').run(notificationId);

    reply.send({ message: 'Notification marked as read' });
  });

  // Mark all notifications as read
  app.post('/api/chat/notifications/read-all/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    db.prepare('UPDATE chat_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(userId);

    reply.send({ message: 'All notifications marked as read' });
  });

  // Get unread messages summary
  app.get('/api/chat/messages/unread/', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM chat_messages
      WHERE recipient_id = ? AND is_read = 0
    `).get(userId);

    reply.send({ unread_count: unreadCount.count || 0 });
  });
}
