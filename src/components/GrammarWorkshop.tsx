import React, { useState } from 'react';
import { BookChapter } from '../types';
import {
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Award,
  BookOpen
} from 'lucide-react';

interface GrammarWorkshopProps {
  books: BookChapter[];
}

interface GrammarExerciseItem {
  id: string;
  topic: string;
  rule: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const NCERT_GRAMMAR_PRACTICE: GrammarExerciseItem[] = [
  {
    id: 'g-1',
    topic: 'Relative Clauses (Defining vs Non-Defining)',
    rule: 'Non-defining relative clauses provide extra, non-essential information and must be set off by commas. You cannot use "that" in a non-defining clause.',
    question: 'Choose the grammatically correct sentence with a non-defining relative clause:',
    options: [
      'My elder sister who lives in London is coming home next week.',
      'My elder sister, who lives in London, is coming home next week.',
      'My elder sister, that lives in London, is coming home next week.',
      'My elder sister which lives in London is coming home next week.',
    ],
    correctIndex: 1,
    explanation: 'Since the speaker has only one elder sister (or is identifying her by name/relation), the clause is non-defining and must be enclosed in commas. "That" is never used with commas in non-defining clauses.',
  },
  {
    id: 'g-2',
    topic: 'Active and Passive Voice',
    rule: 'In passive voice, the object of the active sentence becomes the subject. Use the appropriate form of "be" + past participle (V3).',
    question: 'Transform to Passive: "The postmaster handed the envelope containing seventy pesos to Lencho."',
    options: [
      'Lencho was handed the envelope containing seventy pesos by the postmaster.',
      'The envelope was handing to Lencho by the postmaster.',
      'The envelope had handed to Lencho by the postmaster.',
      'Lencho is handed the envelope containing seventy pesos by postmaster.',
    ],
    correctIndex: 0,
    explanation: '"The postmaster handed..." is in simple past tense, so passive requires "was/were + handed". Option A correctly conveys the passive structure.',
  },
  {
    id: 'g-3',
    topic: 'Reported / Indirect Speech',
    rule: 'When converting direct speech in past simple to indirect speech with a past reporting verb, past simple generally shifts to past perfect (had + V3).',
    question: 'Convert to Indirect: Anne Frank said, "Paper has more patience than people."',
    options: [
      'Anne Frank said that paper had had more patience than people.',
      'Anne Frank said that paper has more patience than people.',
      'Anne Frank said that paper had more patience than people.',
      'Anne Frank told that paper had more patience than people.',
    ],
    correctIndex: 2,
    explanation: 'The reporting verb "said" is in the past, so the present verb "has" shifts to "had". ("Said that..." is used without a personal object).',
  },
  {
    id: 'g-4',
    topic: 'Modal Auxiliaries of Obligation & Prohibition',
    rule: '"Must" indicates strong personal obligation or necessity, while "Must not" indicates strict prohibition.',
    question: 'Which modal best completes: "Citizens _____ fight against racial discrimination and uphold human dignity," declared Mandela.',
    options: ['may', 'must', 'might', 'could'],
    correctIndex: 1,
    explanation: '"Must" conveys the imperative moral duty and non-negotiable dedication to human equality.',
  },
  {
    id: 'g-5',
    topic: 'Collocations & Phrasal Verbs',
    rule: 'Collocations are habitual pairings of words (e.g., "plague of locusts", "conquer fear", "soaking wet").',
    question: 'What collective noun expression is used in "A Letter to God" for devastating insects?',
    options: [
      'A herd of locusts',
      'A swarm of locusts',
      'A plague of locusts',
      'A flock of locusts',
    ],
    correctIndex: 2,
    explanation: 'Lencho says, "Even a plague of locusts would have left more than this," which is the biblical and literary idiom.',
  },
];

export const GrammarWorkshop: React.FC<GrammarWorkshopProps> = ({ books }) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});

  const topics = Array.from(new Set(NCERT_GRAMMAR_PRACTICE.map((g) => g.topic)));

  const filteredItems = NCERT_GRAMMAR_PRACTICE.filter(
    (item) => selectedTopic === 'all' || item.topic === selectedTopic
  );

  const handleSelect = (itemId: string, optionIdx: number, correctIdx: number) => {
    if (userAnswers[itemId] !== undefined) return;
    setUserAnswers((prev) => ({ ...prev, [itemId]: optionIdx }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
            CBSE Class 10 Grammar Syllabus
          </span>
          <h2 className="text-xl font-bold font-serif text-slate-900">Grammar & Syntax Workshop</h2>
          <p className="text-xs text-slate-500">
            Rules, examples, and Board Exam conversion drills from First Flight.
          </p>
        </div>

        {/* Topic Filter */}
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer max-w-[240px]"
        >
          <option value="all">All Grammar Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Exercises List */}
      <div className="space-y-6">
        {filteredItems.map((item, idx) => {
          const hasAnswered = userAnswers[item.id] !== undefined;
          const isCorrect = userAnswers[item.id] === item.correctIndex;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {item.topic}
                </span>
                <span className="text-slate-400 font-medium">Exercise {idx + 1}</span>
              </div>

              {/* Grammar Rule Card */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                <strong className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-900">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  Key Rule to Remember:
                </strong>
                <p className="leading-relaxed">{item.rule}</p>
              </div>

              {/* Question */}
              <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {item.question}
              </h4>

              {/* Options */}
              <div className="space-y-2">
                {item.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[item.id] === optIdx;
                  const isTarget = optIdx === item.correctIndex;

                  let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';

                  if (hasAnswered) {
                    if (isTarget) {
                      btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                    } else if (isSelected && !isTarget) {
                      btnStyle = 'bg-rose-50 border-rose-300 text-rose-950 line-through';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 opacity-60 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(item.id, optIdx, item.correctIndex)}
                      disabled={hasAnswered}
                      className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-white border border-inherit flex items-center justify-center text-[11px] font-bold shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {hasAnswered && isTarget && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {hasAnswered && isSelected && !isTarget && (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after answer */}
              {hasAnswered && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <p>
                    <strong>{isCorrect ? '✅ Well done:' : '❌ Grammar Breakdown:'}</strong>{' '}
                    {item.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
