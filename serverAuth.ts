import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { getDb } from './db';

// Ensure JWT_SECRET is loaded
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
    }
    return 'lingua_leap_dev_secret_fallback_do_not_use_in_production_32b';
  }
  return secret;
}

// Extend Express Request type for authenticated routes
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// In-memory rate limiter specifically for login/signup (5 attempts per 15 minutes per IP)
const rateLimitMap = new Map<string, { attempts: number; firstAttemptAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Clean up stale rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { attempts: 1, firstAttemptAt: now });
    return next();
  }

  if (now - record.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    // Window expired, reset
    rateLimitMap.set(ip, { attempts: 1, firstAttemptAt: now });
    return next();
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.firstAttemptAt)) / 60000);
    return res.status(429).json({
      error: `Too many login/signup attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
    });
  }

  record.attempts += 1;
  return next();
}

// Validation schemas with zod
export const AccessCodeSchema = z.object({
  accessCode: z.string().trim().min(1, 'Access code is required.'),
  displayName: z.string().trim().max(50).optional(),
  password: z.string().optional(),
});

export const SignupSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  displayName: z.string().trim().min(1, 'Display name is required.').max(50).optional(),
});

export const LoginSchema = z.object({
  email: z.string().trim().optional(),
  accessCode: z.string().trim().optional(),
  password: z.string().optional(),
});

export const OnboardingSchema = z.object({
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  learningGoal: z.string().trim().max(200).optional(),
});

// Authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check Authorization header first (most resilient in iframes), then fallback to cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1].trim();
      }
    }

    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
}

// Cookie helper
export function setAuthCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: sevenDaysInMs,
    path: '/',
  });
}
