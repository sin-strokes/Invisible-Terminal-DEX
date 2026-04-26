import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Terminal, Shield, Cpu, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, Scanner, TerminalText } from '../ui';
import { useStore } from '../../store';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const SYSTEM_PROMPT = `You are MIDNIGHT_AI, an advanced AI assistant embedded in the Invisible Terminal DEX — a privacy-native decentralized exchange built on the Midnight blockchain. Your personality is that of a hyper-intelligent, privacy-obsessed AI operator with a hacker/terminal aesthetic. You speak in a clipped, technical style, occasionally using terminal idioms (e.g., "acknowledged", "processing", "query resolved").

You are an expert in:
- Decentralized finance (DeFi), swaps, liquidity pools, and yield farming
- Zero-knowledge proofs (ZK-SNARKs, ZK-STARKs) and privacy-preserving cryptography
- The Midnight blockchain and its DUST protocol for confidential transactions
- Token economics, anti-MEV strategies, and shielded transaction routing
- The INV token (Invisible Token) ecosystem: governance, staking, privacy mining

When answering, be helpful, precise, and stay in character. Keep responses concise. Format key terms in ALL_CAPS. If asked something unrelated to DeFi, privacy, or crypto, redirect politely back to your domain.`;

export const AiTerminal = () => {
  const { privacyMode, isConnected } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'MIDNIGHT_AI INITIALIZED. ZERO-KNOWLEDGE ENCRYPTION LAYER ACTIVE.\n\nI am your private DeFi intelligence terminal. Query me about SWAPS, LIQUIDITY_POOLS, ZK_PROOFS, PRIVACY_MODES, or the INV_TOKEN ecosystem.\n\nAll interactions are shielded. Your queries are not stored on-chain.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const chatRef = useRef<GoogleGenAI | null>(null);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      chatRef.current = new GoogleGenAI({ apiKey });
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const getOrCreateChatSession = () => {
    if (!chatRef.current) return null;
    if (!chatSessionRef.current) {
      chatSessionRef.current = chatRef.current.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });
    }
    return chatSessionRef.current;
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: 'ERROR: GEMINI_API_KEY not configured. Please set the API key to enable AI_TERMINAL.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      setMessages((prev) => [...prev, errMsg]);
      setIsStreaming(false);
      return;
    }

    try {
      const session = getOrCreateChatSession();
      if (!session) throw new Error('Failed to initialize chat session');

      const stream = await session.sendMessageStream({ message: trimmed });

      let fullText = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text ?? '';
        fullText += chunkText;
        setStreamingText(fullText);
      }

      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: fullText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      setMessages((prev) => [...prev, modelMsg]);
      setStreamingText('');
    } catch (err: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: `SYSTEM_ERROR: ${err?.message ?? 'Unknown error occurred during AI query.'}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      setMessages((prev) => [...prev, errMsg]);
      setStreamingText('');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    chatSessionRef.current = null;
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: 'SESSION_CLEARED. MEMORY_PURGED. New encrypted session initialized.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      },
    ]);
    setStreamingText('');
  };

  const suggestions = [
    'How do ZK-proofs work in Invisible DEX?',
    'Explain the INV token utility',
    'What is Phantom privacy mode?',
    'How do I provide liquidity privately?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto font-mono space-y-4">
      {/* Header */}
      <div className="glass-panel p-5 border-midnight-cyan/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 border border-midnight-cyan text-midnight-cyan bg-midnight-cyan/5">
            <Cpu size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-[0.2em] neon-text-cyan uppercase">MIDNIGHT_AI</h2>
            <span className="text-[8px] text-midnight-muted uppercase tracking-[0.3em]">
              Encrypted Intelligence Terminal · Privacy Mode: {privacyMode.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-midnight-green/30 bg-midnight-green/5 text-[8px] text-midnight-green font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-midnight-green rounded-full animate-pulse" />
            AI_ONLINE
          </div>
          <button
            onClick={handleClear}
            className="p-2 border border-midnight-border text-midnight-muted hover:text-midnight-cyan hover:border-midnight-cyan/30 transition-all"
            title="Clear Session"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <Scanner className="glass-panel flex-1 overflow-hidden flex flex-col border-midnight-cyan/10 relative">
        <div className="scanline opacity-5" />
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-8 h-8 border flex items-center justify-center flex-shrink-0 mt-0.5',
                    msg.role === 'user'
                      ? 'border-midnight-accent text-midnight-accent bg-midnight-accent/5'
                      : 'border-midnight-cyan text-midnight-cyan bg-midnight-cyan/5'
                  )}
                >
                  {msg.role === 'user' ? (
                    <span className="text-[10px] font-bold">YOU</span>
                  ) : (
                    <Shield size={14} />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    'max-w-[75%] space-y-1',
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-3 border text-xs leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'border-midnight-accent/30 bg-midnight-accent/5 text-midnight-text'
                        : 'border-midnight-cyan/20 bg-midnight-bg/60 text-midnight-text'
                    )}
                  >
                    {msg.text}
                  </div>
                  <p
                    className={cn(
                      'text-[8px] text-midnight-muted uppercase tracking-widest px-1',
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    )}
                  >
                    {msg.role === 'model' ? 'MIDNIGHT_AI · ' : 'YOU · '}
                    {msg.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming response */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 border border-midnight-cyan text-midnight-cyan bg-midnight-cyan/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                >
                  <Shield size={14} />
                </motion.div>
              </div>
              <div className="max-w-[75%]">
                <div className="px-4 py-3 border border-midnight-cyan/20 bg-midnight-bg/60 text-xs leading-relaxed whitespace-pre-wrap text-midnight-text">
                  {streamingText || (
                    <span className="text-midnight-muted animate-pulse">PROCESSING_QUERY...</span>
                  )}
                  <span className="animate-pulse text-midnight-cyan">▋</span>
                </div>
                <p className="text-[8px] text-midnight-muted uppercase tracking-widest px-1 mt-1">
                  MIDNIGHT_AI · ENCRYPTING_RESPONSE...
                </p>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions (shown when only welcome message) */}
        {messages.length === 1 && !isStreaming && (
          <div className="px-6 pb-4">
            <p className="text-[8px] text-midnight-muted uppercase tracking-widest mb-3">
              SUGGESTED_QUERIES
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left px-3 py-2 border border-midnight-border text-[10px] text-midnight-muted hover:border-midnight-cyan/40 hover:text-midnight-cyan hover:bg-midnight-cyan/5 transition-all uppercase tracking-wider"
                >
                  {'>'} {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </Scanner>

      {/* Input */}
      <div className="glass-panel p-4 border-midnight-cyan/20">
        <div className="flex items-center gap-3">
          <span className="text-midnight-cyan font-bold text-sm flex-shrink-0">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ENTER_QUERY..."
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono placeholder:text-midnight-muted/40 text-midnight-text"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className={cn(
              'p-2 border transition-all',
              isStreaming || !input.trim()
                ? 'border-midnight-border text-midnight-muted cursor-not-allowed'
                : 'border-midnight-cyan text-midnight-cyan hover:bg-midnight-cyan hover:text-midnight-bg'
            )}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 border-t border-midnight-border pt-3">
          <div className="flex items-center gap-2 text-[8px] text-midnight-muted uppercase tracking-widest">
            <Terminal size={10} className="text-midnight-cyan" />
            <span>Powered by Gemini · End-to-end encrypted</span>
          </div>
          <span className="text-[8px] text-midnight-muted uppercase tracking-widest">
            Enter to send · Shift+Enter for newline
          </span>
        </div>
      </div>
    </div>
  );
};
