import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Cpu,
  GraduationCap,
  Scale,
  Zap,
  Flame,
  Search,
  Maximize2,
  Minimize2,
  Eraser,
} from 'lucide-react';
import { BookChapter, ChatMessage } from '../types';

interface GeminiChatbotProps {
  books: BookChapter[];
  selectedChapter: BookChapter | null;
  onSelectChapter?: (chapter: BookChapter) => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  books,
  selectedChapter,
  onSelectChapter,
}) => {
  // Model state: gemini-3.8-flash (primary), gemini-3.1-flash-lite (fast), gemini-3.1-pro-preview (complex)
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  
  // Role state: socratic, researcher, exam_grader, feynman
  const [role, setRole] = useState<'socratic' | 'researcher' | 'exam_grader' | 'feynman'>('socratic');

  // Active chapter context
  const [activeChapterId, setActiveChapterId] = useState<string>(
    selectedChapter?.id || (books.length > 0 ? books[0].id : '')
  );

  const activeChapter = books.find((b) => b.id === activeChapterId) || selectedChapter || books[0];

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I am your AI Study Companion powered by Gemini. 
I am currently set to the **Socratic Tutor** role using **gemini-3.8-flash**, ready to help you analyze **${activeChapter ? activeChapter.title : 'the curriculum'}**.

How can I help you master this material today? Ask me to test your understanding, guide you through a difficult theme, or evaluate an exam-style answer!`,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.8-flash',
      roleUsed: 'socratic',
    },
  ]);

  const [input, setInput] = useState('');
  const [isExpandedInput, setIsExpandedInput] = useState(false);
  const [displaySize, setDisplaySize] = useState<'standard' | 'large'>('large');
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          model,
          role,
          bookContext: activeChapter ? `${activeChapter.title} (${activeChapter.theme || activeChapter.subtitle})` : 'Curriculum',
          currentTopic: activeChapter?.title || 'General Studies',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed || model,
        roleUsed: data.roleUsed || role,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error communicating with Gemini**: ${err.message || 'Unable to connect'}. Please verify that your \`GEMINI_API_KEY\` is configured or try selecting a different model.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. Ready for a new study session on **${activeChapter?.title}**!`,
        timestamp: Date.now(),
        modelUsed: model,
        roleUsed: role,
      },
    ]);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const roleConfigs = [
    {
      id: 'socratic',
      name: 'Socratic Tutor',
      icon: GraduationCap,
      desc: 'Guides through probing questions & critical logic',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'researcher',
      name: 'Academic Researcher',
      icon: Search,
      desc: 'Deep textual citations & multi-book synthesis',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      id: 'exam_grader',
      name: 'Exam Evaluator',
      icon: Scale,
      desc: 'Official CBSE & High-School marking schemes',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'feynman',
      name: 'Feynman Simplifier',
      icon: Sparkles,
      desc: 'Simple analogies & everyday mental models',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
  ] as const;

  const modelConfigs = [
    {
      id: 'gemini-3.8-flash',
      label: 'Flash 3.8',
      badge: 'Balanced & Smart',
      desc: 'gemini-3.8-flash: optimal speed and high intelligence for curriculum study',
      icon: Sparkles,
      color: 'text-emerald-600',
    },
    {
      id: 'gemini-3.1-flash-lite',
      label: 'Flash Lite',
      badge: 'Ultra Fast',
      desc: 'gemini-3.1-flash-lite: lightning quick vocabulary & rapid answers',
      icon: Zap,
      color: 'text-amber-600',
    },
    {
      id: 'gemini-3.1-pro-preview',
      label: 'Pro Preview',
      badge: 'Deep Reasoning',
      desc: 'gemini-3.1-pro-preview: deep analytical reasoning (requires pro tier quota)',
      icon: Cpu,
      color: 'text-indigo-600',
    },
  ] as const;

  const starterQuestions = [
    `Why is Lencho's reaction at the post office considered tragic irony?`,
    `How does Nelson Mandela explain that the oppressor is as much a prisoner as the oppressed?`,
    `Explain the biochemical difference between aerobic and anaerobic respiration.`,
    `What are the laws of refraction and Snell's equation?`,
  ];

  return (
    <div
      id="gemini-chatbot-container"
      className={`w-full max-w-7xl mx-auto flex flex-col transition-all duration-200 ${
        isFullHeight
          ? 'fixed inset-0 z-50 bg-slate-100 p-3 sm:p-6 overflow-hidden'
          : 'w-full max-w-7xl mx-auto flex flex-col h-auto lg:h-[calc(100vh-6.5rem)] min-h-[920px] lg:min-h-[1020px]'
      }`}
    >
      {/* Top Configuration Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Chapter Selector */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Book Context:</span>
            <select
              id="chatbot-chapter-selector"
              value={activeChapterId}
              onChange={(e) => {
                setActiveChapterId(e.target.value);
                const chap = books.find((b) => b.id === e.target.value);
                if (chap && onSelectChapter) onSelectChapter(chap);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.subject || 'Literature'})
                </option>
              ))}
            </select>
          </div>

          {/* Model Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {modelConfigs.map((m) => {
              const Icon = m.icon;
              const isSelected = model === m.id;
              return (
                <button
                  key={m.id}
                  id={`model-btn-${m.id}`}
                  onClick={() => setModel(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                  title={m.desc}
                >
                  <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                  <span>{m.label}</span>
                  <span
                    className={`hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded font-normal ${
                      isSelected ? 'bg-slate-100 text-slate-700' : 'text-slate-500'
                    }`}
                  >
                    {m.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clear Chat */}
          <button
            id="clear-chat-btn"
            onClick={clearChat}
            className="self-end lg:self-center inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            title="Reset conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset History</span>
          </button>
        </div>

        {/* System Instruction / Persona Role Buttons */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Tutor Role:</span>
          {roleConfigs.map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                id={`role-btn-${r.id}`}
                onClick={() => setRole(r.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? `${r.badgeColor} ring-1 ring-offset-1`
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                title={r.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle Box: Substantially Enlarged Messages Display Thread */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[580px] lg:min-h-[680px]">
        {/* Middle Box Top Status & Size Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" />
              Chat Display
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">
              {messages.length} message{messages.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Display Size Toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setDisplaySize('standard')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  displaySize === 'standard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Standard message text size"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setDisplaySize('large')}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  displaySize === 'large'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Enlarged reading display"
              >
                Large Display
              </button>
            </div>

            {/* Expand / Fullscreen Height Toggle */}
            <button
              type="button"
              id="chatbot-display-fullscreen-btn"
              onClick={() => setIsFullHeight(!isFullHeight)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title={isFullHeight ? 'Exit full screen display' : 'Expand middle chat display to full screen'}
            >
              {isFullHeight ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Height</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div
          id="chatbot-messages-thread"
          className={`flex-1 overflow-y-auto p-4 sm:p-7 lg:p-9 ${
            displaySize === 'large' ? 'space-y-8' : 'space-y-6'
          }`}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`relative w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl p-5 sm:p-7 rounded-2xl sm:rounded-3xl leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm shadow-sm'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-sm shadow-2xs'
                }`}
              >
                {/* Message Header for Assistant */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200/70 text-xs text-slate-500">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="capitalize font-semibold text-slate-700">
                        {msg.roleUsed || role}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                        {msg.modelUsed || model}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className="hover:text-slate-900 transition-colors p-1 rounded-md hover:bg-slate-200/50"
                      title="Copy to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                )}

                {/* Message Content with Markdown formatting */}
                <div
                  className={`space-y-3 whitespace-pre-wrap font-sans ${
                    displaySize === 'large'
                      ? 'text-base sm:text-[17px] leading-relaxed sm:leading-loose'
                      : 'text-sm sm:text-base leading-relaxed'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Timestamp */}
                <div
                  className={`text-xs mt-3 text-right ${
                    msg.role === 'user' ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Bubble */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 justify-start items-center">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-200 text-slate-600 text-sm sm:text-base flex items-center gap-3 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
                <span
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="ml-1 font-medium">
                  {role === 'socratic'
                    ? 'Formulating Socratic guidance...'
                    : role === 'researcher'
                    ? 'Consulting textual evidence...'
                    : role === 'exam_grader'
                    ? 'Evaluating mark rubrics...'
                    : 'Simplifying concept...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Starters */}
      {messages.length <= 2 && (
        <div className="my-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {starterQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap shadow-2xs hover:shadow-xs transition-all shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Bar - Substantially Enlarged Chat Box */}
      <div className="mt-3 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm transition-all">
        {/* Chat Box Top Controls */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700">Chat Input Box</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Multi-line • Drag bottom right corner to resize height)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {input.length > 0 && (
              <button
                type="button"
                id="chatbot-clear-input-btn"
                onClick={() => setInput('')}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                title="Clear input text"
              >
                <Eraser className="w-3 h-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              type="button"
              id="chatbot-toggle-expand-btn"
              onClick={() => setIsExpandedInput(!isExpandedInput)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
              title={isExpandedInput ? 'Compact chat box' : 'Enlarge chat box for long questions or essays'}
            >
              {isExpandedInput ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span>Compact Box</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3" />
                  <span>Enlarge Box</span>
                </>
              )}
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              id="chatbot-input-textarea"
              rows={isExpandedInput ? 7 : 3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Ask ${
                role === 'socratic'
                  ? 'a probing study question, paste an excerpt, or ask for guidance...'
                  : role === 'researcher'
                  ? 'for textual quotes, historical context, or research analysis...'
                  : role === 'exam_grader'
                  ? 'to evaluate your sample exam answer (paste your full answer here)...'
                  : 'to explain a difficult concept simply with analogies...'
              }`}
              className={`w-full resize-y bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-3.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all leading-relaxed ${
                isExpandedInput ? 'min-h-[190px] max-h-96' : 'min-h-[92px] max-h-72'
              }`}
            />
          </div>

          <div className="flex sm:flex-col items-center justify-between sm:justify-end gap-2 shrink-0">
            <button
              id="chatbot-send-btn"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:hover:bg-emerald-600 active:scale-95 shadow-md shadow-emerald-200 shrink-0"
              title="Send message (Enter)"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-2 px-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
            {input.length > 0 && (
              <span className="font-mono text-slate-500">
                {input.length} characters • {input.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>
          <span className="font-mono text-slate-500">
            Active: {model} • Role: {role}
          </span>
        </div>
      </div>
    </div>
  );
};
