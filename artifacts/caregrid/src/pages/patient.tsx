import React, { useState, useEffect, useRef } from 'react';
import { useListChatMessages, useSendChatMessage } from '@workspace/api-client-react';
import {
  Send, Phone, Video, MoreVertical, AlertTriangle,
  Mic, CheckCheck, SmilePlus, Paperclip,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';

/* ─── Quick reply chips ───────────────────────────────────── */
const QUICK_REPLIES = [
  'Check crowd at PHC-Alpha',
  'I have fever and headache',
  'Is Paracetamol available?',
  'I have chest pain',
];

/* ─── Time formatter ─────────────────────────────────────── */
function msgTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Message bubble ──────────────────────────────────────── */
function MessageBubble({ msg, isNew }: {
  msg: { id: number; role: string; content: string; isAlert?: boolean; createdAt: string };
  isNew?: boolean;
}) {
  const isBot = msg.role === 'bot';
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 12, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {/* Bot avatar */}
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1 shadow-sm">
          <span className="text-white text-[10px] font-black">CG</span>
        </div>
      )}

      <div className={`max-w-[82%] relative ${isBot ? '' : 'flex flex-col items-end'}`}>
        {/* Alert badge */}
        {msg.isAlert && (
          <div className="flex items-center gap-1 text-red-600 text-[10px] font-extrabold uppercase tracking-wide mb-1 ml-1">
            <AlertTriangle className="w-3 h-3" /> EMERGENCY ALERT
          </div>
        )}

        <div className={`rounded-2xl px-3.5 py-2.5 shadow-sm text-sm leading-relaxed relative ${
          msg.isAlert
            ? 'bg-red-500 text-white rounded-tl-sm'
            : isBot
              ? 'bg-white text-gray-900 rounded-tl-sm'
              : 'bg-[#DCF8C6] text-gray-900 rounded-tr-sm'
        }`}
        style={{
          boxShadow: msg.isAlert
            ? '0 2px 8px rgba(220,38,38,0.3)'
            : '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          {/* Tail */}
          {isBot
            ? <div className={`absolute -left-[6px] top-0 w-3 h-3 overflow-hidden`}>
                <div className={`w-4 h-4 rotate-45 origin-top-right ${msg.isAlert ? 'bg-red-500' : 'bg-white'}`} />
              </div>
            : <div className="absolute -right-[6px] top-0 w-3 h-3 overflow-hidden">
                <div className="w-4 h-4 rotate-45 origin-top-left bg-[#DCF8C6]" />
              </div>
          }

          <p className="whitespace-pre-wrap break-words">{msg.content}</p>

          <div className={`flex items-center justify-end gap-1 mt-1.5 ${
            msg.isAlert ? 'text-white/70' : 'text-gray-400'
          }`}>
            <span className="text-[10px]">{msgTime(msg.createdAt)}</span>
            {!isBot && <CheckCheck className="w-3.5 h-3.5 text-blue-400" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Patient Page ───────────────────────────────────── */
export default function Patient() {
  const sessionId = 'demo-session';
  const { data: messages, refetch } = useListChatMessages(
    { sessionId },
    { query: { queryKey: ['chat', sessionId], refetchInterval: 4000 } }
  );
  const sendMessage = useSendChatMessage();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastNewId, setLastNewId] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const doSend = (text: string) => {
    if (!text.trim() || sendMessage.isPending) return;
    setInput('');
    setIsTyping(true);
    sendMessage.mutate({ data: { sessionId, content: text, isVoice: false } }, {
      onSuccess: (data) => {
        setIsTyping(false);
        setLastNewId(data.botMessage.id);
        refetch();
      },
      onError: () => setIsTyping(false),
    });
  };

  const hasAlert = messages?.some(m => m.role === 'bot' && m.isAlert);

  return (
    <div className="max-w-[480px] mx-auto h-[100dvh] flex flex-col shadow-2xl"
      style={{ background: '#ECE5DD' }}
    >
      {/* WhatsApp Header */}
      <header className="flex items-center gap-3 px-3 py-2.5 text-white z-20 flex-shrink-0"
        style={{ background: '#075E54' }}
      >
        <Link href="/dashboard">
          <div className="p-1 opacity-70 hover:opacity-100">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </div>
        </Link>

        {/* Bot avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
          style={{ background: '#128C7E' }}
        >
          <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">CG</div>
        </div>

        <div className="flex-1">
          <h1 className="font-bold text-[15px] leading-tight">CareGrid Health Bot</h1>
          <p className="text-[11px] text-white/70">Govt. of India · Verified ✓</p>
        </div>

        <div className="flex items-center gap-4 text-white/80">
          <Video className="w-5 h-5" />
          <Phone className="w-5 h-5" />
          <MoreVertical className="w-5 h-5" />
        </div>
      </header>

      {/* Emergency alert banner */}
      <AnimatePresence>
        {hasAlert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500 text-white px-4 py-2 text-xs font-extrabold flex items-center gap-2 overflow-hidden"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            🚨 Emergency alert detected · Frontline staff notified
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <main className="flex-1 overflow-auto px-3 py-4 flex flex-col gap-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b0bec5' fill-opacity='0.08'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Encryption notice */}
        <div className="bg-[#FFF9C4] text-[#4A4000] text-[11px] text-center rounded-lg px-4 py-2 mx-auto max-w-[85%] shadow-sm mb-2">
          🔒 End-to-end encrypted · CareGrid uses this strictly for medical routing
        </div>

        {/* Welcome if empty */}
        {(!messages || messages.length === 0) && (
          <div className="text-center my-6 opacity-60">
            <div className="w-16 h-16 rounded-full bg-[#075E54] flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-2xl font-black">CG</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">CareGrid Health Assistant</p>
            <p className="text-gray-400 text-xs mt-1">Ask about wait times, symptoms, or medicine availability</p>
          </div>
        )}

        {messages?.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isNew={msg.id === lastNewId} />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex justify-start items-end gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-[9px] font-black">CG</span>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                {[0, 0.2, 0.4].map(d => (
                  <motion.div key={d}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: d }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </main>

      {/* Quick reply chips */}
      {(!messages || messages.length === 0) && (
        <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {QUICK_REPLIES.map(r => (
            <button key={r}
              onClick={() => doSend(r)}
              className="flex-shrink-0 bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <footer className="flex items-end gap-2 px-2 py-2 flex-shrink-0" style={{ background: '#F0F2F5' }}>
        <div className="flex-1 bg-white rounded-3xl flex items-end gap-2 px-4 py-2.5 shadow-sm border border-gray-100">
          <SmilePlus className="w-5 h-5 text-gray-400 flex-shrink-0 mb-0.5" />
          <textarea
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(input); }
            }}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none max-h-[120px] leading-relaxed"
          />
          <Paperclip className="w-5 h-5 text-gray-400 flex-shrink-0 mb-0.5" />
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => doSend(input)}
          disabled={!input.trim() || sendMessage.isPending}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0 transition-colors ${
            input.trim() ? 'bg-[#128C7E] hover:bg-[#0f7265]' : 'bg-gray-300'
          }`}
        >
          {input.trim() ? <Send className="w-5 h-5 ml-0.5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
      </footer>
    </div>
  );
}
