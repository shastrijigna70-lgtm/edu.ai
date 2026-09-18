import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  Quote,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { ResearchQueryResult } from '../types';

export const ResearchAssistant: React.FC = () => {
  const [query, setQuery] = useState(
    'Compare the theme of human resilience in Nelson Mandela’s speech with Anne Frank’s diary.'
  );
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'literature'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchQueryResult | null>(null);

  const sampleQueries = [
    {
      label: 'Resilience & Freedom',
      q: 'Compare the theme of human resilience in Nelson Mandela’s inauguration speech with Anne Frank’s diary.',
    },
    {
      label: 'Irony & Faith',
      q: 'How is situational and dramatic irony employed in "A Letter to God" regarding the postmaster’s charity?',
    },
    {
      label: 'Mortality & Grief',
      q: 'Contrast the grief of Kisa Gotami in "The Sermon at Benares" with Valli’s realization of death in "Madam Rides the Bus".',
    },
    {
      label: 'Nature & Awakening',
      q: 'Analyze the symbolism of nature breaking free in Adrienne Rich’s "The Trees" and Robert Frost’s "Dust of Snow".',
    },
  ];

  const handleSearch = async (customQuery?: string) => {
    const q = customQuery || query.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          selectedSubject: subjectFilter,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Research synthesis failed.');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Research error:', err);
      let friendlyMsg = 'Research synthesis encountered temporary high demand. Please try again.';
      if (err?.message) {
        try {
          if (err.message.includes('{')) {
            const jsonStart = err.message.indexOf('{');
            const parsedErr = JSON.parse(err.message.substring(jsonStart));
            friendlyMsg = parsedErr?.error?.message || parsedErr?.error || parsedErr?.message || err.message;
          } else {
            friendlyMsg = err.message;
          }
        } catch {
          friendlyMsg = err.message;
        }
      }
      setErrorMsg(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="research-assistant-container" className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              Academic Research & Citation Assistant
            </span>
            <span className="text-xs text-indigo-200/80">Cross-Book Textual Synthesis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            English Literature Research & Citation Engine
          </h1>
          <p className="text-indigo-200/90 text-sm mt-1 max-w-2xl leading-relaxed">
            Investigate deep thematic and cross-cutting questions across your NCERT Class 10 English curriculum
            (First Flight & Footprints). Get structured scholarly briefings with exact chapter citations.
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="research-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search literary themes, character arcs, poetic devices, or comparative questions..."
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            id="run-research-btn"
            type="submit"
            disabled={!query.trim() || isLoading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search Books</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Presets:
          </span>
          {sampleQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(item.q);
                handleSearch(item.q);
              }}
              className="text-xs bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div
          id="research-error-banner"
          className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Unable to complete research synthesis</p>
            <p className="text-rose-700 text-xs mt-0.5">{errorMsg}</p>
          </div>
          <button
            onClick={() => handleSearch()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Research Output Display */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          {/* Synthesized Briefing */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                Synthesized Research Note
              </span>
              <span className="text-xs text-slate-400">Grounded in Textbook Corpus</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">{result.query}</h2>
            <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
              {result.synthesizedAnswer}
            </div>
          </div>

          {/* Textual Citations and Excerpts */}
          {result.relevantExcerpts && result.relevantExcerpts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Quote className="w-4 h-4 text-indigo-600" />
                Curriculum Citations & Textual Evidence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.relevantExcerpts.map((excerpt, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-950">
                          {excerpt.bookTitle} • {excerpt.chapterTitle}
                        </span>
                      </div>
                      <blockquote className="text-xs text-slate-700 italic border-l-2 border-indigo-400 pl-3 py-1 my-2">
                        &quot;{excerpt.quote}&quot;
                      </blockquote>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Relevance: </span>
                      {excerpt.relevance}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights & Follow Ups */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            {result.keyInsights && result.keyInsights.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                  Key Scholarly Takeaways
                </h4>
                <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                  {result.keyInsights.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendedFollowUps && result.recommendedFollowUps.length > 0 && (
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                  Recommended Follow-Up Inquiries
                </h4>
                <div className="space-y-1.5">
                  {result.recommendedFollowUps.map((fu, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(fu);
                        handleSearch(fu);
                      }}
                      className="text-left text-xs text-indigo-800 hover:text-indigo-950 hover:underline block"
                    >
                      → {fu}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
