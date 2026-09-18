import React, { useState } from 'react';
import { Flashcard, BookChapter } from '../types';
import {
  Sparkles,
  Volume2,
  RotateCw,
  Check,
  X,
  Plus,
  Loader2,
  Bookmark,
  Award,
  BookOpen
} from 'lucide-react';

interface FlashcardDeckProps {
  cards: Flashcard[];
  books: BookChapter[];
  onToggleMastered: (id: string) => void;
  onAddNewCards: (newCards: Flashcard[]) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  cards,
  books,
  onToggleMastered,
  onAddNewCards,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetChapter, setTargetChapter] = useState(books[0]?.title || 'Uploaded Literature');

  const filteredCards = cards.filter((c) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'learning') return !c.mastered;
    if (selectedFilter === 'mastered') return c.mastered;
    return c.chapterTitle === selectedFilter;
  });

  const activeCard = filteredCards[currentCardIndex] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % (filteredCards.length || 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % (filteredCards.length || 1));
  };

  const handleSpeak = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMarkMastered = (id: string) => {
    onToggleMastered(id);
    handleNext();
  };

  const handleGenerateAIFlashcards = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: targetChapter,
          count: 5,
        }),
      });

      if (!response.ok) throw new Error('Flashcard generation failed');
      const data = await response.json();

      if (data.flashcards && data.flashcards.length > 0) {
        const newFormatted: Flashcard[] = data.flashcards.map((f: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          word: f.word,
          pronunciation: f.pronunciation || '',
          partOfSpeech: f.partOfSpeech || 'word',
          definition: f.definition,
          example: f.example,
          mnemonic: f.mnemonic,
          chapterTitle: targetChapter,
          mastered: false,
        }));

        onAddNewCards(newFormatted);
        setIsFlipped(false);
        alert(`Added ${newFormatted.length} new AI flashcards for ${targetChapter}!`);
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate flashcards. Please try again!');
    } finally {
      setIsGenerating(false);
    }
  };

  const masteredCount = cards.filter((c) => c.mastered).length;
  const progressPercent = Math.round((masteredCount / (cards.length || 1)) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Stats */}
      <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
            Vocabulary Mastery
          </span>
          <h2 className="text-xl font-bold font-serif text-slate-900">Spaced Repetition Flashcards</h2>
          <p className="text-xs text-slate-500">
            {masteredCount} of {cards.length} words mastered ({progressPercent}%)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Generator Controls */}
          <select
            value={targetChapter}
            onChange={(e) => setTargetChapter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer"
          >
            {books.length === 0 ? (
              <option value="Uploaded Literature">No books uploaded</option>
            ) : (
              books.map((b) => (
                <option key={b.id} value={b.title}>
                  {b.title}
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleGenerateAIFlashcards}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>Generate AI Cards</span>
          </button>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Overall Retention Progress</span>
          <span className="text-indigo-600">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => {
            setSelectedFilter('all');
            setCurrentCardIndex(0);
          }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Cards ({cards.length})
        </button>
        <button
          onClick={() => {
            setSelectedFilter('learning');
            setCurrentCardIndex(0);
          }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedFilter === 'learning'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Still Learning ({cards.filter((c) => !c.mastered).length})
        </button>
        <button
          onClick={() => {
            setSelectedFilter('mastered');
            setCurrentCardIndex(0);
          }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedFilter === 'mastered'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Mastered ({masteredCount})
        </button>
      </div>

      {/* Flashcard Component */}
      {filteredCards.length > 0 && activeCard ? (
        <div className="space-y-4">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-80 sm:h-96 w-full cursor-pointer perspective-1000 select-none group"
          >
            <div
              className={`w-full h-full rounded-2xl border transition-all duration-500 transform-style-preserve-3d shadow-sm flex flex-col justify-between p-6 sm:p-8 ${
                isFlipped
                  ? 'bg-slate-900 text-white border-slate-800'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    isFlipped
                      ? 'bg-white/10 text-indigo-300'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {activeCard.chapterTitle || 'Class 10 Vocabulary'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(activeCard.word);
                    }}
                    title="Pronounce Word"
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isFlipped
                        ? 'border-white/20 text-white hover:bg-white/10'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <span
                    className={`text-[11px] font-medium ${
                      isFlipped ? 'text-white/60' : 'text-slate-400'
                    }`}
                  >
                    {currentCardIndex + 1} / {filteredCards.length}
                  </span>
                </div>
              </div>

              {/* Card Center */}
              <div className="text-center space-y-3 py-6">
                {!isFlipped ? (
                  <>
                    <h3 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight text-indigo-600">
                      {activeCard.word}
                    </h3>
                    {activeCard.pronunciation && (
                      <p className="text-xs text-slate-400 font-mono">
                        {activeCard.pronunciation}
                      </p>
                    )}
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                      {activeCard.partOfSpeech}
                    </span>
                    <p className="text-xs text-slate-400 pt-2 flex items-center justify-center gap-1">
                      <RotateCw className="w-3 h-3" />
                      <span>Click anywhere to flip for definition & mnemonic</span>
                    </p>
                  </>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block mb-1">
                        Definition
                      </span>
                      <p className="text-base sm:text-lg font-medium leading-snug">
                        {activeCard.definition}
                      </p>
                    </div>

                    {activeCard.example && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs italic text-indigo-200">
                        "{activeCard.example}"
                      </div>
                    )}

                    {activeCard.mnemonic && (
                      <div className="text-xs text-amber-300">
                        <strong>Memory Trick:</strong> {activeCard.mnemonic}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-inherit">
                <span className={isFlipped ? 'text-white/60' : 'text-slate-400'}>
                  {activeCard.mastered ? 'Status: Mastered ✅' : 'Status: Still Learning 📖'}
                </span>
                <span className="text-[11px] font-medium opacity-60 flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  <span>Tap to Flip</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action / Review Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNext()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <span>Still Learning</span>
              </button>

              <button
                onClick={() => handleMarkMastered(activeCard.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors ${
                  activeCard.mastered
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeCard.mastered ? 'Mastered!' : 'I Know This'}</span>
              </button>
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <p className="text-sm text-slate-500">No flashcards found for this filter.</p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Show All Cards
          </button>
        </div>
      )}
    </div>
  );
};
