import { UserProgress, SavedVocabularyItem, QuizAttemptRecord, ReadingProgressRecord } from './types';

// Standard API fetch wrapper with credentials: 'include' and Bearer auth header
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('edu_ai_auth_token') : null;
  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const storageService = {
  // --- User Progress ---
  async getProgress(): Promise<UserProgress> {
    return apiFetch<UserProgress>('/api/user/progress');
  },

  async updateProgress(data: Partial<UserProgress>): Promise<UserProgress> {
    return apiFetch<UserProgress>('/api/user/progress', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- Vocabulary ---
  async getVocabulary(): Promise<SavedVocabularyItem[]> {
    const res = await apiFetch<{ vocabulary: SavedVocabularyItem[] }>('/api/user/vocabulary');
    return res.vocabulary || [];
  },

  async saveVocabulary(item: {
    word: string;
    definition: string;
    example?: string;
    cefrLevel?: string;
    srsStage?: number;
    nextReviewAt?: string;
  }): Promise<SavedVocabularyItem> {
    const res = await apiFetch<{ item: SavedVocabularyItem }>('/api/user/vocabulary', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return res.item;
  },

  async deleteVocabulary(idOrWord: string): Promise<boolean> {
    const res = await apiFetch<{ success: boolean }>(`/api/user/vocabulary/${encodeURIComponent(idOrWord)}`, {
      method: 'DELETE',
    });
    return res.success;
  },

  // --- Quizzes ---
  async saveQuizAttempt(data: {
    quizId: string;
    score: number;
    total: number;
    weakTopics?: string[];
  }): Promise<{ success: boolean; attemptId: string; earnedXp: number }> {
    return apiFetch('/api/user/quiz-attempt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getQuizAttempts(): Promise<QuizAttemptRecord[]> {
    const res = await apiFetch<{ attempts: QuizAttemptRecord[] }>('/api/user/quiz-attempts');
    return res.attempts || [];
  },

  // --- Reading Progress ---
  async getReadingProgress(): Promise<ReadingProgressRecord[]> {
    const res = await apiFetch<{ progress: ReadingProgressRecord[] }>('/api/user/reading-progress');
    return res.progress || [];
  },

  async saveReadingProgress(bookId: string, chapterIndex: number, scrollPosition: number): Promise<boolean> {
    const res = await apiFetch<{ success: boolean }>('/api/user/reading-progress', {
      method: 'PUT',
      body: JSON.stringify({ bookId, chapterIndex, scrollPosition }),
    });
    return res.success;
  },

  // --- Non-sensitive Client UI Preferences (Safe in localStorage) ---
  getThemePreference(): 'light' | 'dark' | 'system' {
    return (localStorage.getItem('ui_theme') as any) || 'light';
  },

  setThemePreference(theme: 'light' | 'dark' | 'system'): void {
    localStorage.setItem('ui_theme', theme);
  },

  getFontSizePreference(): number {
    const val = localStorage.getItem('ui_font_size');
    return val ? parseInt(val, 10) : 16;
  },

  setFontSizePreference(size: number): void {
    localStorage.setItem('ui_font_size', size.toString());
  },
};
