import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

let dbInstance: Client | null = null;

export function getDb(): Client {
  if (!dbInstance) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'lingualea.db');
    dbInstance = createClient({
      url: `file:${dbPath}`,
    });
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();

  // Create tables according to specification
  await db.executeMultiple(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      cefr_level TEXT DEFAULT 'B1',
      learning_goal TEXT,
      is_pro INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      xp INTEGER DEFAULT 0,
      streak_count INTEGER DEFAULT 0,
      last_active_date TEXT,
      books_completed INTEGER DEFAULT 0,
      quizzes_taken INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      word TEXT NOT NULL,
      definition TEXT,
      example TEXT,
      cefr_level TEXT,
      srs_stage INTEGER DEFAULT 0,
      next_review_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, word)
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quiz_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      weak_topics TEXT,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reading_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      book_id TEXT NOT NULL,
      chapter_index INTEGER DEFAULT 0,
      scroll_position REAL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, book_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON vocabulary(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
  `);

  console.log('[Database] SQLite database initialized successfully at data/lingualea.db');
}
