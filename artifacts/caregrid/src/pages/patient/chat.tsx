import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@/lib/translations';
import { CENTERS } from '@/lib/data';
import { getPatient } from '@/lib/patientStore';

/* ── Types ──────────────────────────────────────────────── */
interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  emergency?: boolean;
  tips?: string[];
  chips?: string[];
}

/* ── Haversine ──────────────────────────────────────────── */
function dist(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

/* ── Simple markdown renderer ───────────────────────────── */
function renderMd(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    // Bullet points
    if (line.trimStart().startsWith('•') || line.trimStart().startsWith('-')) {
      return (
        <div key={i} className="flex items-start gap-1.5 mt-1">
          <span className="text-blue-400 mt-0.5 shrink-0">•</span>
          <span>{parts.slice(1)}</span>
        </div>
      );
    }
    return <p key={i} className="mt-1 first:mt-0">{parts}</p>;
  });
}

/* ── AI response engine ─────────────────────────────────── */
function getAiResponse(
  input: string,
  langCode: string,
  userPos: { lat: number; lng: number } | null,
  patient: ReturnType<typeof getPatient>,
): Omit<Message, 'id'> {
  const lower = input.toLowerCase();
  const sorted = [...CENTERS].sort((a, b) => {
    if (!userPos) return 0;
    return ((a.lat - userPos.lat) ** 2 + (a.lng - userPos.lng) ** 2) -
           ((b.lat - userPos.lat) ** 2 + (b.lng - userPos.lng) ** 2);
  });
  const nearestPhc = sorted.find(c => c.type === 'PHC') ?? sorted[0];
  const nearestChc = sorted.find(c => c.type === 'CHC') ?? sorted[0];
  const phcDist = userPos ? dist(userPos.lat, userPos.lng, nearestPhc.lat, nearestPhc.lng) : '2 km';
  const chcDist = userPos ? dist(userPos.lat, userPos.lng, nearestChc.lat, nearestChc.lng) : '3 km';

  const name = patient?.name?.split(' ')[0] ?? 'there';

  // Emergency
  if (/chest|heart|breath|suffoc|unconscious|collapse|stroke|attack/.test(lower)) {
    return {
      role: 'ai',
      emergency: true,
      text: `🚨 **Emergency Alert** — ${name}, your symptoms suggest a **critical cardiac or respiratory emergency**.\n\nPlease **call 108 immediately** and go to **${nearestChc.name}** (${chcDist} away) which has emergency beds and critical care.\n\nDo NOT wait or drive yourself.`,
    };
  }

  // Diabetes specific (personalised)
  if (patient?.conditions.some(c => /diabet/i.test(c)) && /sugar|glucose|diabet|thirst|urine|fatigue/.test(lower)) {
    return {
      role: 'ai',
      text: `Based on your health profile, ${name}, you have **Diabetes**. Your symptoms may be related to blood sugar fluctuation.\n\n**What to do now:**\n- Check your blood glucose if you have a glucometer\n- If reading > 300 mg/dL, visit ${nearestPhc.name} immediately\n- Drink water if feeling thirsty or dizzy\n\nVisit **${nearestPhc.name}** (${phcDist} away) for a full checkup. Wait time: ~${nearestPhc.waitMins} mins.`,
      tips: ['Check blood sugar before eating', 'Take insulin/medication on schedule', 'Avoid sugary drinks', 'Visit doctor if symptoms persist > 2 days'],
      chips: ['Nearest Clinic', 'Diabetes Tips'],
    };
  }

  // BP specific (personalised)
  if (patient?.conditions.some(c => /hypertension|blood pressure/i.test(c)) && /head|dizz|bp|pressure|blur/.test(lower)) {
    return {
      role: 'ai',
      text: `${name}, since you have **Hypertension**, dizziness or severe headache can indicate high blood pressure.\n\n**Immediate steps:**\n- Rest in a quiet place\n- Avoid salt and caffeine\n- Take your BP medication if prescribed\n\nIf BP is very high or you feel chest pain, go to **${nearestChc.name}** (${chcDist}) immediately.`,
      tips: ['Check BP if possible', 'Take prescribed medication', 'Sit quietly — avoid stress', 'Avoid lifting or exertion'],
      chips: ['Check BP', 'Find Nearest Clinic'],
    };
  }

  // Fever
  if (/fever|temp|hot|shiver|chills|ठंड|बुखार|காய்ச்சல்/.test(lower)) {
    return {
      role: 'ai',
      text: `I understand you're experiencing **fever** symptoms.\n\nWe recommend visiting **${nearestPhc.name}** (${phcDist} away). Current wait time: ~**${nearestPhc.waitMins} minutes**.\n\n${nearestPhc.doctors} doctor(s) are available right now.`,
      tips: ['Drink 8–10 glasses of water daily', 'Rest and avoid exertion', 'Paracetamol 500mg every 6 hours if temp > 38.5°C', 'See a doctor if fever lasts more than 3 days'],
      chips: ['Book Appointment', 'Nearest PHC'],
    };
  }

  // Cough / cold
  if (/cough|cold|throat|sneez|runny|congestion/.test(lower)) {
    return {
      role: 'ai',
      text: `For **cough and cold** symptoms, most cases are viral and improve with rest.\n\n**Self-care tips:**\n- Stay warm and drink warm fluids\n- Honey + ginger tea can help\n- Steam inhalation for congestion\n\nIf cough persists more than **7 days** or there is blood in sputum, visit **${nearestPhc.name}** (${phcDist}).`,
      tips: ['Warm honey-ginger tea', 'Steam inhalation twice daily', 'Avoid cold drinks and ice cream', 'Wear a mask if in public'],
      chips: ['Nearest PHC', 'More Tips'],
    };
  }

  // Stomach / vomiting / diarrhea
  if (/stomach|vomit|diarrhea|loose|belly|nausea|acidity/.test(lower)) {
    return {
      role: 'ai',
      text: `For **stomach issues**, staying hydrated is the most important step.\n\nDrink **ORS (Oral Rehydration Salt)** solution continuously.\n\nIf pain is **severe, sharp, or persistent** for more than 6 hours, visit **${nearestChc.name}** (${chcDist}) for full diagnostic support.`,
      tips: ['ORS solution or coconut water every 30 minutes', 'Avoid spicy and heavy food', 'Eat light food: boiled rice, toast, bananas', 'Watch for signs of dehydration: dry mouth, dark urine'],
      chips: ['ORS Guide', 'Nearest Clinic'],
    };
  }

  // Headache
  if (/head|migrain|migraine/.test(lower)) {
    return {
      role: 'ai',
      text: `For **headache or migraine**, rest is the first step.\n\n**Try these:**\n- Lie down in a quiet, dark room\n- Apply a cold compress to your forehead\n- Drink plenty of water\n\nFor consultation, visit **${nearestPhc.name}** (${phcDist}) where physicians are currently available.`,
      tips: ['Rest in a dark, quiet room', 'Apply cold or warm compress', 'Stay hydrated — drink water', 'Avoid bright screens and loud noise'],
      chips: ['Book Appointment', 'Headache Types'],
    };
  }

  // Dengue / malaria
  if (/dengue|malaria|mosquito|bite/.test(lower)) {
    return {
      role: 'ai',
      text: `⚠️ **Dengue / Malaria Alert** — There are active cases in the district.\n\nIf you have **high fever + body ache + joint pain**, visit **${nearestPhc.name}** (${phcDist}) immediately for a rapid diagnostic test.\n\nEarly detection is critical.`,
      tips: ['Use mosquito nets and repellents', 'Eliminate standing water near home', 'Wear full-sleeve clothes', 'Do NOT take Aspirin or Ibuprofen — take Paracetamol only'],
      chips: ['Get Tested', 'Prevention Guide'],
    };
  }

  // Greet
  if (/hello|hi |hey|namaste|வணக்கம்|नमस्ते/.test(lower)) {
    const conditions = patient?.conditions.length
      ? `\n\nI can see from your profile that you have **${patient.conditions.join(', ')}**. I can give you personalised advice anytime.`
      : '';
    return {
      role: 'ai',
      text: `Hello, **${name}**! 👋 I'm your CareGrid AI health assistant.${conditions}\n\nHow are you feeling today? You can describe your symptoms or ask any health question.`,
      chips: ['I have fever', 'Headache', 'Stomach pain', 'Book appointment'],
    };
  }

  // Default
  return {
    role: 'ai',
    text: `I understand you're not feeling well, **${name}**.\n\nCould you please tell me more about your symptoms? For example:\n- **How long** have you had this?\n- Do you have **fever, pain, or difficulty breathing**?\n- Is it **getting worse**?\n\nThis will help me give you the most accurate advice.`,
    chips: ['I have fever', 'Cough / Cold', 'Stomach pain', 'Emergency'],
  };
}

/* ── Streaming dots ─────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex gap-1 ml-2">
        {[0, 0.18, 0.36].map((delay, i) => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-gray-400"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, delay, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Message bubble ─────────────────────────────────────── */
function Bubble({ msg }: { msg: Message }) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const isAi = msg.role === 'ai';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-4 gap-2`}
    >
      {/* AI avatar */}
      {isAi && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[82%] ${isAi ? '' : ''}`}>
        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${
          msg.emergency
            ? 'bg-red-500 text-white rounded-tl-sm'
            : isAi
              ? 'bg-white text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm'
              : 'bg-blue-600 text-white rounded-tr-sm'
        }`}>
          {isAi ? (
            <div className="space-y-0.5">{renderMd(msg.text)}</div>
          ) : (
            <p>{msg.text}</p>
          )}

          {/* Emergency call button */}
          {msg.emergency && (
            <a href="tel:108">
              <motion.div whileTap={{ scale: 0.96 }}
                className="mt-3 bg-white text-red-600 font-black text-sm py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                📞 CALL 108 NOW
              </motion.div>
            </a>
          )}
        </div>

        {/* Tips panel */}
        {msg.tips && msg.tips.length > 0 && (
          <div className="mt-2 bg-green-50 border border-green-100 rounded-2xl overflow-hidden">
            <button onClick={() => setTipsOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-green-700"
            >
              <span className="text-xs font-bold">💊 Quick Tips</span>
              {tipsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {tipsOpen && (
                <motion.ul initial={{ height: 0 }} animate={{ height: 'auto' }}
                  exit={{ height: 0 }} className="px-4 pb-3 space-y-1.5 overflow-hidden"
                >
                  {msg.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-green-700 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>{tip}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Quick chips ─────────────────────────────────────────── */
const DEFAULT_CHIPS = ['I have fever', 'Headache', 'Cough', 'Stomach pain', '🚨 Emergency'];

/* ── Main Chat ───────────────────────────────────────────── */
export default function PatientChat() {
  const { t, lang } = useTranslation();
  const patient = getPatient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userPos = useMemo(() => {
    try { const s = localStorage.getItem('user_pos'); return s ? JSON.parse(s) : null; } catch { return null; }
  }, []);

  // Determine language code for AI engine
  const langCode = lang.toLowerCase().startsWith('ta') || lang === 'தமிழ்' ? 'ta'
    : lang.toLowerCase().startsWith('hi') || lang === 'हिन्दी' ? 'hi' : 'en';

  // Welcome message based on patient profile
  useEffect(() => {
    const name = patient?.name?.split(' ')[0] ?? 'there';
    const greeting: Message = {
      id: 'welcome',
      role: 'ai',
      text: `Hello, **${name}**! 👋 I'm CareGrid AI, your personal health assistant.\n\nDescribe your symptoms and I'll help you find the best care — or ask me anything about your health.`,
      chips: DEFAULT_CHIPS,
    };
    setMessages([greeting]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const lastAiChips = useMemo(() => {
    const last = [...messages].reverse().find(m => m.role === 'ai' && m.chips);
    return last?.chips ?? DEFAULT_CHIPS;
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate Gemini-like thinking delay (0.8s–1.4s)
    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      setTyping(false);
      const response = getAiResponse(text, langCode, userPos, patient);
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, ...response }]);
    }, delay);
  };

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: 'calc(100vh - 68px)' }}>

      {/* Header — Gemini style */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative">
          <Sparkles className="w-5 h-5 text-white" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">CareGrid AI</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Active
            </span>
            <span className="text-gray-300 text-[10px]">·</span>
            <span className="text-[10px] text-gray-500">Health assistant</span>
          </div>
        </div>
        <span className="text-[10px] bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-2.5 py-1 rounded-full">
          Gemini AI
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map(m => <Bubble key={m.id} msg={m} />)}
        {typing && <TypingDots />}
        <div ref={endRef} />
      </div>

      {/* Quick chips */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-100 shrink-0" style={{ scrollbarWidth: 'none' }}>
        {lastAiChips.map(chip => (
          <motion.button key={chip} whileTap={{ scale: 0.94 }} onClick={() => send(chip)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              chip.includes('Emergency') || chip.includes('🚨')
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
            }`}
          >
            {chip}
          </motion.button>
        ))}
      </div>

      {/* Input bar — Gemini style */}
      <div className="px-4 py-3 bg-white shrink-0">
        <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none resize-none placeholder-gray-400 max-h-28 leading-relaxed"
            placeholder={t('chatPlaceholder', 'Ask me anything about your health…')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => send(input)}
            disabled={!input.trim() || typing}
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              input.trim() && !typing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-1.5">
          AI advice is for guidance only. Always consult a doctor for medical decisions.
        </p>
      </div>
    </div>
  );
}
