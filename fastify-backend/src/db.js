import Database from 'better-sqlite3';
import { join, dirname } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(join(DATA_DIR, 'transcendence.db'));
db.pragma('foreign_keys = ON');

const runMigrations = () => {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      pong_wins INTEGER DEFAULT 0,
      pong_losses INTEGER DEFAULT 0,
      is_online INTEGER DEFAULT 0,
      last_seen TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS trigger_users_updated
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- Friendships table
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id)
    );

    -- Blocked users table
    CREATE TABLE IF NOT EXISTS blocked_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(blocker_id, blocked_id)
    );

    -- Pong matches table
    CREATE TABLE IF NOT EXISTS pong_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      game_mode TEXT NOT NULL,
      winner_id INTEGER REFERENCES users(id),
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      blockchain_tx_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS trigger_pong_matches_updated
    AFTER UPDATE ON pong_matches
    BEGIN
      UPDATE pong_matches SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- Pong rooms table (for remote multiplayer)
    CREATE TABLE IF NOT EXISTS pong_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT UNIQUE NOT NULL,
      match_id INTEGER UNIQUE REFERENCES pong_matches(id) ON DELETE CASCADE,
      host_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      guest_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'waiting',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Pong matchmaking queue
    CREATE TABLE IF NOT EXISTS pong_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      game_invite_type TEXT,
      game_room_code TEXT,
      is_read INTEGER DEFAULT 0,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat notifications table
    CREATE TABLE IF NOT EXISTS chat_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Blockchain tournament scores
    CREATE TABLE IF NOT EXISTS blockchain_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      winner_username TEXT NOT NULL,
      winner_score INTEGER NOT NULL,
      tx_hash TEXT UNIQUE NOT NULL,
      block_number INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

runMigrations();

export default db;
