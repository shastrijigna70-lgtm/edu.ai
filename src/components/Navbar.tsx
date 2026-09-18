import React from 'react';
import {
  BookOpen,
  Sparkles,
  Layers,
  CheckCircle2,
  Languages,
  PenTool,
  Brain,
  SlidersHorizontal,
  Volume2,
  Mic,
  Search,
  Lightbulb,
  Bot,
  Upload,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

export type AppTab =
  | 'library'
  | 'reader'
  | 'chatbot'
  | 'live-voice'
  | 'adaptive'
  | 'research'
  | 'concept-summary'
  | 'quiz'
  | 'writing'
  | 'flashcards'
  | 'grammar';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  bilingualMode: boolean;
  setBilingualMode: (v: boolean) => void;
  onUploadBookClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  bilingualMode,
  setBilingualMode,
  onUploadBookClick,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top brand & status bar */}
        <div className="flex items-center justify-between h-16 border-b border-slate-100 sm:border-none">
          {/* Logo & Title */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('library')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 font-serif">Edu.ai</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 tracking-wide border border-emerald-200">
                  SMART STUDY SUITE
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Intelligent Book Reader & Multimodal AI Tutor</p>
            </div>
          </div>

          {/* Quick Learning Controls & User Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Upload Book Action Button */}
            {onUploadBookClick && (
              <button
                id="nav-btn-upload-book"
                onClick={onUploadBookClick}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors"
                title="Upload a new book, chapter, or text"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Book</span>
              </button>
            )}

            {/* Bilingual Translation Toggle */}
            <button
              id="btn-toggle-bilingual"
              onClick={() => setBilingualMode(!bilingualMode)}
              title={bilingualMode ? "Bilingual Mode Active: Hindi translations enabled" : "Switch to Bilingual Mode (Hindi meanings)"}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                bilingualMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">{bilingualMode ? 'Eng + हिन्दी' : 'English Only'}</span>
            </button>

            {/* User Account */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  title="Scholar Learning Profile"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'S'}
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="font-semibold text-slate-800 max-w-[110px] truncate">
                      {user.displayName || 'Scholar'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Level {user.cefrLevel || 'B1'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar text-xs sm:text-sm font-medium">
          <button
            id="nav-tab-library"
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'library'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>English Chapters</span>
          </button>

          <button
            id="nav-tab-reader"
            onClick={() => setActiveTab('reader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'reader'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Smart Reader</span>
          </button>

          <button
            id="nav-tab-chatbot"
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'chatbot'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Gemini Multi-Turn Chat</span>
          </button>

          <button
            id="nav-tab-live-voice"
            onClick={() => setActiveTab('live-voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'live-voice'
                ? 'bg-teal-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-4 h-4 text-teal-400" />
            <span>Live Voice Tutor</span>
          </button>

          <button
            id="nav-tab-adaptive"
            onClick={() => setActiveTab('adaptive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'adaptive'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Brain className="w-4 h-4 text-blue-400" />
            <span>Adaptive Modules</span>
          </button>

          <button
            id="nav-tab-research"
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'research'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Research & Citations</span>
          </button>

          <button
            id="nav-tab-concept-summary"
            onClick={() => setActiveTab('concept-summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'concept-summary'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Concept & Summary</span>
          </button>

          <button
            id="nav-tab-quiz"
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Quiz Arena</span>
          </button>

          <button
            id="nav-tab-writing"
            onClick={() => setActiveTab('writing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'writing'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Writing Lab</span>
          </button>

          <button
            id="nav-tab-flashcards"
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Flashcards</span>
          </button>

          <button
            id="nav-tab-grammar"
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'grammar'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Grammar</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

