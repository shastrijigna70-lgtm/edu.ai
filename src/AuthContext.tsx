import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, CEFRLevel } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithAccessCode: (accessCode: string, displayName?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (cefrLevel: CEFRLevel, learningGoal: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'edu_ai_auth_token';

const DEFAULT_SCHOLAR_USER: User = {
  id: 'edu-scholar-default',
  email: 'scholar@lingualea.org',
  displayName: 'Scholar',
  cefrLevel: 'B1',
  learningGoal: 'CBSE Class 10 Board Exam Excellence',
  isPro: true,
  createdAt: new Date().toISOString(),
};

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_SCHOLAR_USER);
  const [loading, setLoading] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  // Restore session or automatically authenticate in the background
  const refreshUser = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (token) {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          return;
        }
      }

      // Automatically authenticate in the background without showing any access code page
      const autoRes = await fetch('/api/auth/access-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: 'EDU86', displayName: 'Scholar' }),
      });

      if (autoRes.ok) {
        const autoData = await autoRes.json();
        if (autoData.token) {
          setStoredToken(autoData.token);
        }
        setUser(autoData.user);
      } else {
        setUser(DEFAULT_SCHOLAR_USER);
      }
    } catch {
      setUser(DEFAULT_SCHOLAR_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login handler
  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid email or password.');
    }

    if (data.token) {
      setStoredToken(data.token);
    }
    setUser(data.user);
    setIsNewUser(false);
  };

  // Signup handler
  const signup = async (email: string, password: string, displayName?: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account.');
    }

    if (data.token) {
      setStoredToken(data.token);
    }
    setUser(data.user);
    setIsNewUser(true);
  };

  // Access Code login handler (e.g. EDU86)
  const loginWithAccessCode = async (accessCode: string, displayName?: string, password?: string) => {
    const res = await fetch('/api/auth/access-code', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode, displayName, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid access code. Please check your code and try again.');
    }

    if (data.token) {
      setStoredToken(data.token);
    }
    setUser(data.user);
    setIsNewUser(false);
  };

  // Logout handler
  const logout = async () => {
    const token = getStoredToken();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } finally {
      setStoredToken(null);
      setUser(DEFAULT_SCHOLAR_USER);
      setIsNewUser(false);
      refreshUser();
    }
  };

  // Complete onboarding (placement quiz / CEFR level / learning goal)
  const completeOnboarding = async (cefrLevel: CEFRLevel, learningGoal: string) => {
    const token = getStoredToken();
    const res = await fetch('/api/auth/onboarding', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ cefrLevel, learningGoal }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save onboarding preferences.');
    }

    if (data.token) {
      setStoredToken(data.token);
    }
    setUser(data.user);
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isNewUser,
        login,
        signup,
        loginWithAccessCode,
        logout,
        completeOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
