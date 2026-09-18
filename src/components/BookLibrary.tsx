import React, { useState } from 'react';
import { BookChapter } from '../types';
import {
  BookOpen,
  Clock,
  Feather,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileQuestion,
  PenTool,
  Bookmark,
  Search,
  Mic,
  Brain,
  Bot,
  Lightbulb,
  Upload,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { AppTab } from './Navbar';

interface BookLibraryProps {
  books: BookChapter[];
  onSelectBook: (book: BookChapter, defaultSubTab?: 'story' | 'poems' | 'questions' | 'grammar') => void;
  onStartQuiz: (bookId: string) => void;
  onOpenWriting: (bookId: string) => void;
  onNavigateTab?: (tab: AppTab) => void;
  onUploadBookClick?: () => void;
  onDeleteBook?: (bookId: string) => void;
  onClearAllBooks?: () => void;
  onRestoreOfficialBooks?: () => void;
}

export const BookLibrary: React.FC<BookLibraryProps> = ({
  books,
  onSelectBook,
  onStartQuiz,
  onOpenWriting,
  onNavigateTab,
  onUploadBookClick,
  onDeleteBook,
  onClearAllBooks,
  onRestoreOfficialBooks,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.theme && book.theme.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.poems && book.poems.some((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase())));

    const isFirstFlight = book.id.startsWith('ch-');
    const isFootprints = book.id.startsWith('fp-');
    const isUploaded = !isFirstFlight && !isFootprints;

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'first_flight' && isFirstFlight) ||
      (selectedFilter === 'footprints' && isFootprints) ||
      (selectedFilter === 'poetry' && book.poems && book.poems.length > 0) ||
      (selectedFilter === 'uploaded' && isUploaded) ||
      (selectedFilter === 'b1' && book.difficulty === 'B1') ||
      (selectedFilter === 'b2' && book.difficulty === 'B2');

    return matchesSearch && matchesFilter;
  });

  const aiFeatures = [
    {
      id: 'chatbot',
      title: 'Gemini Multi-Turn Chat',
      desc: 'Socratic Tutor, Academic Researcher & Essay Grader with model routing',
      icon: Bot,
      tab: 'chatbot' as AppTab,
      badge: 'gemini-3.1-pro / 3.5-flash',
      color: 'from-emerald-600 to-teal-700',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'live-voice',
      title: 'Live Voice Tutor',
      desc: 'Spoken interactive conversations with ultra-low latency audio',
      icon: Mic,
      tab: 'live-voice' as AppTab,
      badge: 'gemini-3.1-flash-live',
      color: 'from-teal-600 to-cyan-700',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'adaptive',
      title: 'Adaptive Learning Modules',
      desc: 'Open-ended diagnostic questions that dynamically adapt difficulty',
      icon: Brain,
      tab: 'adaptive' as AppTab,
      badge: 'Cognitive Engine',
      color: 'from-blue-600 to-indigo-700',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'research',
      title: 'Research & Citations',
      desc: 'Scholarly synthesis across your uploaded books with quotes',
      icon: Search,
      tab: 'research' as AppTab,
      badge: 'Cross-Corpus Synthesis',
      color: 'from-indigo-600 to-slate-800',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'concept-summary',
      title: 'Feynman Simplifier & Notes',
      desc: 'Explain concepts like I am 5, build mental models, and generate revision sheets',
      icon: Lightbulb,
      tab: 'concept-summary' as AppTab,
      badge: 'Feynman Technique',
      color: 'from-amber-600 to-orange-700',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Banner / Value Proposition */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold tracking-wide text-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Edu.ai Intelligent Study Platform • Powered by Google Gemini AI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif leading-tight">
            Personalized Book & Curriculum Library
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-2xl">
            Upload your textbooks, literature chapters, essays, or study notes. Edu.ai automatically structures
            paragraphs, extracts vocabulary, generates comprehension questions, and powers live voice and Socratic tutoring.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium">
            <button
              id="btn-banner-upload-book"
              onClick={onUploadBookClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Book / Chapter</span>
            </button>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{books.length} {books.length === 1 ? 'Book' : 'Books'} in Library</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>AI Interactive Reader</span>
            </div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-16 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* AI Hub Feature Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">Multimodal AI Study Suite</h2>
            <p className="text-xs text-slate-500">
              State-of-the-art AI tools ready to assist your uploaded reading materials
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                id={`ai-hub-card-${feat.id}`}
                onClick={() => onNavigateTab && onNavigateTab(feat.tab)}
                className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${feat.badgeColor}`}
                    >
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{feat.desc}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter, Search, and Book Actions Controls */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Form Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Filter:
            </span>
            {[
              { id: 'all', label: `All Books (${books.length})` },
              {
                id: 'first_flight',
                label: `First Flight (${books.filter((b) => b.id.startsWith('ch-')).length})`,
              },
              {
                id: 'footprints',
                label: `Footprints without Feet (${books.filter((b) => b.id.startsWith('fp-')).length})`,
              },
              {
                id: 'poetry',
                label: `With Poetry (${books.filter((b) => b.poems && b.poems.length > 0).length})`,
              },
              {
                id: 'uploaded',
                label: `Uploaded (${books.filter((b) => !b.id.startsWith('ch-') && !b.id.startsWith('fp-')).length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedFilter === f.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-upload-book-top"
              onClick={onUploadBookClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Book</span>
            </button>

            {onRestoreOfficialBooks && (
              <button
                id="btn-restore-curriculum"
                onClick={onRestoreOfficialBooks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold bg-white transition-colors"
                title="Restore NCERT Class 10 textbooks"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Reset Curriculum</span>
              </button>
            )}

            {books.length > 0 && onClearAllBooks && (
              <button
                id="btn-clear-all-books"
                onClick={() => {
                  if (confirm('Are you sure you want to delete all books? You can restore the official curriculum anytime.')) {
                    onClearAllBooks();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 text-xs font-semibold bg-white transition-colors"
                title="Delete all books"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="input-search-books"
            type="text"
            placeholder="Search books by title, author, or theme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* When no books are in the library */}
      {books.length === 0 ? (
        <div
          id="empty-library-container"
          className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">
            Library is Empty
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Upload your own book or chapter (.txt, .md, .json) or load the complete NCERT Class 10 English literature textbooks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-empty-upload-book"
              onClick={onUploadBookClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 transition-all shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Book / Chapter</span>
            </button>
            {onRestoreOfficialBooks && (
              <button
                id="btn-empty-restore-curriculum"
                onClick={onRestoreOfficialBooks}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold hover:bg-emerald-100 transition-all shadow-xs"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Load NCERT Class 10 Books</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Book Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upload New Book Card */}
          <div
            id="card-upload-new-book"
            onClick={onUploadBookClick}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[280px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 flex items-center justify-center mb-3 transition-colors shadow-2xs">
              <Plus className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-800">
              Upload Another Book
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Import .txt, .md, or .json with Gemini analysis
            </p>
          </div>

          {filteredBooks.map((book) => {
            const isFirstFlight = book.id.startsWith('ch-');
            const isFootprints = book.id.startsWith('fp-');
            const badgeLabel = isFootprints
              ? `Footprints • Ch ${book.number > 9 ? book.number - 9 : book.number}`
              : isFirstFlight
              ? `First Flight • Unit ${book.number}`
              : `Uploaded • Unit ${book.number}`;

            return (
              <div
                key={book.id}
                id={`book-card-${book.id}`}
                className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200"
              >
                {/* Card Header & Visual Gradient Cover */}
                <div className={`p-6 bg-gradient-to-br ${book.coverGradient} text-white relative`}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-black/30 backdrop-blur-xs tracking-wider uppercase text-[11px]">
                      {badgeLabel} • {book.difficulty || 'B1'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                        <Clock className="w-3 h-3" />
                        {book.estimatedReadTime}
                      </span>
                      {onDeleteBook && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${book.title}" from library?`)) {
                              onDeleteBook(book.id);
                            }
                          }}
                          className="p-1 rounded bg-black/30 hover:bg-red-600 text-white/80 hover:text-white transition-colors"
                          title="Delete book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold font-serif leading-snug drop-shadow-xs mb-1">
                    {book.title}
                  </h2>
                  <p className="text-xs text-white/80 font-medium">By {book.author}</p>
                </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-1.5">
                    Theme: {book.theme}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {book.beforeYouRead}
                  </p>
                </div>

                {/* Poems associated with this unit */}
                {book.poems && book.poems.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Prescribed Poems:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {book.poems.map((poem) => (
                        <span
                          key={poem.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBook(book, 'poems');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-medium hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
                        >
                          <Feather className="w-3 h-3 text-emerald-600" />
                          {poem.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* SubParts for multi-story chapters */}
                {book.subParts && book.subParts.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Sections:
                    </span>
                    <ul className="text-xs text-slate-600 space-y-0.5">
                      {book.subParts.map((sp) => (
                        <li key={sp.id} className="truncate">
                          • {sp.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Actions Row */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <button
                    id={`btn-read-${book.id}`}
                    onClick={() => onSelectBook(book, 'story')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Interactive Reader</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      id={`btn-quiz-${book.id}`}
                      onClick={() => onStartQuiz(book.id)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      <FileQuestion className="w-3 h-3 text-emerald-600" />
                      <span>Take Quiz</span>
                    </button>
                    <button
                      id={`btn-write-${book.id}`}
                      onClick={() => onOpenWriting(book.id)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      <PenTool className="w-3 h-3 text-teal-600" />
                      <span>Writing Lab</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
