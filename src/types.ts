export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface VocabularyItem {
  word: string;
  pronunciation?: string;
  meaning: string;
  hindiMeaning?: string;
  partOfSpeech: string;
  exampleSentence?: string;
  mnemonic?: string;
}

export interface TextbookQuestion {
  id: string;
  section: string; // e.g. "Oral Comprehension Check", "Thinking about the Text", "Thinking about Language"
  question: string;
  contextHint?: string;
  modelAnswerSummary?: string;
}

export interface GrammarExercise {
  id: string;
  title: string;
  topic: string; // e.g. "Relative Clauses", "Metaphors", "Phrasal Verbs", "Collocations", "Adjectives"
  instruction: string;
  items: {
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export interface Poem {
  id: string;
  title: string;
  poet: string;
  introduction?: string;
  stanzas: string[];
  glossary?: { word: string; meaning: string }[];
  questions?: string[];
}

export interface SubPart {
  id: string;
  title: string;
  author?: string;
  paragraphs: string[];
}

export type SubjectType = 'literature' | 'science' | 'social_studies' | 'history' | 'economics' | 'custom';

export interface BookChapter {
  id: string;
  number: number;
  title: string;
  author: string;
  subject?: SubjectType;
  subtitle?: string;
  coverGradient: string;
  estimatedReadTime: string;
  difficulty: CEFRLevel;
  theme: string;
  beforeYouRead: string;
  paragraphs: string[]; // For single-part chapters
  subParts?: SubPart[]; // For multi-part chapters like Two Stories about Flying, Glimpses of India
  poems?: Poem[];
  glossary?: VocabularyItem[];
  questions?: TextbookQuestion[];
  grammarExercises?: GrammarExercise[];
  writingPrompts?: {
    id: string;
    title: string;
    prompt: string;
    type: 'letter' | 'diary' | 'speech' | 'essay' | 'poster';
    wordCount: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: number;
  modelUsed?: string;
  roleMode?: string;
  roleUsed?: string;
  sources?: string[];
}

export type ChatRole = 'socratic' | 'researcher' | 'exam_grader' | 'feynman';
export type ChatModel = 'gemini-3.1-flash-lite' | 'gemini-3.5-flash' | 'gemini-3.1-pro-preview';

export interface AdaptiveLearningStep {
  id: string;
  level: 1 | 2 | 3;
  levelName: string;
  question: string;
  contextExcerpt: string;
  options?: string[];
  correctIndex?: number;
  hint: string;
  conceptKey: string;
}

export interface AdaptiveFeedbackResult {
  isCorrect: boolean;
  score: number; // 0-100 or 1-5
  feedback: string;
  strengths: string[];
  misconceptionsFound: string[];
  remedialExplanation: string;
  bookExcerptReference: string;
  recommendedDifficultyAdjustment: 'promote' | 'maintain' | 'remediate';
  nextAdaptiveStep?: AdaptiveLearningStep;
}

export interface VideoGenerationState {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  operationName?: string;
  status: 'idle' | 'generating' | 'polling' | 'completed' | 'failed';
  progressMessage?: string;
  videoUrl?: string;
  error?: string;
}

export interface ResearchQueryResult {
  query: string;
  synthesizedAnswer: string;
  relevantExcerpts: {
    bookTitle: string;
    chapterTitle: string;
    quote: string;
    relevance: string;
  }[];
  keyInsights: string[];
  recommendedFollowUps: string[];
}

export interface AIExplanationResult {
  simpleMeaning: string;
  paraphrase: string;
  vocabulary: {
    word: string;
    meaning: string;
    synonym: string;
    partOfSpeech: string;
  }[];
  grammarNotes: string[];
  literaryDevices: string[];
  studentInsight: string;
  exampleUsage: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  word: string;
  pronunciation?: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  mnemonic?: string;
  chapterTitle?: string;
  mastered?: boolean;
}

export interface WritingEvaluation {
  overallScore: number;
  scores: {
    content: number;
    vocabulary: number;
    grammar: number;
    structure: number;
  };
  overview: string;
  strengths: string[];
  grammarCorrections: {
    original: string;
    corrected: string;
    reason: string;
  }[];
  vocabularyUpgrades: {
    simpleWord: string;
    suggestedWord: string;
    context: string;
  }[];
  polishedVersion: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  cefrLevel: CEFRLevel;
  learningGoal?: string;
  isPro: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserProgress {
  xp: number;
  streakCount: number;
  lastActiveDate: string;
  booksCompleted: number;
  quizzesTaken: number;
}

export interface SavedVocabularyItem {
  id: string;
  word: string;
  definition: string;
  example?: string;
  cefrLevel: string;
  srsStage: number;
  nextReviewAt?: string;
  createdAt: string;
}

export interface QuizAttemptRecord {
  id: string;
  quizId: string;
  score: number;
  total: number;
  weakTopics: string[];
  completedAt: string;
}

export interface ReadingProgressRecord {
  bookId: string;
  chapterIndex: number;
  scrollPosition: number;
  updatedAt: string;
}
