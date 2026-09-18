import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Award,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  Layers,
  Send,
} from 'lucide-react';
import { BookChapter, AdaptiveLearningStep } from '../types';

interface AdaptiveLearningModuleProps {
  books: BookChapter[];
  selectedChapter: BookChapter | null;
  onSelectChapter?: (chapter: BookChapter) => void;
}

export const AdaptiveLearningModule: React.FC<AdaptiveLearningModuleProps> = ({
  books,
  selectedChapter,
  onSelectChapter,
}) => {
  const [activeChapterId, setActiveChapterId] = useState<string>(
    selectedChapter?.id || (books.length > 0 ? books[0].id : '')
  );

  const activeChapter = books.find((b) => b.id === activeChapterId) || selectedChapter || books[0];

  // Initial Seed Questions across difficulty levels for selected chapter
  const getInitialStep = (chap?: BookChapter): AdaptiveLearningStep => {
    if (!chap) {
      return {
        id: 'step-init-default',
        level: 1,
        levelName: 'Core Literary Foundations',
        question: 'Upload a book in the Library to start adaptive learning challenges.',
        contextExcerpt: 'Waiting for uploaded curriculum material.',
        hint: 'Please upload a book or text from the Library tab.',
        conceptKey: 'Curriculum Waiting',
      };
    }
    return {
      id: `step-init-${chap.id}`,
      level: 1,
      levelName: 'Core Literary Foundations',
      question:
        chap.questions && chap.questions.length > 0
          ? chap.questions[0].question
          : `What is the central conflict or dilemma explored in "${chap.title}"?`,
      contextExcerpt:
        chap.paragraphs && chap.paragraphs.length > 0
          ? chap.paragraphs[0]
          : 'Reflect on the opening exposition and narrative stakes.',
      hint: 'Recall the opening situation, character motives, and how adversity tests their convictions.',
      conceptKey: 'Narrative Theme & Characterization',
    };
  };

  const [currentStep, setCurrentStep] = useState<AdaptiveLearningStep>(getInitialStep(activeChapter));
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      step: AdaptiveLearningStep;
      studentAnswer: string;
      evaluation: any;
    }>
  >([]);
  const [lastEvaluation, setLastEvaluation] = useState<any | null>(null);

  // Switch chapter handler
  const handleChapterChange = (newChapterId: string) => {
    setActiveChapterId(newChapterId);
    const newChap = books.find((b) => b.id === newChapterId);
    if (newChap) {
      if (onSelectChapter) onSelectChapter(newChap);
      const newStep = getInitialStep(newChap);
      setCurrentStep(newStep);
      setCurrentLevel(1);
      setStudentAnswer('');
      setLastEvaluation(null);
      setShowHint(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!studentAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ai/adaptive-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: activeChapter.title,
          chapterTitle: activeChapter.title,
          conceptTopic: currentStep.conceptKey,
          currentLevel,
          question: currentStep.question,
          studentAnswer: studentAnswer.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate adaptive response.');
      }

      const evaluation = await response.json();
      setLastEvaluation(evaluation);

      // Save to history
      setHistory((prev) => [
        ...prev,
        {
          step: currentStep,
          studentAnswer: studentAnswer.trim(),
          evaluation,
        },
      ]);

      // Calculate next difficulty level
      let nextLvl: 1 | 2 | 3 = currentLevel;
      if (evaluation.recommendedDifficultyAdjustment === 'promote' && currentLevel < 3) {
        nextLvl = (currentLevel + 1) as 1 | 2 | 3;
      } else if (evaluation.recommendedDifficultyAdjustment === 'remediate' && currentLevel > 1) {
        nextLvl = (currentLevel - 1) as 1 | 2 | 3;
      }
      setCurrentLevel(nextLvl);

      // Setup next step if provided
      if (evaluation.nextAdaptiveStep) {
        setCurrentStep({
          id: evaluation.nextAdaptiveStep.id || `step-${Date.now()}`,
          level: nextLvl,
          levelName:
            nextLvl === 1
              ? 'Foundational Recall'
              : nextLvl === 2
              ? 'Conceptual Application'
              : 'Critical Analysis & Synthesis',
          question: evaluation.nextAdaptiveStep.question,
          contextExcerpt: evaluation.nextAdaptiveStep.contextExcerpt || currentStep.contextExcerpt,
          hint: evaluation.nextAdaptiveStep.hint,
          conceptKey: evaluation.nextAdaptiveStep.conceptKey || currentStep.conceptKey,
        });
      }
    } catch (err: any) {
      console.error('Adaptive step error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedNext = () => {
    setLastEvaluation(null);
    setStudentAnswer('');
    setShowHint(false);
  };

  return (
    <div id="adaptive-learning-module-container" className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                Adaptive Cognitive Engine
              </span>
              <span className="text-xs text-blue-200/80">Diagnostic Feedback & Dynamic Difficulty</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
              Interactive Adaptive Learning Module
            </h1>
            <p className="text-blue-200/90 text-sm mt-1 max-w-xl leading-relaxed">
              Answer open-ended or analytical questions. The AI evaluates your understanding, isolates
              misconceptions, provides targeted remedial coaching, and dynamically adjusts difficulty.
            </p>
          </div>

          {/* Chapter Selector */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <span className="text-xs text-blue-200 block mb-1.5 font-medium">Study Topic / Chapter:</span>
            <select
              id="adaptive-chapter-selector"
              value={activeChapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-900 text-white rounded-lg px-3 py-2 border border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {books.length === 0 ? (
                <option value="">No books uploaded yet</option>
              ) : (
                books.map((b) => (
                  <option key={b.id} value={b.id}>
                    Unit {b.number}: {b.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Progression Indicator */}
        <div className="mt-6 pt-4 border-t border-blue-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((lvl) => (
              <div
                key={lvl}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  currentLevel === lvl
                    ? 'bg-blue-400 text-slate-950 ring-2 ring-blue-300/60 font-bold scale-105'
                    : currentLevel > lvl
                    ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                    : 'bg-white/5 text-blue-300/50 border border-white/10'
                }`}
              >
                <span>Stage {lvl}</span>
                <span className="text-[10px] hidden sm:inline">
                  {lvl === 1 ? 'Foundations' : lvl === 2 ? 'Application' : 'Synthesis'}
                </span>
              </div>
            ))}
          </div>

          <div className="text-xs text-blue-200 font-mono">
            Mastery Steps: {history.length} completed
          </div>
        </div>
      </div>

      {/* Active Question or Evaluation Display */}
      {!lastEvaluation ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Question Stage Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentLevel === 1
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentLevel === 2
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {currentStep.levelName || `Stage ${currentLevel}`}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Concept: {currentStep.conceptKey || activeChapter.theme}
              </span>
            </div>

            {currentStep.hint && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
              </button>
            )}
          </div>

          {/* Context Excerpt */}
          {currentStep.contextExcerpt && (
            <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-blue-500 text-xs text-slate-600 leading-relaxed italic">
              <span className="font-semibold text-slate-800 not-italic block mb-1">
                Contextual Excerpt from &quot;{activeChapter.title}&quot;:
              </span>
              &quot;{currentStep.contextExcerpt}&quot;
            </div>
          )}

          {/* Hint Card */}
          {showHint && currentStep.hint && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Guided Hint: </span>
                {currentStep.hint}
              </div>
            </div>
          )}

          {/* Question Statement */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {currentStep.question}
            </h2>
          </div>

          {/* Student Answer Textarea */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Your Written Answer / Explanation:
            </label>
            <textarea
              id="adaptive-student-answer"
              rows={4}
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              placeholder="Express your thoughts clearly. Use specific terms, cause-and-effect reasoning, and textbook details..."
              className="w-full text-sm rounded-xl border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              The AI will diagnose your understanding and adapt the next step.
            </span>
            <button
              id="submit-adaptive-answer-btn"
              onClick={handleSubmitAnswer}
              disabled={!studentAnswer.trim() || isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Comprehension...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit for Diagnostic Evaluation
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Evaluation & Diagnostic Feedback Result Card */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    lastEvaluation.score >= 4
                      ? 'bg-emerald-100 text-emerald-800'
                      : lastEvaluation.score === 3
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Score: {lastEvaluation.score} / 5 Marks
                </span>

                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                  {lastEvaluation.recommendedDifficultyAdjustment === 'promote'
                    ? 'Advanced to Next Stage 🚀'
                    : lastEvaluation.recommendedDifficultyAdjustment === 'maintain'
                    ? 'Stage Maintained'
                    : 'Remedial Reinforcement Needed'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                Diagnostic Feedback on Your Response
              </h2>
            </div>

            <button
              id="proceed-to-next-step-btn"
              onClick={handleProceedNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <span>Next Adaptive Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback Text */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-sm text-blue-950 leading-relaxed">
            <span className="font-bold block mb-1">Personalized Coaching Note:</span>
            {lastEvaluation.feedback}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            {lastEvaluation.strengths && lastEvaluation.strengths.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Demonstrated Strengths
                </h3>
                <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
                  {lastEvaluation.strengths.map((str: string, i: number) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Misconceptions & Areas to Improve */}
            {lastEvaluation.misconceptionsFound && lastEvaluation.misconceptionsFound.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Identified Misconceptions
                </h3>
                <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                  {lastEvaluation.misconceptionsFound.map((misc: string, i: number) => (
                    <li key={i}>{misc}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Remedial Explanation & Book Excerpt */}
          {lastEvaluation.remedialExplanation && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Remedial Concept Explanation
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {lastEvaluation.remedialExplanation}
              </p>
              {lastEvaluation.bookExcerptReference && (
                <p className="text-xs font-mono text-blue-700 bg-blue-50/80 p-2.5 rounded-lg border border-blue-200/50">
                  Text Reference: &quot;{lastEvaluation.bookExcerptReference}&quot;
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* History of Completed Steps in this Session */}
      {history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Session Learning Trail ({history.length} Questions Answered)
          </h3>
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Q{idx + 1}: {item.step.question}
                  </span>
                  <span className="font-semibold text-blue-700">
                    Score: {item.evaluation.score}/5
                  </span>
                </div>
                <p className="text-slate-600 italic">Your Answer: &quot;{item.studentAnswer}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
