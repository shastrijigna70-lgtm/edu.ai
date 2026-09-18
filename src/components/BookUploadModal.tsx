import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Loader2,
  Trash2,
  FileUp,
  Edit3,
  Lightbulb,
} from 'lucide-react';
import { BookChapter, CEFRLevel } from '../types';
import { COVER_GRADIENTS, createDefaultBookChapter } from '../data/booksData';

interface BookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookUploaded: (book: BookChapter) => void;
}

export const BookUploadModal: React.FC<BookUploadModalProps> = ({
  isOpen,
  onClose,
  onBookUploaded,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'manual'>('file');

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Manual / metadata state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [manualText, setManualText] = useState('');
  const [difficulty, setDifficulty] = useState<CEFRLevel>('B1');
  const [useAIAnalysis, setUseAIAnalysis] = useState(true);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Auto-fill title from filename
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (!title) {
      setTitle(cleanName);
    }

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setFileContent(content);
          const parsed = JSON.parse(content);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.author) setAuthor(parsed.author);
        } catch {
          setErrorMessage('Invalid JSON format. Please upload valid text or chapter JSON.');
        }
      };
      reader.readAsText(file);
    } else {
      // .txt, .md, and text documents
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        setFileContent(text);
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read file. Please try another file or paste the text directly.');
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = (type: 'gift' | 'frost') => {
    setErrorMessage(null);
    if (type === 'gift') {
      setTitle('The Gift of the Magi');
      setAuthor('O. Henry');
      setDifficulty('B1');
      setManualText(
        `ONE dollar and eighty-seven cents. That was all. And sixty cents of it was in pennies. Pennies saved one and two at a time by bulldozing the grocer and the vegetable man and the butcher until one's cheeks burned with the silent imputation of parsimony that such close dealing implied. Three times Della counted it. One dollar and eighty-seven cents. And the next day would be Christmas.\n\nThere was clearly nothing to do but flop down on the shabby little couch and howl. So Della did it. Which instigates the moral reflection that life is made up of sobs, sniffles, and smiles, with sniffles predominating.\n\nWhile the mistress of the home is gradually subsiding from the first stage to the second, take a look at the home. A furnished flat at $8 per week. It did not exactly beggar description, but it certainly had that word on the lookout for the mendicancy squad.\n\nNow, there were two possessions of the James Dillingham Youngs in which they both took a mighty pride. One was Jim's gold watch that had been his father's and his grandfather's. The other was Della's hair. Had the queen of Sheba lived in the flat across the airshaft, Della would have let her hair hang out the window some day to dry just to depreciate Her Majesty's jewels and gifts.`
      );
      setActiveTab('manual');
    } else {
      setTitle('Stopping by Woods on a Snowy Evening');
      setAuthor('Robert Frost');
      setDifficulty('B1');
      setManualText(
        `Whose woods these are I think I know.\nHis house is in the village though;\nHe will not see me stopping here\nTo watch his woods fill up with snow.\n\nMy little horse must think it queer\nTo stop without a farmhouse near\nBetween the woods and frozen lake\nThe darkest evening of the year.\n\nHe gives his harness bells a shake\nTo ask if there is some mistake.\nThe only other sound’s the sweep\nOf easy wind and downy flake.\n\nThe woods are lovely, dark and deep,\nBut I have promises to keep,\nAnd miles to go before I sleep,\nAnd miles to go before I sleep.`
      );
      setActiveTab('manual');
    }
  };

  const handleSubmit = async () => {
    const rawText = activeTab === 'file' ? fileContent : manualText;

    if (!rawText || !rawText.trim()) {
      setErrorMessage('Please select a file with text or enter book content.');
      return;
    }

    const finalTitle = title.trim() || (selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'Uploaded Book');
    const finalAuthor = author.trim() || 'Unknown Author';

    setIsProcessing(true);
    setErrorMessage(null);

    // If file is JSON and already matches BookChapter structure
    if (selectedFile?.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
          const completeBook: BookChapter = {
            id: parsed.id || `book-${Date.now()}`,
            number: parsed.number || 1,
            title: parsed.title || finalTitle,
            author: parsed.author || finalAuthor,
            subtitle: parsed.subtitle || 'Uploaded Literature Chapter',
            coverGradient: parsed.coverGradient || COVER_GRADIENTS[0],
            estimatedReadTime: parsed.estimatedReadTime || '5 min read',
            difficulty: parsed.difficulty || difficulty,
            theme: parsed.theme || 'Literature & Reading Study',
            beforeYouRead: parsed.beforeYouRead || 'Study and reflect on this uploaded text.',
            paragraphs: parsed.paragraphs,
            poems: parsed.poems || [],
            glossary: parsed.glossary || [],
            questions: parsed.questions || [],
            grammarExercises: parsed.grammarExercises || [],
            writingPrompts: parsed.writingPrompts || [],
          };
          onBookUploaded(completeBook);
          onClose();
          return;
        }
      } catch {
        // Fall through to standard text parsing
      }
    }

    // AI Analysis via server endpoint
    if (useAIAnalysis) {
      try {
        const response = await fetch('/api/books/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText,
            title: finalTitle,
            author: finalAuthor,
            fileName: selectedFile?.name || '',
          }),
        });

        if (response.ok) {
          const parsed = await response.json();
          const newBook: BookChapter = {
            id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            number: 1,
            title: parsed.title || finalTitle,
            author: parsed.author || finalAuthor,
            subtitle: parsed.subtitle || 'Uploaded Study Material',
            coverGradient: COVER_GRADIENTS[Math.floor(Math.random() * COVER_GRADIENTS.length)],
            estimatedReadTime: parsed.estimatedReadTime || `${Math.max(1, Math.ceil(rawText.split(/\s+/).length / 180))} min read`,
            difficulty: parsed.difficulty || difficulty,
            theme: parsed.theme || 'Literature & Comprehension',
            beforeYouRead: parsed.beforeYouRead || `An engaging chapter exploring key ideas and analytical insights.`,
            paragraphs: parsed.paragraphs && parsed.paragraphs.length > 0
              ? parsed.paragraphs
              : rawText.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0),
            poems: parsed.poems || [],
            glossary: parsed.glossary || [],
            questions: parsed.questions || [],
            grammarExercises: parsed.grammarExercises || [],
            writingPrompts: parsed.writingPrompts || [
              {
                id: `wp-${Date.now()}`,
                title: `Reflection on ${finalTitle}`,
                prompt: `Analyze the main ideas and language used in "${finalTitle}".`,
                type: 'essay',
                wordCount: '150 words',
              },
            ],
          };

          onBookUploaded(newBook);
          onClose();
          return;
        }
      } catch (err) {
        console.warn('Server parse failed, using client-side generator:', err);
      }
    }

    // Client-side instant generator
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const fallbackBook = createDefaultBookChapter({
      title: finalTitle,
      author: finalAuthor,
      paragraphs: paragraphs.length > 0 ? paragraphs : [rawText],
      difficulty,
    });

    onBookUploaded(fallbackBook);
    onClose();
  };

  return (
    <div
      id="book-upload-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="book-upload-modal"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Book or Chapter</h2>
              <p className="text-xs text-slate-500">
                Add reading materials to study with Edu.ai reader and AI tutors
              </p>
            </div>
          </div>
          <button
            id="btn-close-upload-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            id="tab-upload-file"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'file'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>Upload File (.txt, .md, .json)</span>
          </button>
          <button
            id="tab-paste-text"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Paste Text / Manual Entry</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick sample buttons */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Want to test quickly with sample literature?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-sample-gift-magi"
                onClick={() => handleLoadSample('gift')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
              >
                The Gift of the Magi
              </button>
              <button
                id="btn-sample-frost"
                onClick={() => handleLoadSample('frost')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
              >
                Frost Poem
              </button>
            </div>
          </div>

          {/* Tab 1: File Dropzone */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                id="upload-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="book-file-input"
                  type="file"
                  accept=".txt,.md,.json,.doc,.docx,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  Drag and drop your book file here, or{' '}
                  <span className="text-emerald-600 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500">
                  Supports plain text (.txt), Markdown (.md), or structured chapter (.json)
                </p>
              </div>

              {/* Selected File Card */}
              {selectedFile && (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                        {fileContent ? `${fileContent.split(/\s+/).length} words extracted` : 'Reading content...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFileContent('');
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Manual Input */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chapter or Book Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="input-manual-book-content"
                  rows={8}
                  placeholder="Paste the full text, story, or chapter paragraphs here..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full p-3 text-xs leading-relaxed bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-sans"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Separate paragraphs with an empty line.</span>
                  <span>
                    {manualText.trim() ? manualText.trim().split(/\s+/).filter(Boolean).length : 0} words
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Book Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Book / Chapter Title
              </label>
              <input
                id="input-book-title"
                type="text"
                placeholder="e.g., A Letter to God, Macbeth Act 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author / Source
              </label>
              <input
                id="input-book-author"
                type="text"
                placeholder="e.g., O. Henry, William Shakespeare"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* AI Enhancement Toggle */}
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
            <input
              id="checkbox-ai-enrichment"
              type="checkbox"
              checked={useAIAnalysis}
              onChange={(e) => setUseAIAnalysis(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <label
                htmlFor="checkbox-ai-enrichment"
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Analyze with Gemini AI</span>
              </label>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Extracts key vocabulary with meanings, formats clean paragraphs, and generates exam-style comprehension questions automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            id="btn-cancel-upload"
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-upload"
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || (activeTab === 'file' ? !fileContent.trim() : !manualText.trim())}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing with Gemini...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Add Book to Library</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
