import React, { useState } from 'react';
import {
  AIExplanationResult,
  BookChapter,
  CEFRLevel,
  Flashcard
} from '../types';
import {
  Sparkles,
  X,
  Volume2,
  BookmarkPlus,
  BookOpen,
  MessageSquare,
  Check,
  ChevronRight,
  Send,
  Loader2,
  Lightbulb,
  Split,
  Languages
} from 'lucide-react';

interface AITutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  contextText?: string;
  currentBook: BookChapter | null;
  explanation: AIExplanationResult | null;
  isLoading: boolean;
  cefrLevel: CEFRLevel;
  bilingualMode: boolean;
  onSaveFlashcard: (flashcard: Omit<Flashcard, 'id'>) => void;
  onAskFollowUp: (question: string) => void;
  onPlaySpeech: (text: string) => void;
  isSpeaking: boolean;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  isOpen,
  onClose,
  selectedText,
  currentBook,
  explanation,
  isLoading,
  cefrLevel,
  bilingualMode,
  onSaveFlashcard,
  onAskFollowUp,
  onPlaySpeech,
  isSpeaking,
}) => {
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleSaveWord = (vocab: { word: string; meaning: string; partOfSpeech: string }) => {
    onSaveFlashcard({
      word: vocab.word,
      partOfSpeech: vocab.partOfSpeech,
      definition: vocab.meaning,
      example: selectedText,
      chapterTitle: currentBook?.title || 'Study Material',
      mastered: false,
    });
    setSavedWords((prev) => ({ ...prev, [vocab.word]: true }));
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim()) return;
    onAskFollowUp(followUpQuestion.trim());
    setFollowUpQuestion('');
  };

  return (
    <aside
      id="ai-tutor-drawer"
      aria-label="AI Tutor Explanation Panel"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all duration-300"
    >
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Line-by-Line AI Tutor</h3>
              {bilingualMode && (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  हिन्दी
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
              {currentBook?.title || 'Study Material'}
            </p>
          </div>
        </div>

        <button
          id="btn-close-tutor-panel"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-800">
        {/* Selected Quote Card */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-700 font-semibold">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Selected Sentence / Line
            </span>
            <button
              id="btn-speak-selected-text"
              onClick={() => onPlaySpeech(selectedText)}
              className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-white/80 px-2 py-0.5 rounded border border-indigo-200"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'Playing...' : 'Read Aloud'}</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm font-serif italic text-slate-800 leading-relaxed pl-2 border-l-2 border-indigo-500">
            "{selectedText}"
          </p>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-indigo-600">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Generating line-by-line breakdown...
            </p>
          </div>
        )}

        {/* AI Results */}
        {!isLoading && explanation && (
          <div className="space-y-5 animate-fadeIn">
            {/* 1. Plain Meaning */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Plain English Meaning
              </h4>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-sm leading-relaxed text-slate-700 shadow-2xs">
                {explanation.simpleMeaning}
              </div>
            </div>

            {/* 2. Simplified Paraphrase */}
            {explanation.paraphrase && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-indigo-500" />
                  Simplified Modern Paraphrase
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-sans italic">
                  "{explanation.paraphrase}"
                </div>
              </div>
            )}

            {/* 3. Vocabulary Breakdown */}
            {explanation.vocabulary && explanation.vocabulary.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Key Vocabulary in Context</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    Click + to save to Flashcards
                  </span>
                </h4>
                <div className="space-y-2">
                  {explanation.vocabulary.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3 hover:border-indigo-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{v.word}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {v.partOfSpeech}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">{v.meaning}</p>
                        {v.synonym && (
                          <p className="text-[11px] text-indigo-600 font-medium">
                            Synonym: {v.synonym}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleSaveWord(v)}
                        disabled={savedWords[v.word]}
                        title="Save to Flashcards"
                        className={`p-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                          savedWords[v.word]
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200'
                        }`}
                      >
                        {savedWords[v.word] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <BookmarkPlus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Grammar & Literary Devices */}
            <div className="grid grid-cols-1 gap-4">
              {explanation.grammarNotes && explanation.grammarNotes.length > 0 && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">
                    Grammar & Syntax Insight
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                    {explanation.grammarNotes.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {explanation.literaryDevices && explanation.literaryDevices.length > 0 && (
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800">
                    Literary Devices & Metaphors
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                    {explanation.literaryDevices.map((l, idx) => (
                      <li key={idx}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 5. Exam Tip / Student Insight */}
            {explanation.studentInsight && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-600" />
                  Exam Answer Reflection Tip
                </span>
                <p className="text-xs text-amber-950 leading-relaxed">
                  {explanation.studentInsight}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer: Ask Follow-up Form */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <form onSubmit={handleFollowUpSubmit} className="flex items-center gap-2">
          <input
            id="input-tutor-followup"
            type="text"
            placeholder="Ask AI tutor any question about this line..."
            value={followUpQuestion}
            onChange={(e) => setFollowUpQuestion(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <button
            id="btn-submit-tutor-followup"
            type="submit"
            disabled={!followUpQuestion.trim()}
            className="p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
