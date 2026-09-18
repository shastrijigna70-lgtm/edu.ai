import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_FLASHCARDS } from './data/flashcardsData';
import { ALL_CURRICULUM_BOOKS } from './data/booksData';
import {
  BookChapter,
  CEFRLevel,
  Flashcard,
  AIExplanationResult,
  TextbookQuestion,
} from './types';
import { Navbar, AppTab } from './components/Navbar';
import { BookLibrary } from './components/BookLibrary';
import { ReaderView } from './components/ReaderView';
import { AITutorPanel } from './components/AITutorPanel';
import { QuizArena } from './components/QuizArena';
import { WritingLab } from './components/WritingLab';
import { FlashcardDeck } from './components/FlashcardDeck';
import { GrammarWorkshop } from './components/GrammarWorkshop';
import { GeminiChatbot } from './components/GeminiChatbot';
import { LiveVoiceTutor } from './components/LiveVoiceTutor';
import { AdaptiveLearningModule } from './components/AdaptiveLearningModule';
import { ResearchAssistant } from './components/ResearchAssistant';
import { ConceptExplainer } from './components/ConceptExplainer';
import { BookUploadModal } from './components/BookUploadModal';
import { AuthProvider, useAuth } from './AuthContext';
import { storageService } from './storageService';

function AppContent() {
  const { user, isNewUser } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<AppTab>('library');

  // Reader sub-tab
  const [readerSubTab, setReaderSubTab] = useState<'story' | 'poems' | 'questions' | 'grammar'>('story');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Dynamic user-uploaded and curriculum books state
  const [books, setBooks] = useState<BookChapter[]>(() => {
    localStorage.removeItem('ff_books');
    const saved = localStorage.getItem('edu_ai_uploaded_books');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map((b: BookChapter) => b.id));
          const missingCurriculum = ALL_CURRICULUM_BOOKS.filter((b) => !savedIds.has(b.id));
          return [...parsed, ...missingCurriculum];
        }
      } catch {
        return ALL_CURRICULUM_BOOKS;
      }
    }
    return ALL_CURRICULUM_BOOKS;
  });

  useEffect(() => {
    localStorage.setItem('edu_ai_uploaded_books', JSON.stringify(books));
  }, [books]);

  // Current active book
  const [selectedBook, setSelectedBook] = useState<BookChapter | null>(() => {
    return books.length > 0 ? books[0] : null;
  });

  // Ensure selectedBook stays synced when books change
  useEffect(() => {
    if (!selectedBook && books.length > 0) {
      setSelectedBook(books[0]);
    } else if (selectedBook && !books.some((b) => b.id === selectedBook.id)) {
      setSelectedBook(books.length > 0 ? books[0] : null);
    }
  }, [books, selectedBook]);

  // Student level & personalization synced from user profile
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [bilingualMode, setBilingualMode] = useState<boolean>(false);

  useEffect(() => {
    if (user?.cefrLevel) {
      setCefrLevel(user.cefrLevel);
    }
  }, [user?.cefrLevel]);

  // Flashcards state, dynamically hydrated with user's isolated vocabulary from backend
  const [flashcards, setFlashcards] = useState<Flashcard[]>(INITIAL_FLASHCARDS);

  // Load user's private vocabulary from database on mount / login
  const loadUserVocabulary = useCallback(async () => {
    if (!user) return;
    try {
      const userVocab = await storageService.getVocabulary();
      if (userVocab.length > 0) {
        const convertedCards: Flashcard[] = userVocab.map((v) => ({
          id: v.id,
          word: v.word,
          partOfSpeech: 'vocabulary',
          definition: v.definition,
          example: v.example || `Essential ${v.cefrLevel} vocabulary word.`,
          mastered: v.srsStage >= 3,
        }));
        // Merge user cards with initial curriculum cards
        setFlashcards((prev) => {
          const existingIds = new Set(convertedCards.map((c) => c.id));
          const filtered = prev.filter((c) => !existingIds.has(c.id));
          return [...convertedCards, ...filtered];
        });
      }
    } catch (err) {
      console.warn('Could not load user vocabulary from database:', err);
    }
  }, [user]);

  useEffect(() => {
    loadUserVocabulary();
  }, [loadUserVocabulary]);

  // AI Tutor Slide-over drawer state
  const [isTutorDrawerOpen, setIsTutorDrawerOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [explanationData, setExplanationData] = useState<AIExplanationResult | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Question evaluations state (id -> evaluation result)
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<Record<string, any>>({});
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);

  // Book upload callback
  const handleBookUploaded = (newBook: BookChapter) => {
    setBooks((prev) => {
      const updated = [newBook, ...prev.filter((b) => b.id !== newBook.id)];
      return updated;
    });
    setSelectedBook(newBook);
    setReaderSubTab('story');
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete book callback
  const handleDeleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (selectedBook?.id === bookId) {
      const remaining = books.filter((b) => b.id !== bookId);
      setSelectedBook(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // Clear all books callback
  const handleClearAllBooks = () => {
    setBooks([]);
    setSelectedBook(null);
    localStorage.removeItem('edu_ai_uploaded_books');
  };

  // Restore all official curriculum books
  const handleRestoreOfficialBooks = () => {
    setBooks(ALL_CURRICULUM_BOOKS);
    setSelectedBook(ALL_CURRICULUM_BOOKS[0]);
    localStorage.setItem('edu_ai_uploaded_books', JSON.stringify(ALL_CURRICULUM_BOOKS));
  };

  // Open book and switch to reader
  const handleSelectBookFromLibrary = (
    book: BookChapter,
    subTab: 'story' | 'poems' | 'questions' | 'grammar' = 'story'
  ) => {
    setSelectedBook(book);
    setReaderSubTab(subTab);
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Record user reading progress
    storageService.saveReadingProgress(book.id, 0, 0).catch(() => {});
  };

  // Trigger line-by-line explanation with Gemini AI
  const handleExplainText = async (text: string, context?: string) => {
    setSelectedText(text);
    setIsTutorDrawerOpen(true);
    setIsExplaining(true);
    setExplanationData(null);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText: text,
          context: context || (selectedBook ? selectedBook.title : 'Literature Chapter'),
          cefrLevel,
          bilingual: bilingualMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI explanation');
      }

      const result: AIExplanationResult = await response.json();
      setExplanationData(result);
    } catch (err) {
      console.error(err);
      setExplanationData({
        simpleMeaning:
          'This passage highlights key emotional and thematic developments in the story. Look closely at how the characters react to unforeseen challenges.',
        paraphrase: text,
        vocabulary: [
          {
            word: 'expression',
            meaning: 'The action of making known one’s thoughts or feelings',
            partOfSpeech: 'noun',
            synonym: 'utterance',
          },
        ],
        grammarNotes: ['Notice the sentence structure and descriptive imagery used by the author.'],
        literaryDevices: ['Thematic symbolism and figurative phrasing.'],
        studentInsight: 'Consider how this quote directly answers analytical reading questions.',
      });
    } finally {
      setIsExplaining(false);
    }
  };

  // Ask follow-up question from drawer: switch to Tutor/Chat tab
  const handleAskFollowUpFromDrawer = (_question: string) => {
    setIsTutorDrawerOpen(false);
    setActiveTab('chatbot');
  };

  // Web speech playback for drawer
  const handlePlaySpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Save new flashcard from drawer into local state and isolated SQLite database
  const handleSaveFlashcard = async (newCardData: Omit<Flashcard, 'id'>) => {
    const newCard: Flashcard = {
      id: `user-fc-${Date.now()}`,
      ...newCardData,
    };
    setFlashcards((prev) => [newCard, ...prev]);

    try {
      await storageService.saveVocabulary({
        word: newCard.word,
        definition: newCard.definition,
        example: newCard.example,
        cefrLevel: cefrLevel,
        srsStage: 1,
      });
    } catch (err) {
      console.error('Failed to sync vocabulary item to database:', err);
    }
  };

  // Toggle flashcard mastered
  const handleToggleMastered = (id: string) => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, mastered: !c.mastered } : c))
    );
  };

  // Add bulk new flashcards (e.g. from AI generator)
  const handleAddNewCards = (newCards: Flashcard[]) => {
    setFlashcards((prev) => [...newCards, ...prev]);
    // Save to user's database
    newCards.forEach((c) => {
      storageService.saveVocabulary({
        word: c.word,
        definition: c.definition,
        example: c.example,
        cefrLevel: cefrLevel,
        srsStage: 1,
      }).catch(() => {});
    });
  };

  // Evaluate textbook answers
  const handleEvaluateQuestionAnswer = async (q: TextbookQuestion, studentAnswer: string) => {
    setEvaluatingQuestionId(q.id);
    try {
      const response = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          chapterTitle: selectedBook?.title || 'Uploaded Chapter',
          studentAnswer,
          maxScore: 5,
        }),
      });

      if (!response.ok) throw new Error('Evaluation failed');
      const data = await response.json();

      setEvaluatedAnswers((prev) => ({
        ...prev,
        [q.id]: data,
      }));
    } catch (err) {
      console.error(err);
      alert('Could not evaluate answer. Please try again.');
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation Bar with User Profile & Logout */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bilingualMode={bilingualMode}
        setBilingualMode={setBilingualMode}
        onUploadBookClick={() => setIsUploadModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 ${activeTab === 'chatbot' ? 'max-w-[1440px]' : 'max-w-7xl'}`}>
        {/* Tab 1: Book & Curriculum Library */}
        {activeTab === 'library' && (
          <BookLibrary
            books={books}
            onSelectBook={handleSelectBookFromLibrary}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onDeleteBook={handleDeleteBook}
            onClearAllBooks={handleClearAllBooks}
            onRestoreOfficialBooks={handleRestoreOfficialBooks}
          />
        )}

        {/* Tab 2: Smart Reader View */}
        {activeTab === 'reader' && (
          <ReaderView
            book={selectedBook}
            allBooks={books}
            onSelectAnotherBook={(b) => setSelectedBook(b)}
            onExplainText={handleExplainText}
            activeSubTab={readerSubTab}
            setActiveSubTab={setReaderSubTab}
            onEvaluateQuestionAnswer={handleEvaluateQuestionAnswer}
            evaluatedAnswers={evaluatedAnswers}
            evaluatingQuestionId={evaluatingQuestionId}
            onUploadBookClick={() => setIsUploadModalOpen(true)}
          />
        )}

        {/* Tab 3: Gemini Multi-Turn Chatbot */}
        {activeTab === 'chatbot' && (
          <GeminiChatbot
            books={books}
            selectedChapter={selectedBook || undefined}
            onSelectChapter={(b) => setSelectedBook(b)}
          />
        )}

        {/* Tab 4: Live Voice Tutor (Gemini 3.1 Flash Live preview) */}
        {activeTab === 'live-voice' && (
          <LiveVoiceTutor
            currentBookTitle={selectedBook?.title || 'Edu.ai Intelligent Study Companion'}
            currentChapterTitle={selectedBook?.subtitle || 'Active Reading Unit'}
          />
        )}

        {/* Tab 5: Adaptive Learning Cognitive Engine */}
        {activeTab === 'adaptive' && (
          <AdaptiveLearningModule
            books={books}
            selectedChapter={selectedBook || undefined}
            onSelectChapter={(b) => setSelectedBook(b)}
          />
        )}

        {/* Tab 6: Academic Research Assistant & Citations */}
        {activeTab === 'research' && <ResearchAssistant />}

        {/* Tab 7: Concept Simplifier & Summarizer */}
        {activeTab === 'concept-summary' && (
          <ConceptExplainer
            books={books}
            selectedChapter={selectedBook || undefined}
          />
        )}

        {/* Tab 8: Quiz & Assessment Arena */}
        {activeTab === 'quiz' && (
          <QuizArena
            books={books}
            selectedBookId={selectedBook?.id || ''}
            onSelectBook={(b) => setSelectedBook(b)}
          />
        )}

        {/* Tab 9: Writing Lab */}
        {activeTab === 'writing' && (
          <WritingLab
            books={books}
            selectedBookId={selectedBook?.id || ''}
            onSelectBook={(b) => setSelectedBook(b)}
          />
        )}

        {/* Tab 10: Smart Flashcards */}
        {activeTab === 'flashcards' && (
          <FlashcardDeck
            cards={flashcards}
            books={books}
            onToggleMastered={handleToggleMastered}
            onAddNewCards={handleAddNewCards}
          />
        )}

        {/* Tab 11: Grammar Workshop */}
        {activeTab === 'grammar' && <GrammarWorkshop books={books} />}
      </main>

      {/* Slide-in AI Tutor Side Drawer */}
      <AITutorPanel
        isOpen={isTutorDrawerOpen}
        onClose={() => setIsTutorDrawerOpen(false)}
        selectedText={selectedText}
        currentBook={selectedBook}
        explanation={explanationData}
        isLoading={isExplaining}
        cefrLevel={cefrLevel}
        bilingualMode={bilingualMode}
        onSaveFlashcard={handleSaveFlashcard}
        onAskFollowUp={handleAskFollowUpFromDrawer}
        onPlaySpeech={handlePlaySpeech}
        isSpeaking={isSpeaking}
      />

      {/* Book Upload Modal */}
      <BookUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onBookUploaded={handleBookUploaded}
      />

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-700">
          Edu.ai • Intelligent Literature & Language Learning Companion
        </p>
        <p className="opacity-75">
          Per-User Isolated Account • Powered by Google Gemini AI
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
