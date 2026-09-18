import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { BookChapter } from '../types';

interface ConceptExplainerProps {
  books: BookChapter[];
  selectedChapter: BookChapter | null;
}

export const ConceptExplainer: React.FC<ConceptExplainerProps> = ({ books, selectedChapter }) => {
  const [activeTab, setActiveTab] = useState<'concept' | 'summarize'>('concept');

  // Concept Simplifier State
  const [conceptInput, setConceptInput] = useState('Situational Irony in A Letter to God');
  const [conceptDepth, setConceptDepth] = useState<'eli5' | 'high_school' | 'deep_dive'>('high_school');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationData, setExplanationData] = useState<any | null>(null);

  // Summarizer State
  const [summaryInputText, setSummaryInputText] = useState(
    selectedChapter?.paragraphs?.slice(0, 3).join('\n\n') ||
      'The house — the only one in the entire valley — sat on the crest of a low hill. From this height one could see the river and the field of ripe corn dotted with the flowers that always promised a good harvest. The only thing the earth needed was a downpour or at least a shower.'
  );
  const [summaryFormat, setSummaryFormat] = useState<'key_takeaways' | 'bullet_points' | 'mindmap' | 'tldr' | 'exam_notes'>('key_takeaways');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const conceptPresets = [
    {
      title: 'Situational Irony in Lencho',
      concept: 'Situational Irony in A Letter to God',
      depth: 'high_school' as const,
    },
    {
      title: 'Mandela’s Twin Obligations',
      concept: 'Twin Obligations of Every Citizen by Nelson Mandela',
      depth: 'high_school' as const,
    },
    {
      title: 'Adrienne Rich’s Symbolism',
      concept: 'Extended Metaphor of Trees Breaking Free in Adrienne Rich’s Poem',
      depth: 'high_school' as const,
    },
    {
      title: 'Valli’s Independence & Maturity',
      concept: 'Coming-of-Age and Self-Reliance in Madam Rides the Bus',
      depth: 'high_school' as const,
    },
    {
      title: 'Buddha’s Mustard Seed Parable',
      concept: 'Universal Grief and Mortality in The Sermon at Benares',
      depth: 'high_school' as const,
    },
    {
      title: 'Cat Metaphor in Fog',
      concept: 'Carl Sandburg’s Metaphor of Fog Arriving on Little Cat Feet',
      depth: 'eli5' as const,
    },
  ];

  const handleExplainConcept = async (customConcept?: string) => {
    const c = customConcept || conceptInput.trim();
    if (!c || isExplaining) return;

    setIsExplaining(true);
    try {
      const res = await fetch('/api/ai/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: c,
          depth: conceptDepth,
          context: selectedChapter ? selectedChapter.title : 'Curriculum',
        }),
      });

      if (!res.ok) throw new Error('Concept explanation failed.');

      const data = await res.json();
      setExplanationData(data);
    } catch (err: any) {
      console.error('Error explaining concept:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSummarize = async () => {
    if (!summaryInputText.trim() || isSummarizing) return;

    setIsSummarizing(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summaryInputText.trim(),
          format: summaryFormat,
          bookTitle: selectedChapter?.title || 'Curriculum',
        }),
      });

      if (!res.ok) throw new Error('Summarization failed.');

      const data = await res.json();
      setSummaryResult(data.summary);
    } catch (err: any) {
      console.error('Error summarizing:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const copySummary = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div id="concept-explainer-container" className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-orange-950 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-amber-800/40">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Feynman Simplifier & Text Summarizer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            Difficult Concept Breakdown & Text Summaries
          </h1>
          <p className="text-amber-200/90 text-sm mt-1 max-w-xl leading-relaxed">
            Deconstruct abstract concepts into memorable real-world analogies, or condense long
            textbook chapters into high-yield revision notes.
          </p>

          {/* Sub-Tab Selector */}
          <div className="flex items-center gap-2 mt-6">
            <button
              id="tab-concept-btn"
              onClick={() => setActiveTab('concept')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'concept'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Feynman Concept Simplifier</span>
            </button>

            <button
              id="tab-summarize-btn"
              onClick={() => setActiveTab('summarize')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'summarize'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Long Text Summarizer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Feynman Concept Simplifier */}
      {activeTab === 'concept' && (
        <div className="space-y-6">
          {/* Presets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Popular Difficult Concepts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {conceptPresets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setConceptInput(p.concept);
                    setConceptDepth(p.depth);
                    handleExplainConcept(p.concept);
                  }}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-xs"
                >
                  <span className="font-semibold text-slate-900 block">{p.title}</span>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{p.concept}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Concept or Topic Name
                </label>
                <input
                  id="concept-input-field"
                  type="text"
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  placeholder="e.g., Situational irony, Extended metaphor in Fog, Mandela’s twin obligations, Symbolism in The Trees..."
                  className="w-full text-sm rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Explanation Depth
                </label>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'eli5', label: 'Simple Analogy (ELI5)' },
                    { id: 'high_school', label: 'Standard Syllabus' },
                    { id: 'deep_dive', label: 'Deep Mechanism' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setConceptDepth(d.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        conceptDepth === d.id
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              id="explain-concept-submit-btn"
              onClick={() => handleExplainConcept()}
              disabled={!conceptInput.trim() || isExplaining}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              {isExplaining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Simplifying Concept...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4" />
                  Simplify with Feynman Method
                </>
              )}
            </button>
          </div>

          {/* Explanation Output */}
          {explanationData && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  Feynman Breakdown
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  {explanationData.concept}
                </h2>
              </div>

              {/* Simple Meaning */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-slate-800 text-sm leading-relaxed">
                <span className="font-bold text-amber-950 block mb-1">Simple Explanation:</span>
                {explanationData.simpleExplanation}
              </div>

              {/* Real World Analogy */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-slate-800 text-sm leading-relaxed">
                <span className="font-bold text-blue-950 block mb-1">💡 Real-World Analogy:</span>
                {explanationData.realWorldAnalogy}
              </div>

              {/* Visual Mental Model */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 text-slate-800 text-sm leading-relaxed">
                <span className="font-bold text-purple-950 block mb-1">🧠 Visual Mental Model:</span>
                {explanationData.visualMentalModel}
              </div>

              {/* Common Misconceptions */}
              {explanationData.commonMisconceptions && (
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-slate-800 text-xs leading-relaxed">
                  <span className="font-bold text-rose-950 block mb-1">⚠️ Common Pitfalls:</span>
                  <ul className="list-disc list-inside space-y-1 text-rose-900">
                    {explanationData.commonMisconceptions.map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Long Text Summarizer */}
      {activeTab === 'summarize' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Passage or Text to Summarize:
            </label>
            <textarea
              id="summarize-input-textarea"
              rows={5}
              value={summaryInputText}
              onChange={(e) => setSummaryInputText(e.target.value)}
              placeholder="Paste any textbook excerpt, long essay, or question to summarize..."
              className="w-full text-sm rounded-xl border border-slate-300 p-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Summary Output Format:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'key_takeaways', label: 'Key Takeaways' },
                  { id: 'bullet_points', label: 'Bullet Points' },
                  { id: 'mindmap', label: 'Concept Mindmap' },
                  { id: 'tldr', label: '1-Line TL;DR' },
                  { id: 'exam_notes', label: 'Board Exam Notes' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSummaryFormat(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      summaryFormat === f.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="run-summary-btn"
              onClick={handleSummarize}
              disabled={!summaryInputText.trim() || isSummarizing}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              {isSummarizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Summary
                </>
              )}
            </button>
          </div>

          {/* Summary Result */}
          {summaryResult && (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Summary Result ({summaryFormat.replace('_', ' ')})
                </span>
                <button
                  onClick={copySummary}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">
                {summaryResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
