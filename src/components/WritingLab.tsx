import React, { useState } from 'react';
import { BookChapter, WritingEvaluation } from '../types';
import {
  PenTool,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

interface WritingLabProps {
  books: BookChapter[];
  selectedBookId: string;
  onSelectBook: (b: BookChapter) => void;
}

export const WritingLab: React.FC<WritingLabProps> = ({
  books,
  selectedBookId,
  onSelectBook,
}) => {
  const currentBook = books.find((b) => b.id === selectedBookId) || books[0] || null;
  const defaultPrompt = {
    id: 'wp-default',
    title: 'Literary Reflection Essay',
    prompt: currentBook
      ? `Reflect on the central ideas and character motives in "${currentBook.title}".`
      : 'Write an analytical reflection on a literary piece or theme.',
    type: 'essay' as const,
    wordCount: '150-200 words',
  };

  const prompts = (currentBook?.writingPrompts && currentBook.writingPrompts.length > 0)
    ? currentBook.writingPrompts
    : [defaultPrompt];

  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const activePrompt = prompts[selectedPromptIndex] || defaultPrompt;

  const [studentText, setStudentText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null);
  const [copiedPolished, setCopiedPolished] = useState(false);

  const wordCount = studentText.trim().split(/\s+/).filter(Boolean).length;

  const handleEvaluate = async () => {
    if (!studentText.trim() || isEvaluating) return;
    setIsEvaluating(true);

    try {
      const response = await fetch('/api/ai/evaluate-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activePrompt.title,
          promptType: activePrompt.type,
          studentText: studentText,
        }),
      });

      if (!response.ok) throw new Error('Evaluation failed');
      const data: WritingEvaluation = await response.json();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
      alert('Writing evaluation failed. Please check connection and try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const copyPolishedText = () => {
    if (!evaluation?.polishedVersion) return;
    navigator.clipboard.writeText(evaluation.polishedVersion);
    setCopiedPolished(true);
    setTimeout(() => setCopiedPolished(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
            Writing Lab & AI Grader
          </span>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            {activePrompt?.title || 'Creative Composition'}
          </h2>
          <p className="text-xs text-slate-500">
            Target length: {activePrompt?.wordCount || '100-150 words'} • Type: {activePrompt?.type?.toUpperCase()}
          </p>
        </div>

        {/* Chapter Switcher */}
        <select
          value={currentBook?.id || ''}
          onChange={(e) => {
            const b = books.find((x) => x.id === e.target.value);
            if (b) {
              onSelectBook(b);
              setSelectedPromptIndex(0);
              setEvaluation(null);
            }
          }}
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
      </div>

      {/* Prompt Card */}
      <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2 text-xs sm:text-sm">
        <span className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          Textbook Writing Prompt
        </span>
        <p className="text-indigo-950 leading-relaxed font-serif">
          {activePrompt?.prompt}
        </p>
      </div>

      {/* Writing Editor & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Student Composition Draft</span>
          <span className={wordCount < 50 ? 'text-amber-600' : 'text-emerald-600'}>
            {wordCount} words
          </span>
        </div>

        <textarea
          id="textarea-writing-draft"
          rows={8}
          placeholder="Start drafting your response here. Focus on clear arguments, rich vocabulary, and proper punctuation..."
          value={studentText}
          onChange={(e) => setStudentText(e.target.value)}
          className="w-full p-4 rounded-xl border border-slate-200 text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-serif"
        />

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-400">
            Write at least 30-50 words before requesting AI grading.
          </p>

          <button
            id="btn-evaluate-writing"
            onClick={handleEvaluate}
            disabled={wordCount < 15 || isEvaluating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors shadow-xs"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Grading & Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Evaluate with AI Grader</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Detailed Evaluation Report */}
      {evaluation && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fadeIn">
          {/* Top Score Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Overall AI Assessment
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Grade: {evaluation.overallScore} / 10
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">{evaluation.overview}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center w-full sm:w-auto">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-400 text-[10px] block font-medium">Content</span>
                <span className="font-bold text-indigo-600">{evaluation.scores.content}/10</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-400 text-[10px] block font-medium">Vocabulary</span>
                <span className="font-bold text-indigo-600">{evaluation.scores.vocabulary}/10</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-400 text-[10px] block font-medium">Grammar</span>
                <span className="font-bold text-indigo-600">{evaluation.scores.grammar}/10</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-400 text-[10px] block font-medium">Structure</span>
                <span className="font-bold text-indigo-600">{evaluation.scores.structure}/10</span>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Strengths in Your Composition
              </h4>
              <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-1">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Grammar Corrections */}
          {evaluation.grammarCorrections && evaluation.grammarCorrections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Grammar & Mechanics Corrections
              </h4>
              <div className="space-y-2">
                {evaluation.grammarCorrections.map((corr, i) => (
                  <div key={i} className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-900 line-through font-mono">{corr.original}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-800 font-bold font-mono">{corr.corrected}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{corr.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vocabulary Upgrades */}
          {evaluation.vocabularyUpgrades && evaluation.vocabularyUpgrades.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Vocabulary Upgrades for Higher Marks
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {evaluation.vocabularyUpgrades.map((upg, i) => (
                  <div key={i} className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">{upg.simpleWord}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-indigo-900 font-bold">{upg.suggestedWord}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{upg.context}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Polished Model Rewrite */}
          {evaluation.polishedVersion && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  AI Polished & Enriched Model Rewrite
                </h4>
                <button
                  onClick={copyPolishedText}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600"
                >
                  {copiedPolished ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPolished ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-serif italic leading-relaxed text-slate-800">
                "{evaluation.polishedVersion}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
