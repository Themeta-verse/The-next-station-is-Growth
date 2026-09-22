import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { streamChat, type Msg } from '@/lib/ai';
import {
  MessageCircle,
  X,
  Send,
  RotateCcw,
  Trash2,
  Minimize2,
  Maximize2,
  Bot,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

// ─── Quick Prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: '📦 What is DSA?', text: 'What is Data Structures and Algorithms? Give me a beginner-friendly overview.' },
  { label: '🎤 Mock Interview', text: 'Start a mock interview for a software developer role. Ask me the first question.' },
  { label: '🏦 DBMS Concepts', text: 'Explain DBMS concepts important for placements with examples.' },
  { label: '💼 HR Questions', text: 'What are the top 10 HR interview questions and how should I answer them?' },
  { label: '🧠 System Design', text: 'What is system design? Explain with a simple example like designing a URL shortener.' },
  { label: '📈 Salary Negotiation', text: 'How do I negotiate salary in a placement interview?' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

const STORAGE_KEY = 'station_chat_history';

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: ChatMessage[]) {
  try {
    // Keep last 50 messages
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
  } catch { /* quota exceeded — skip */ }
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-end gap-1 h-5 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-current opacity-60"
          style={{ animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({
  msg,
  onRetry,
}: {
  msg: ChatMessage;
  onRetry?: () => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <div
      className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ animation: 'chatFadeUp 0.25s ease-out both' }}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
          <Bot className="w-3.5 h-3.5" />
        </div>
      )}

      <div
        className={[
          'max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-accent text-accent-foreground rounded-br-sm'
            : 'bg-card/80 backdrop-blur border border-border/60 text-foreground rounded-bl-sm',
          msg.error ? 'border-destructive/50 bg-destructive/5' : '',
        ].join(' ')}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_p]:my-1 [&_pre]:bg-muted/60 [&_pre]:rounded-lg [&_pre]:p-2 [&_code]:text-accent [&_code]:bg-accent/10 [&_code]:px-1 [&_code]:rounded">
            <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
          </div>
        )}
        {msg.error && (
          <button
            onClick={onRetry}
            className="mt-2 flex items-center gap-1 text-xs text-destructive hover:underline"
          >
            <RotateCcw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main ChatBot Component ───────────────────────────────────────────────────

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pulse, setPulse] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef(false);
  const lastUserMsgRef = useRef('');

  // Stop pulse after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Detect scroll position
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(dist > 120);
  };

  // Focus textarea when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open]);

  // Handle open — mark new messages seen
  useEffect(() => {
    if (open) setHasNewMsg(false);
  }, [open]);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // ─── Send message ───────────────────────────────────────────────────────────

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || streaming) return;

      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      lastUserMsgRef.current = content;
      abortRef.current = false;

      const userMsg: ChatMessage = { id: uid(), role: 'user', content };
      const botId = uid();
      const botMsg: ChatMessage = { id: botId, role: 'assistant', content: '' };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setStreaming(true);

      // Build context (last 10 messages)
      const contextMsgs: Msg[] = [...messages.slice(-9), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await streamChat({
        messages: contextMsgs,
        mode: 'chat',
        onDelta: (delta) => {
          if (abortRef.current) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, content: m.content + delta } : m
            )
          );
        },
        onDone: () => {
          setStreaming(false);
          if (!open) setHasNewMsg(true);
        },
        onError: (err) => {
          setStreaming(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? { ...m, content: err || 'Something went wrong. Please retry.', error: true }
                : m
            )
          );
        },
      });
    },
    [input, streaming, messages, open]
  );

  const retry = () => send(lastUserMsgRef.current);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ─── Dimensions ────────────────────────────────────────────────────────────

  const windowW = expanded ? 'w-[min(520px,95vw)]' : 'w-[min(380px,95vw)]';
  const windowH = expanded ? 'h-[min(680px,90vh)]' : 'h-[min(560px,82vh)]';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--accent)/0.5); }
          50% { box-shadow: 0 0 0 10px hsl(var(--accent)/0); }
        }
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-slide-in { animation: chatSlideIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chatbot' : 'Open AI assistant'}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={pulse ? { animation: 'chatPulse 2s ease-in-out 3' } : undefined}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {hasNewMsg && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-background text-white text-[9px] flex items-center justify-center">
                •
              </span>
            )}
          </>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div
          className={[
            'fixed bottom-24 right-6 z-[9998] flex flex-col rounded-2xl overflow-hidden',
            'border border-white/20 shadow-2xl chat-slide-in',
            windowW,
            windowH,
          ].join(' ')}
          style={{
            background: 'hsl(var(--card)/0.82)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0"
            style={{ background: 'hsl(var(--primary)/0.08)' }}
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Station AI</p>
              <p className="text-[11px] text-muted-foreground">
                {streaming ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                    Thinking…
                  </span>
                ) : (
                  'Placement & Interview Assistant'
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear chat"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpanded((e) => !e)}
                title={expanded ? 'Shrink' : 'Expand'}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
          >
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center pb-4">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Hi! I'm your placement assistant</p>
                  <p className="text-xs text-muted-foreground max-w-[220px]">
                    Ask me anything — DSA, interview prep, company research, mock interviews…
                  </p>
                </div>
                <div className="w-full grid grid-cols-2 gap-2 mt-1">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => send(q.text)}
                      className="text-left text-xs px-3 py-2 rounded-xl border border-border/70 bg-muted/40 hover:bg-accent/10 hover:border-accent/40 transition-all duration-200 line-clamp-1 truncate"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <Bubble
                key={msg.id}
                msg={msg}
                onRetry={msg.error ? retry : undefined}
              />
            ))}

            {/* Typing indicator */}
            {streaming && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-card/80 backdrop-blur border border-border/60 text-foreground">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-20 right-4 w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              style={{ animation: 'chatFadeUp 0.2s ease-out' }}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {/* Quick prompts (when there are messages) */}
          {messages.length > 0 && messages.length < 4 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
              {QUICK_PROMPTS.slice(0, 3).map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.text)}
                  disabled={streaming}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border/70 bg-muted/40 hover:bg-accent/10 hover:border-accent/40 transition-all duration-200 disabled:opacity-40"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="shrink-0 px-4 py-3 border-t border-white/10 flex items-end gap-2"
            style={{ background: 'hsl(var(--card)/0.5)' }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={onKeyDown}
              placeholder="Ask anything about placements…"
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/60 outline-none py-1.5 max-h-[120px] disabled:opacity-50"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              className="shrink-0 w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
