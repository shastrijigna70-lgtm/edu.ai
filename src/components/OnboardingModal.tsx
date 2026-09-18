import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { CEFRLevel } from '../types';
import { Sparkles, Target, Compass, Check, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

const CEFR_LEVELS: { level: CEFRLevel; title: string; desc: string }[] = [
  { level: 'A2', title: 'Elementary (A2)', desc: 'Basic vocabulary and everyday sentences.' },
  { level: 'B1', title: 'Intermediate (B1)', desc: 'Standard Class 10 curriculum, prose understanding.' },
  { level: 'B2', title: 'Upper Intermediate (B2)', desc: 'Complex literary devices, critical analysis.' },
  { level: 'C1', title: 'Advanced (C1)', desc: 'Scholarly critique, deep linguistic nuances.' },
];

const GOALS = [
  'CBSE Class 10 Board Exam Excellence',
  'Vocabulary & Literary Analysis Mastery',
  'Grammar, Writing & Expression Skills',
  'General Reading Comprehension & Fluency',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { user, completeOnboarding } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(user?.cefrLevel || 'B1');
  const [selectedGoal, setSelectedGoal] = useState<string>(GOALS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await completeOnboarding(selectedLevel, selectedGoal);
      onComplete();
    } catch (err: any) {
      console.warn('Onboarding update notice:', err?.message || err);
      // If saving fails (e.g. network glitch or offline), do not trap the user in an error loop
      setErrorMessage(err?.message || 'Could not save preferences to cloud. You can still continue.');
      // After a short moment or user click, allow continuing
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome, {user?.displayName || 'Scholar'}!</span>
          </div>
          <h2 className="text-xl font-bold font-serif">Personalize Your Learning Journey</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Tailor AI explanations, vocabulary difficulty, and exam questions to your goals.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Target CEFR Level */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>1. Select Target CEFR Proficiency Level</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CEFR_LEVELS.map((item) => {
                const isSelected = selectedLevel === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSelectedLevel(item.level)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Learning Goal */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>2. Choose Primary Learning Objective</span>
            </div>
            <div className="space-y-2">
              {GOALS.map((goal) => {
                const isSelected = selectedGoal === goal;
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setSelectedGoal(goal)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span>{goal}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={onComplete}
                className="ml-2 font-semibold underline text-amber-800 hover:text-amber-950"
              >
                Continue anyway
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          {errorMessage && (
            <button
              type="button"
              onClick={onComplete}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Skip
            </button>
          )}
          <button
            id="btn-complete-onboarding"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            {submitting ? (
              <span>Saving Preferences...</span>
            ) : (
              <>
                <span>Enter Learning Suite</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
