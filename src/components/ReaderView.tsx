import React, { useState, useEffect } from 'react';
import {
  BookChapter,
  TextbookQuestion,
  GrammarExercise
} from '../types';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Type,
  Sun,
  Moon,
  Coffee,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Feather,
  HelpCircle,
  SlidersHorizontal,
  CheckCircle2,
  Send,
  Loader2,
  Share2,
  Layers
} from 'lucide-react';

interface ReaderViewProps {
  book: BookChapter | null;
  allBooks: BookChapter[];
  onSelectAnotherBook: (b: BookChapter) => void;
  onExplainText: (text: string, context?: string) => void;
  activeSubTab: 'story' | 'poems' | 'questions' | 'grammar';
  setActiveSubTab: (tab: 'story' | 'poems' | 'questions' | 'grammar') => void;
  onEvaluateQuestionAnswer: (q: TextbookQuestion, ans: string) => void;
  evaluatedAnswers: Record<string, any>;
  evaluatingQuestionId: string | null;
  onUploadBookClick?: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  allBooks,
  onSelectAnotherBook,
  onExplainText,
  activeSubTab,
  setActiveSubTab,
  onEvaluateQuestionAnswer,
  evaluatedAnswers,
  evaluatingQuestionId,
  onUploadBookClick,
}) => {
  // Reader preferences
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [themeMode, setThemeMode] = useState<'white' | 'sepia' | 'dark'>('white');
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [activeSubPartIndex, setActiveSubPartIndex] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  // Stop speech when changing tab or book
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    }
  }, [book?.id, activeSubTab, activeSubPartIndex]);

  if (!book) {
    return (
      <div id="reader-empty-state" className="max-w-xl mx-auto my-12 p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-serif text-slate-900">No Book Selected</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your reading desk is clear. Upload a textbook chapter, literature piece, or study notes to begin interactive reading.
        </p>
        {onUploadBookClick && (
          <button
            id="reader-btn-upload-book"
            onClick={onUploadBookClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-colors"
          >
            <span>Upload Book Now</span>
          </button>
        )}
      </div>
    );
  }

  const handleReadAloud = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingIndex(index);
  };

  // Theme styles
  const themeStyles = {
    white: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#FBF0D9] text-[#433422] border-[#E8D7B8]',
    dark: 'bg-slate-900 text-slate-100 border-slate-800',
  };

  const containerBg = {
    white: 'bg-slate-100/70',
    sepia: 'bg-[#F4E4C1]/60',
    dark: 'bg-slate-950',
  };

  const currentParagraphs = book.subParts
    ? book.subParts[activeSubPartIndex]?.paragraphs || []
    : book.paragraphs;

  return (
    <div className={`rounded-2xl border transition-colors ${themeStyles[themeMode]} shadow-xs`}>
      {/* Top Controls Toolbar */}
      <div className="p-4 sm:px-6 border-b border-inherit flex flex-wrap items-center justify-between gap-4">
        {/* Book Selector & Unit Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {book.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg leading-tight">{book.title}</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {book.difficulty}
              </span>
            </div>
            <p className="text-xs opacity-75">{book.author} • {book.theme}</p>
          </div>
        </div>

        {/* Reader Customizer & Quick Book Nav */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Chapter Switcher Dropdown */}
          <select
            id="select-chapter"
            value={book.id}
            onChange={(e) => {
              const selected = allBooks.find((b) => b.id === e.target.value);
              if (selected) onSelectAnotherBook(selected);
            }}
            className="text-xs py-1.5 px-3 rounded-lg border border-inherit bg-transparent font-medium cursor-pointer"
          >
            {allBooks.map((b) => (
              <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                Ch {b.number}: {b.title}
              </option>
            ))}
          </select>

          {/* Font Family */}
          <button
            onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
            title="Toggle Serif / Sans-serif"
            className="p-1.5 rounded-lg border border-inherit hover:opacity-80 text-xs font-semibold px-2 flex items-center gap-1"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="uppercase text-[10px]">{fontFamily}</span>
          </button>

          {/* Font Size */}
          <div className="flex items-center border border-inherit rounded-lg overflow-hidden text-xs">
            {(['sm', 'base', 'lg'] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`px-2 py-1 uppercase font-bold text-[10px] transition-colors ${
                  fontSize === sz ? 'bg-indigo-600 text-white' : 'hover:opacity-75'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Theme Mode */}
          <div className="flex items-center border border-inherit rounded-lg overflow-hidden p-0.5">
            <button
              onClick={() => setThemeMode('white')}
              title="Paper White"
              className={`p-1 rounded ${themeMode === 'white' ? 'bg-indigo-600 text-white' : 'hover:opacity-75'}`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemeMode('sepia')}
              title="Warm Sepia"
              className={`p-1 rounded ${themeMode === 'sepia' ? 'bg-amber-700 text-white' : 'hover:opacity-75'}`}
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              title="Night Focus"
              className={`p-1 rounded ${themeMode === 'dark' ? 'bg-indigo-500 text-white' : 'hover:opacity-75'}`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Sub-Tabs (Story, Poems, Textbook Questions, Grammar Notes) */}
      <div className="px-4 sm:px-6 border-b border-inherit flex items-center gap-2 overflow-x-auto text-xs font-medium py-2.5">
        <button
          id="tab-sub-story"
          onClick={() => setActiveSubTab('story')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'story'
              ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
              : 'border border-inherit hover:opacity-80'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Full Story Text</span>
        </button>

        {(book.poems?.length || 0) > 0 && (
          <button
            id="tab-sub-poems"
            onClick={() => setActiveSubTab('poems')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'poems'
                ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                : 'border border-inherit hover:opacity-80'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Prescribed Poems ({book.poems?.length || 0})</span>
          </button>
        )}

        <button
          id="tab-sub-questions"
          onClick={() => setActiveSubTab('questions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'questions'
              ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
              : 'border border-inherit hover:opacity-80'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Textbook Questions ({book.questions?.length || 0})</span>
        </button>

        {(book.grammarExercises?.length || 0) > 0 && (
          <button
            id="tab-sub-grammar"
            onClick={() => setActiveSubTab('grammar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'grammar'
                ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                : 'border border-inherit hover:opacity-80'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Grammar & Language Focus</span>
          </button>
        )}
      </div>

      {/* Multi-part selector if applicable (e.g., Two Stories about Flying, Glimpses of India) */}
      {activeSubTab === 'story' && book.subParts && book.subParts.length > 0 && (
        <div className="px-4 sm:px-6 py-2.5 bg-indigo-50/40 dark:bg-indigo-950/30 border-b border-inherit flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Section:
          </span>
          {book.subParts.map((sp, idx) => (
            <button
              key={sp.id}
              onClick={() => setActiveSubPartIndex(idx)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeSubPartIndex === idx
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-inherit hover:bg-slate-100'
              }`}
            >
              {sp.title}
            </button>
          ))}
        </div>
      )}

      {/* Main Reading Surface */}
      <div className={`p-6 sm:p-10 ${containerBg[themeMode]} min-h-[500px]`}>
        {/* SUBTAB 1: STORY READING WITH INTERACTIVE CLICK-TO-EXPLAIN */}
        {activeSubTab === 'story' && (
          <div className="max-w-[720px] mx-auto space-y-6">
            {/* Guide Badge for Students */}
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Tip for students:</strong> Click any paragraph to get a line-by-line AI breakdown, vocabulary, and grammar notes!
                </span>
              </div>
            </div>

            {/* Before You Read note */}
            {book.beforeYouRead && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-950 dark:text-amber-200 space-y-1">
                <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-400">
                  Before You Read
                </span>
                <p className="leading-relaxed">{book.beforeYouRead}</p>
              </div>
            )}

            {/* SubPart title if applicable */}
            {book.subParts && book.subParts[activeSubPartIndex] && (
              <div className="text-center py-2 border-b border-inherit">
                <h3 className="text-lg sm:text-xl font-bold font-serif">
                  {book.subParts[activeSubPartIndex].title}
                </h3>
                {book.subParts[activeSubPartIndex].author && (
                  <p className="text-xs opacity-75">
                    By {book.subParts[activeSubPartIndex].author}
                  </p>
                )}
              </div>
            )}

            {/* Paragraphs */}
            <div
              className={`space-y-6 ${
                fontFamily === 'serif' ? 'font-serif' : 'font-sans'
              } ${
                fontSize === 'sm'
                  ? 'text-sm leading-relaxed'
                  : fontSize === 'lg'
                  ? 'text-lg leading-loose'
                  : 'text-base leading-relaxed sm:leading-loose'
              }`}
            >
              {currentParagraphs.map((paragraph, pIdx) => {
                const isCurrentlyPlaying = speakingIndex === pIdx;
                return (
                  <div
                    key={pIdx}
                    id={`p-${book.id}-${pIdx}`}
                    onClick={() => onExplainText(paragraph, book.title)}
                    className={`group relative p-4 rounded-xl transition-all cursor-pointer border ${
                      themeMode === 'dark'
                        ? 'hover:bg-slate-800/80 border-transparent hover:border-indigo-500/50'
                        : 'hover:bg-white border-transparent hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <p className="indent-4 text-justify">{paragraph}</p>

                    {/* Floating Hover Tools */}
                    <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-slate-800/95 backdrop-blur-xs p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadAloud(paragraph, pIdx);
                        }}
                        title={isCurrentlyPlaying ? 'Stop Reading' : 'Listen with Audio'}
                        className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {isCurrentlyPlaying ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExplainText(paragraph, book.title);
                        }}
                        title="Explain Line-by-Line with AI"
                        className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Explain</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 2: PRESCRIBED POEMS */}
        {activeSubTab === 'poems' && (
          <div className="max-w-[680px] mx-auto space-y-10">
            {book.poems.map((poem) => (
              <div
                key={poem.id}
                className={`p-6 sm:p-8 rounded-2xl border ${
                  themeMode === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
                } shadow-xs space-y-6`}
              >
                {/* Poem Header */}
                <div className="text-center space-y-1 border-b border-inherit pb-4">
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-widest">
                    Prescribed Poem
                  </span>
                  <h3 className="text-2xl font-bold font-serif">{poem.title}</h3>
                  <p className="text-xs opacity-75">By {poem.poet}</p>
                </div>

                {poem.introduction && (
                  <p className="text-xs italic opacity-85 text-center px-4 max-w-md mx-auto">
                    {poem.introduction}
                  </p>
                )}

                {/* Stanzas */}
                <div className="space-y-6 text-center">
                  {poem.stanzas.map((stanza, sIdx) => (
                    <div
                      key={sIdx}
                      onClick={() => onExplainText(stanza, `${poem.title} by ${poem.poet}`)}
                      className={`group relative p-4 rounded-xl cursor-pointer transition-all border border-transparent ${
                        themeMode === 'dark'
                          ? 'hover:bg-slate-700/50 hover:border-indigo-500'
                          : 'hover:bg-indigo-50/50 hover:border-indigo-300'
                      }`}
                    >
                      <pre className="font-serif text-sm sm:text-base whitespace-pre-wrap leading-relaxed inline-block text-left">
                        {stanza}
                      </pre>

                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        <Sparkles className="w-3 h-3" />
                        <span>Click to explain rhyme, meter, and symbolism with AI</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Poem Glossary */}
                {poem.glossary && poem.glossary.length > 0 && (
                  <div className="pt-4 border-t border-inherit space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Poem Glossary & Meanings
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {poem.glossary.map((g, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-xs"
                        >
                          <strong className="text-indigo-600 dark:text-indigo-300">{g.word}:</strong>{' '}
                          <span>{g.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SUBTAB 3: TEXTBOOK QUESTIONS (ORAL COMPREHENSION & THINKING ABOUT TEXT) */}
        {activeSubTab === 'questions' && (
          <div className="max-w-[760px] mx-auto space-y-6">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <h4 className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                NCERT Exam Preparation & AI Evaluation
              </h4>
              <p>
                Type your answer to any textbook question below. Click <strong>"Evaluate with AI"</strong> to receive an instant score, breakdown of strengths, missing key points, and a model answer!
              </p>
            </div>

            <div className="space-y-6">
              {(!book.questions || book.questions.length === 0) ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">No textbook questions available for this chapter yet.</p>
                </div>
              ) : (
                book.questions.map((q, idx) => {
                const currentAnswer = studentAnswers[q.id] || '';
                const evaluation = evaluatedAnswers[q.id];
                const isEvaluating = evaluatingQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    id={`question-box-${q.id}`}
                    className={`p-5 sm:p-6 rounded-2xl border ${
                      themeMode === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
                    } shadow-xs space-y-4`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {q.section} • Q{idx + 1}
                      </span>

                      <button
                        onClick={() =>
                          setRevealedHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                        }
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                      >
                        {revealedHints[q.id] ? 'Hide Model Summary' : 'View Model Summary'}
                      </button>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base leading-snug">{q.question}</h4>

                    {revealedHints[q.id] && q.modelAnswerSummary && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200">
                        <strong>Key Concept:</strong> {q.modelAnswerSummary}
                      </div>
                    )}

                    {/* Student Input Area */}
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        placeholder="Write your answer here for AI feedback and marks..."
                        value={currentAnswer}
                        onChange={(e) =>
                          setStudentAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className={`w-full p-3 text-xs sm:text-sm rounded-xl border ${
                          themeMode === 'dark'
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        } focus:outline-hidden focus:ring-2 focus:ring-indigo-500`}
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] opacity-60">
                          {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words
                        </span>

                        <button
                          onClick={() => onEvaluateQuestionAnswer(q, currentAnswer)}
                          disabled={!currentAnswer.trim() || isEvaluating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Evaluating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Evaluate with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Evaluation Result */}
                    {evaluation && (
                      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-slate-900/80 border border-indigo-200 dark:border-slate-700 space-y-3 text-xs animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400">
                            Score: {evaluation.score} / {evaluation.maxScore} Marks
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[11px] font-semibold border border-inherit">
                            {evaluation.score >= 4 ? '🌟 Excellent' : '👍 Good Attempt'}
                          </span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {evaluation.feedback}
                        </p>

                        {evaluation.strengths && evaluation.strengths.length > 0 && (
                          <div className="space-y-1">
                            <strong className="text-emerald-700 dark:text-emerald-400">
                              Strengths:
                            </strong>
                            <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400">
                              {evaluation.strengths.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {evaluation.improvements && evaluation.improvements.length > 0 && (
                          <div className="space-y-1">
                            <strong className="text-amber-700 dark:text-amber-400">
                              How to gain full marks:
                            </strong>
                            <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400">
                              {evaluation.improvements.map((imp: string, i: number) => (
                                <li key={i}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {evaluation.modelAnswer && (
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-inherit space-y-1">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                              Model Board-Exam Answer:
                            </span>
                            <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed">
                              "{evaluation.modelAnswer}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: GRAMMAR & LANGUAGE FOCUS */}
        {activeSubTab === 'grammar' && (
          <div className="max-w-[760px] mx-auto space-y-6">
            {(!book.grammarExercises || book.grammarExercises.length === 0) ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500">No grammar exercises found for this uploaded text.</p>
              </div>
            ) : (
              book.grammarExercises.map((ex) => (
              <div
                key={ex.id}
                className={`p-6 rounded-2xl border ${
                  themeMode === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
                } shadow-xs space-y-4`}
              >
                <div className="border-b border-inherit pb-3">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Grammar Workshop • {ex.topic}
                  </span>
                  <h4 className="text-base font-bold">{ex.title}</h4>
                  <p className="text-xs opacity-75 mt-1">{ex.instruction}</p>
                </div>

                <div className="space-y-4">
                  {ex.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-inherit space-y-2 text-xs sm:text-sm"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {itemIdx + 1}. {item.question}
                      </p>

                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                        <strong className="text-emerald-800 dark:text-emerald-400">
                          Solution & Grammar Rule:
                        </strong>
                        <p>{item.correctAnswer}</p>
                        <p className="opacity-80 italic">{item.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )))}
          </div>
        )}
      </div>
    </div>
  );
};
