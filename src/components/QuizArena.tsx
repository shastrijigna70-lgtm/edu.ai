import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { BookChapter, QuizQuestion } from '../types';
import { CHAPTER_QUIZZES } from '../data/quizData';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Award,
  ArrowRight,
  BookOpen,
  Loader2,
  Check
} from 'lucide-react';

interface QuizArenaProps {
  books: BookChapter[];
  selectedBookId: string;
  onSelectBook: (b: BookChapter) => void;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  books,
  selectedBookId,
  onSelectBook,
}) => {
  const currentBook = books.find((b) => b.id === selectedBookId) || books[0] || null;

  const defaultQuiz = (currentBook && CHAPTER_QUIZZES[currentBook.id]) ||
    CHAPTER_QUIZZES['chapter-1'] || {
      title: currentBook ? `Quiz on ${currentBook.title}` : 'Curriculum Quiz',
      questions: [
        {
          question: 'What is the primary role of critical reading in literary analysis?',
          options: [
            'Memorizing word count without understanding',
            'Evaluating themes, tone, character motivations, and evidence',
            'Skipping difficult paragraphs',
            'Focusing purely on typography'
          ],
          correctIndex: 1,
          explanation: 'Critical reading requires active analytical engagement with themes, textual evidence, and tone.'
        }
      ]
    };

  const [questions, setQuestions] = useState<QuizQuestion[]>(defaultQuiz.questions);
  const [quizTitle, setQuizTitle] = useState(defaultQuiz.title);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isGeneratingAIQuiz, setIsGeneratingAIQuiz] = useState(false);

  // When chapter changes, reload default quiz
  const handleChapterChange = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (book) {
      onSelectBook(book);
      const q = CHAPTER_QUIZZES[bookId] || {
        title: `Quiz on ${book.title}`,
        questions: defaultQuiz.questions,
      };
      setQuestions(q.questions);
      setQuizTitle(q.title);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setIsCompleted(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (selectedAnswers[questionIndex] !== undefined) return; // Answered already
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const handleFinishQuiz = () => {
    setIsCompleted(true);
    const score = calculateScore();

    if (score >= questions.length * 0.7) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
  };

  // Generate new AI-powered quiz using backend
  const handleGenerateAIQuiz = async () => {
    setIsGeneratingAIQuiz(true);
    try {
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: currentBook.title,
          chapterName: `Chapter ${currentBook.number}`,
          difficulty: 'medium',
          focus: 'comprehension and vocabulary',
        }),
      });

      if (!response.ok) throw new Error('AI quiz generation failed');
      const data = await response.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setQuizTitle(data.title || `AI Challenge: ${currentBook.title}`);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setIsCompleted(false);
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate dynamic quiz. Please try again!');
    } finally {
      setIsGeneratingAIQuiz(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const hasAnsweredCurrent = selectedAnswers[currentQuestionIndex] !== undefined;
  const isCorrect = selectedAnswers[currentQuestionIndex] === currentQ?.correctIndex;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Quiz Header Bar */}
      <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
            Assessment Arena
          </span>
          <h2 className="text-xl font-bold font-serif text-slate-900">{quizTitle}</h2>
          <p className="text-xs text-slate-500">
            Chapter {currentBook.number}: {currentBook.title}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Chapter Selector */}
          <select
            value={currentBook?.id || ''}
            onChange={(e) => handleChapterChange(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer"
          >
            {books.length === 0 ? (
              <option value="">No books uploaded</option>
            ) : (
              books.map((b) => (
                <option key={b.id} value={b.id}>
                  Unit {b.number}: {b.title}
                </option>
              ))
            )}
          </select>

          {/* AI Generator Button */}
          <button
            onClick={handleGenerateAIQuiz}
            disabled={isGeneratingAIQuiz}
            title="Generate a fresh new set of AI questions"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-colors shadow-2xs"
          >
            {isGeneratingAIQuiz ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>Generate AI Quiz</span>
          </button>
        </div>
      </div>

      {/* Main Quiz View */}
      {!isCompleted && currentQ && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Progress tracker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Completed</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
              const isTargetCorrect = optIdx === currentQ.correctIndex;

              let optionStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';

              if (hasAnsweredCurrent) {
                if (isTargetCorrect) {
                  optionStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                } else if (isSelected && !isTargetCorrect) {
                  optionStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                } else {
                  optionStyle = 'bg-slate-50 border-slate-200 opacity-60 text-slate-500';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                  disabled={hasAnsweredCurrent}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-inherit flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {hasAnsweredCurrent && isTargetCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {hasAnsweredCurrent && isSelected && !isTargetCorrect && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box when answered */}
          {hasAnsweredCurrent && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed space-y-1 animate-fadeIn ${
                isCorrect
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Correct! Great comprehension.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Incorrect. Here is why:</span>
                  </>
                )}
              </div>
              <p className="opacity-90">{currentQ.explanation}</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                disabled={!hasAnsweredCurrent}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinishQuiz}
                disabled={!hasAnsweredCurrent}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
              >
                <span>Complete Assessment</span>
                <Award className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Result Screen */}
      {isCompleted && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold font-serif text-slate-900">Quiz Completed!</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              You scored{' '}
              <span className="font-bold text-indigo-600 text-base">
                {calculateScore()} out of {questions.length}
              </span>{' '}
              ({Math.round((calculateScore() / questions.length) * 100)}%)
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Curriculum module assessment completed!</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry This Quiz</span>
            </button>
            <button
              onClick={handleGenerateAIQuiz}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate New AI Questions</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
