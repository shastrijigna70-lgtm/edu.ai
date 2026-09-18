import React, { useState, useRef, useEffect } from 'react';
import { BookChapter, CEFRLevel } from '../types';
import {
  Brain,
  Send,
  Sparkles,
  BookOpen,
  User,
  Bot,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

interface SocraticChatProps {
  currentBook: BookChapter;
  cefrLevel: CEFRLevel;
  bilingualMode: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export const SocraticChat: React.FC<SocraticChatProps> = ({
  currentBook,
  cefrLevel,
  bilingualMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello! I am **FlightBot**, your AI English Literature & Language Coach.\n\nI'm ready to discuss **"${currentBook.title}"** or any other Class 10 English topic with you. You can ask me to:\n- Explain complex themes, symbols, or irony\n- Help you draft high-scoring board exam answers\n- Demystify grammar rules (relative clauses, phrasal verbs, collocations)\n- Test your understanding with Socratic questions\n\nWhat would you like to explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    `Explain the irony in "${currentBook.title}"`,
    `What are the most important board exam questions for this chapter?`,
    `Break down the main characters and their traits`,
    `Explain the prescribed poems and their literary devices`,
    `Give me a vocabulary quiz for this chapter`,
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          currentBook: currentBook.title,
          currentChapter: `Chapter ${currentBook.number}`,
          cefrLevel,
          bilingualMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI tutor');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.reply || 'I am happy to assist! Please ask any other question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'model',
          content: 'I had a little trouble connecting to the AI tutor service. Please ensure your internet connection is active or try again!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[740px] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">FlightBot • AI Socratic Coach</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Active Tutor
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Context: <span className="font-semibold text-slate-700">{currentBook.title}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'welcome-reset',
                role: 'model',
                content: `Chat cleared! Ready to delve into **"${currentBook.title}"** or any questions you have.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          title="Clear Conversation"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="px-4 sm:px-6 py-2 bg-indigo-50/40 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          Prompts:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-600 hover:text-white transition-colors whitespace-nowrap shadow-2xs font-medium shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none space-y-2'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>
                <div
                  className={`text-[10px] mt-1.5 ${
                    isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>FlightBot is formulating a comprehensive answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-chat-message"
            type="text"
            placeholder={`Ask FlightBot anything about "${currentBook.title}" or English language...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
          <button
            id="btn-send-chat-message"
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-xs flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
