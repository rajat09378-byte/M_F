import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../context/SessionContext';
import { sendChatMessage } from '../lib/api';
import { MessageCircle, Send, Brain, User, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  'Explain this topic like I\'m 10 years old',
  'What are the most important concepts to remember?',
  'Give me a real-world example of the main concept',
  'What are common misconceptions about this topic?',
  'How does this relate to everyday life?',
  'What should I study next after this topic?',
];

export default function TutorChat() {
  const { sessionData } = useSession();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your personal AI tutor for **${sessionData?.subject || 'this topic'}**. 
      
I've analyzed your content and I'm ready to help you understand it deeply. Feel free to ask me anything — from basic definitions to complex applications!

Here are some things I can help you with:
- Explain concepts in simpler terms
- Provide real-world examples
- Answer your specific questions
- Create analogies to make things stick
- Help you prepare for exams`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const data = await sendChatMessage(sessionData.sessionId, msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm sorry, I encountered an error: ${err.message}. Please try again.`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative z-10 flex flex-col" style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
            AI Tutor
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Personalized tutor for {sessionData?.subject} · Powered by Gemini
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl">
          <div className="pulse-dot" />
          <span className="text-xs text-emerald-400 font-medium">Online</span>
        </div>
      </div>

      {/* Key concepts quick ref */}
      <div className="glass-card p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/40 font-medium">Key Concepts</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(sessionData?.concepts || []).slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => sendMessage(`Explain "${c.label}" in detail`)}
              className="concept-tag text-xs hover:scale-105 transition-transform cursor-pointer"
              style={{
                background: 'rgba(90,95,255,0.12)',
                borderColor: 'rgba(90,95,255,0.35)',
                color: '#a5b4fc',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 custom-scroll">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-forge-500 to-purple-600'
                  : 'bg-gradient-to-br from-emerald-500 to-cyan-600'
              }`}
            >
              {msg.role === 'assistant'
                ? <Brain className="w-4 h-4 text-white" />
                : <User className="w-4 h-4 text-white" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[78%] px-5 py-4 text-sm leading-relaxed ${
                msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
              } ${msg.error ? 'border-red-500/30 bg-red-500/10' : ''}`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 text-white/80">{children}</p>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      li: ({ children }) => <li className="text-white/75 mb-1">{children}</li>,
                      ul: ({ children }) => <ul className="list-disc ml-4 my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 my-2">{children}</ol>,
                      code: ({ children }) => (
                        <code className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-xs">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-white/90">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forge-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="chat-bubble-ai px-5 py-4 flex items-center gap-1.5">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-white/40">Suggested questions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="px-3 py-1.5 text-xs rounded-xl glass-card hover:border-forge-500/40 hover:bg-forge-600/10 transition-all text-white/60 hover:text-white/90 text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input */}
      <div className="glass-card p-3 flex gap-3 items-end">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI tutor anything about this topic…"
            className="w-full bg-transparent text-white/90 placeholder-white/30 text-sm resize-none focus:outline-none leading-relaxed"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            disabled={loading}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        <motion.button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            input.trim() && !loading
              ? 'bg-gradient-to-br from-forge-500 to-purple-600 text-white shadow-lg shadow-forge-600/30 hover:shadow-forge-600/50'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
          whileHover={input.trim() && !loading ? { scale: 1.1 } : {}}
          whileTap={input.trim() && !loading ? { scale: 0.9 } : {}}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>

      <p className="text-center text-xs text-white/20 mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
