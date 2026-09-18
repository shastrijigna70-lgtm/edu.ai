import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDb } from './db';
import {
  AccessCodeSchema,
  AuthenticatedRequest,
  authRateLimiter,
  getJwtSecret,
  LoginSchema,
  OnboardingSchema,
  requireAuth,
  setAuthCookie,
  SignupSchema,
} from './serverAuth';

const router = express.Router();

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/auth/signup
router.post('/auth/signup', authRateLimiter, async (req, res) => {
  try {
    const parseResult = SignupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid input data.',
      });
    }

    const { email, password, displayName } = parseResult.data;
    const normalizedEmail = email.toLowerCase();
    const db = getDb();

    // Check for duplicate email
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(email) = ?',
      args: [normalizedEmail],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email address already exists. Please log in instead.',
      });
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const cleanDisplayName = displayName || normalizedEmail.split('@')[0];

    // Create user record
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, display_name, cefr_level, learning_goal, is_pro, created_at, last_login_at)
            VALUES (?, ?, ?, ?, 'B1', '', 0, ?, ?)`,
      args: [userId, normalizedEmail, passwordHash, cleanDisplayName, now, now],
    });

    // Create initial user_progress row
    const progressId = crypto.randomUUID();
    const today = now.split('T')[0];
    await db.execute({
      sql: `INSERT INTO user_progress (id, user_id, xp, streak_count, last_active_date, books_completed, quizzes_taken)
            VALUES (?, ?, 0, 1, ?, 0, 0)`,
      args: [progressId, userId, today],
    });

    // Issue 7-day JWT
    const secret = getJwtSecret();
    const token = jwt.sign({ userId, email: normalizedEmail }, secret, { expiresIn: '7d' });

    // Set secure httpOnly cookie
    setAuthCookie(res, token);

    // Return safe user object and token (passwords NEVER returned)
    return res.status(201).json({
      user: {
        id: userId,
        email: normalizedEmail,
        displayName: cleanDisplayName,
        cefrLevel: 'B1',
        learningGoal: '',
        isPro: false,
        createdAt: now,
      },
      token,
      isNewUser: true,
    });
  } catch (err: any) {
    console.error('Signup error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Helper for access-code authentication (access code: EDU86)
async function handleAccessCodeAuth(
  req: express.Request,
  res: Response,
  accessCodeRaw: string,
  displayNameRaw?: string,
  passwordRaw?: string
) {
  const cleanCode = (accessCodeRaw || '').trim().toUpperCase();

  // Validate access code against EDU86
  if (cleanCode !== 'EDU86') {
    return res.status(401).json({
      error: 'Invalid access code. Please check your code and try again.',
    });
  }

  const db = getDb();
  const cleanName = (displayNameRaw || '').trim();
  let slug = cleanName
    ? cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24)
    : 'student';
  if (!slug || slug.length === 0) slug = 'student';

  const syntheticEmail = `edu86_${slug}@lingualea.org`;
  const resolvedDisplayName = cleanName || 'Student (EDU86)';
  const now = new Date().toISOString();

  // Look up if user already exists
  const existing = await db.execute({
    sql: `SELECT id, email, password_hash, display_name, cefr_level, learning_goal, is_pro, created_at
          FROM users WHERE LOWER(email) = ?`,
    args: [syntheticEmail.toLowerCase()],
  });

  let userId: string;
  let isNewUser = false;
  let userRow: any;

  if (existing.rows.length === 0) {
    // Register new user under this student profile
    userId = crypto.randomUUID();
    isNewUser = true;
    const defaultHash = await bcrypt.hash(passwordRaw || 'EDU86_AUTHORIZED', 10);

    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, display_name, cefr_level, learning_goal, is_pro, created_at, last_login_at)
            VALUES (?, ?, ?, ?, 'B1', '', 0, ?, ?)`,
      args: [userId, syntheticEmail.toLowerCase(), defaultHash, resolvedDisplayName, now, now],
    });

    // Create initial user_progress row
    const progressId = crypto.randomUUID();
    const today = now.split('T')[0];
    await db.execute({
      sql: `INSERT INTO user_progress (id, user_id, xp, streak_count, last_active_date, books_completed, quizzes_taken)
            VALUES (?, ?, 0, 1, ?, 0, 0)`,
      args: [progressId, userId, today],
    });

    userRow = {
      id: userId,
      email: syntheticEmail.toLowerCase(),
      display_name: resolvedDisplayName,
      cefr_level: 'B1',
      learning_goal: '',
      is_pro: 0,
      created_at: now,
    };
  } else {
    userRow = existing.rows[0];
    userId = userRow.id as string;

    await db.execute({
      sql: 'UPDATE users SET last_login_at = ? WHERE id = ?',
      args: [now, userId],
    });
  }

  // Issue 7-day JWT
  const secret = getJwtSecret();
  const token = jwt.sign({ userId, email: userRow.email as string }, secret, { expiresIn: '7d' });
  setAuthCookie(res, token);

  return res.json({
    user: {
      id: userId,
      email: userRow.email,
      displayName: userRow.display_name || resolvedDisplayName,
      cefrLevel: userRow.cefr_level || 'B1',
      learningGoal: userRow.learning_goal || '',
      isPro: Boolean(userRow.is_pro),
      createdAt: userRow.created_at,
    },
    token,
    isNewUser: false,
  });
}

// POST /api/auth/access-code
router.post('/auth/access-code', authRateLimiter, async (req, res) => {
  try {
    const parseResult = AccessCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Access code is required.',
      });
    }

    const { accessCode, displayName, password } = parseResult.data;
    return await handleAccessCodeAuth(req, res, accessCode, displayName, password);
  } catch (err: any) {
    console.error('Access code auth error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to authenticate with access code. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/auth/login', authRateLimiter, async (req, res) => {
  try {
    // If client supplied accessCode in login, route to access-code authentication
    if (req.body?.accessCode) {
      return await handleAccessCodeAuth(
        req,
        res,
        req.body.accessCode,
        req.body.displayName || req.body.email,
        req.body.password
      );
    }

    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Email and password are required.',
      });
    }

    const { email, password } = parseResult.data;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const normalizedEmail = email.toLowerCase();
    const db = getDb();

    // Look up user by email
    const result = await db.execute({
      sql: `SELECT id, email, password_hash, display_name, cefr_level, learning_goal, is_pro, created_at
            FROM users WHERE LOWER(email) = ?`,
      args: [normalizedEmail],
    });

    if (result.rows.length === 0) {
      // Return identical generic error to prevent email enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRow = result.rows[0];
    const passwordHash = userRow.password_hash as string;

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      // Return identical generic error
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userId = userRow.id as string;
    const now = new Date().toISOString();

    // Update last_login_at
    await db.execute({
      sql: 'UPDATE users SET last_login_at = ? WHERE id = ?',
      args: [now, userId],
    });

    // Issue JWT
    const secret = getJwtSecret();
    const token = jwt.sign({ userId, email: normalizedEmail }, secret, { expiresIn: '7d' });

    setAuthCookie(res, token);

    return res.json({
      user: {
        id: userId,
        email: normalizedEmail,
        displayName: (userRow.display_name as string) || normalizedEmail.split('@')[0],
        cefrLevel: (userRow.cefr_level as string) || 'B1',
        learningGoal: (userRow.learning_goal as string) || '',
        isPro: Boolean(userRow.is_pro),
        createdAt: userRow.created_at as string,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
  });
  return res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT id, email, display_name, cefr_level, learning_goal, is_pro, created_at, last_login_at
            FROM users WHERE id = ?`,
      args: [userId],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User session no longer valid.' });
    }

    const row = result.rows[0];
    return res.json({
      user: {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        cefrLevel: row.cefr_level || 'B1',
        learningGoal: row.learning_goal || '',
        isPro: Boolean(row.is_pro),
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch user session.' });
  }
});

// POST /api/auth/onboarding
router.post('/auth/onboarding', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = OnboardingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid onboarding data.',
      });
    }

    const { cefrLevel, learningGoal = '' } = parseResult.data;
    const userId = req.user!.userId;
    const db = getDb();

    await db.execute({
      sql: 'UPDATE users SET cefr_level = ?, learning_goal = ? WHERE id = ?',
      args: [cefrLevel, learningGoal, userId],
    });

    const userResult = await db.execute({
      sql: `SELECT id, email, display_name, cefr_level, learning_goal, is_pro, created_at, last_login_at
            FROM users WHERE id = ?`,
      args: [userId],
    });

    const row = userResult.rows[0];
    const secret = getJwtSecret();
    const refreshedToken = jwt.sign({ userId, email: row.email as string }, secret, { expiresIn: '7d' });
    setAuthCookie(res, refreshedToken);

    return res.json({
      user: {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        cefrLevel: row.cefr_level,
        learningGoal: row.learning_goal,
        isPro: Boolean(row.is_pro),
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at,
      },
      token: refreshedToken,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update onboarding preferences.' });
  }
});

// ==========================================
// AUTHENTICATED USER DATA ENDPOINTS
// (Strictly scoped to req.user.userId)
// ==========================================

// GET /api/user/progress
router.get('/user/progress', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const db = getDb();

    const result = await db.execute({
      sql: 'SELECT id, xp, streak_count, last_active_date, books_completed, quizzes_taken FROM user_progress WHERE user_id = ?',
      args: [userId],
    });

    if (result.rows.length === 0) {
      // Create initial row if missing
      const progressId = crypto.randomUUID();
      const today = new Date().toISOString().split('T')[0];
      await db.execute({
        sql: `INSERT INTO user_progress (id, user_id, xp, streak_count, last_active_date, books_completed, quizzes_taken)
              VALUES (?, ?, 0, 1, ?, 0, 0)`,
        args: [progressId, userId, today],
      });
      return res.json({
        xp: 0,
        streakCount: 1,
        lastActiveDate: today,
        booksCompleted: 0,
        quizzesTaken: 0,
      });
    }

    const row = result.rows[0];
    return res.json({
      xp: Number(row.xp) || 0,
      streakCount: Number(row.streak_count) || 0,
      lastActiveDate: row.last_active_date,
      booksCompleted: Number(row.books_completed) || 0,
      quizzesTaken: Number(row.quizzes_taken) || 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load user progress.' });
  }
});

// PUT /api/user/progress
router.put('/user/progress', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { xp, streakCount, lastActiveDate, booksCompleted, quizzesTaken } = req.body;
    const db = getDb();

    // Check if progress row exists
    const existing = await db.execute({
      sql: 'SELECT id FROM user_progress WHERE user_id = ?',
      args: [userId],
    });

    const today = lastActiveDate || new Date().toISOString().split('T')[0];

    if (existing.rows.length === 0) {
      const id = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO user_progress (id, user_id, xp, streak_count, last_active_date, books_completed, quizzes_taken)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, userId, xp || 0, streakCount || 1, today, booksCompleted || 0, quizzesTaken || 0],
      });
    } else {
      await db.execute({
        sql: `UPDATE user_progress
              SET xp = COALESCE(?, xp),
                  streak_count = COALESCE(?, streak_count),
                  last_active_date = COALESCE(?, last_active_date),
                  books_completed = COALESCE(?, books_completed),
                  quizzes_taken = COALESCE(?, quizzes_taken)
              WHERE user_id = ?`,
        args: [
          xp !== undefined ? xp : null,
          streakCount !== undefined ? streakCount : null,
          today,
          booksCompleted !== undefined ? booksCompleted : null,
          quizzesTaken !== undefined ? quizzesTaken : null,
          userId,
        ],
      });
    }

    const updated = await db.execute({
      sql: 'SELECT xp, streak_count, last_active_date, books_completed, quizzes_taken FROM user_progress WHERE user_id = ?',
      args: [userId],
    });

    const row = updated.rows[0];
    return res.json({
      xp: Number(row.xp) || 0,
      streakCount: Number(row.streak_count) || 0,
      lastActiveDate: row.last_active_date,
      booksCompleted: Number(row.books_completed) || 0,
      quizzesTaken: Number(row.quizzes_taken) || 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user progress.' });
  }
});

// GET /api/user/vocabulary
router.get('/user/vocabulary', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT id, word, definition, example, cefr_level as cefrLevel, srs_stage as srsStage, next_review_at as nextReviewAt, created_at as createdAt
            FROM vocabulary
            WHERE user_id = ?
            ORDER BY created_at DESC`,
      args: [userId],
    });

    const items = result.rows.map((row) => ({
      id: row.id,
      word: row.word,
      definition: row.definition || '',
      example: row.example || '',
      cefrLevel: row.cefrLevel || 'B1',
      srsStage: Number(row.srsStage) || 0,
      nextReviewAt: row.nextReviewAt,
      createdAt: row.createdAt,
    }));

    return res.json({ vocabulary: items });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load vocabulary.' });
  }
});

// POST /api/user/vocabulary
router.post('/user/vocabulary', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { word, definition = '', example = '', cefrLevel = 'B1', srsStage = 0, nextReviewAt } = req.body;

    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({ error: 'Word is required.' });
    }

    const cleanWord = word.trim();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const reviewDate = nextReviewAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const db = getDb();

    // Upsert on UNIQUE(user_id, word)
    await db.execute({
      sql: `INSERT INTO vocabulary (id, user_id, word, definition, example, cefr_level, srs_stage, next_review_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, word) DO UPDATE SET
              definition = excluded.definition,
              example = excluded.example,
              cefr_level = excluded.cefr_level,
              srs_stage = excluded.srs_stage,
              next_review_at = excluded.next_review_at`,
      args: [id, userId, cleanWord, definition, example, cefrLevel, srsStage, reviewDate, now],
    });

    const result = await db.execute({
      sql: `SELECT id, word, definition, example, cefr_level as cefrLevel, srs_stage as srsStage, next_review_at as nextReviewAt, created_at as createdAt
            FROM vocabulary WHERE user_id = ? AND word = ?`,
      args: [userId, cleanWord],
    });

    return res.json({ item: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save vocabulary word.' });
  }
});

// DELETE /api/user/vocabulary/:idOrWord
router.delete('/api/user/vocabulary/:idOrWord', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { idOrWord } = req.params;
    const db = getDb();

    await db.execute({
      sql: 'DELETE FROM vocabulary WHERE user_id = ? AND (id = ? OR word = ?)',
      args: [userId, idOrWord, idOrWord],
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete vocabulary item.' });
  }
});

// POST /api/user/quiz-attempt
router.post('/user/quiz-attempt', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { quizId, score, total, weakTopics = [] } = req.body;

    if (!quizId || score === undefined || total === undefined) {
      return res.status(400).json({ error: 'Quiz ID, score, and total are required.' });
    }

    const attemptId = crypto.randomUUID();
    const now = new Date().toISOString();
    const weakTopicsJson = JSON.stringify(weakTopics);
    const db = getDb();

    await db.execute({
      sql: `INSERT INTO quiz_attempts (id, user_id, quiz_id, score, total, weak_topics, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [attemptId, userId, quizId, Number(score), Number(total), weakTopicsJson, now],
    });

    // Reward XP and increment quizzes_taken in user_progress
    const earnedXp = Math.max(10, Number(score) * 15);
    const today = now.split('T')[0];

    await db.execute({
      sql: `UPDATE user_progress
            SET quizzes_taken = quizzes_taken + 1,
                xp = xp + ?,
                last_active_date = ?
            WHERE user_id = ?`,
      args: [earnedXp, today, userId],
    });

    return res.json({
      success: true,
      attemptId,
      earnedXp,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record quiz attempt.' });
  }
});

// GET /api/user/quiz-attempts
router.get('/user/quiz-attempts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT id, quiz_id as quizId, score, total, weak_topics as weakTopics, completed_at as completedAt
            FROM quiz_attempts
            WHERE user_id = ?
            ORDER BY completed_at DESC
            LIMIT 50`,
      args: [userId],
    });

    const attempts = result.rows.map((row) => {
      let weak: string[] = [];
      try {
        if (typeof row.weakTopics === 'string') {
          weak = JSON.parse(row.weakTopics);
        }
      } catch {}
      return {
        id: row.id,
        quizId: row.quizId,
        score: Number(row.score),
        total: Number(row.total),
        weakTopics: weak,
        completedAt: row.completedAt,
      };
    });

    return res.json({ attempts });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch quiz attempts.' });
  }
});

// GET /api/user/reading-progress
router.get('/user/reading-progress', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT book_id as bookId, chapter_index as chapterIndex, scroll_position as scrollPosition, updated_at as updatedAt
            FROM reading_progress
            WHERE user_id = ?`,
      args: [userId],
    });

    const records = result.rows.map((row) => ({
      bookId: row.bookId,
      chapterIndex: Number(row.chapterIndex) || 0,
      scrollPosition: Number(row.scrollPosition) || 0,
      updatedAt: row.updatedAt,
    }));

    return res.json({ progress: records });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch reading progress.' });
  }
});

// PUT /api/user/reading-progress
router.put('/user/reading-progress', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { bookId, chapterIndex = 0, scrollPosition = 0 } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: 'bookId is required.' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const db = getDb();

    await db.execute({
      sql: `INSERT INTO reading_progress (id, user_id, book_id, chapter_index, scroll_position, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, book_id) DO UPDATE SET
              chapter_index = excluded.chapter_index,
              scroll_position = excluded.scroll_position,
              updated_at = excluded.updated_at`,
      args: [id, userId, bookId, Number(chapterIndex), Number(scrollPosition), now],
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update reading progress.' });
  }
});

export default router;
