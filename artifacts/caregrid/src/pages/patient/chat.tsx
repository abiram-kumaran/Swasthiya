import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ChevronUp, Phone, WifiOff } from 'lucide-react';
import { useTranslation, Language } from '@/lib/translations';
import { CENTERS } from '@/lib/data';

/* ─── Types ───────────────────────────────────────────────── */
interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  emergency?: boolean;
  firstAidTips?: string[];
}

// --- Haversine distance ---
function dist(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

/* ─── AI Response Logic ───────────────────────────────────── */
function getAiResponse(input: string, lang: Language, userPos: { lat: number; lng: number } | null): Omit<Message, 'id'> {
  const lower = input.toLowerCase();

  // Find closest centers
  const sorted = [...CENTERS].sort((a, b) => {
    if (!userPos) return 0;
    const d1 = Math.pow(a.lat - userPos.lat, 2) + Math.pow(a.lng - userPos.lng, 2);
    const d2 = Math.pow(b.lat - userPos.lat, 2) + Math.pow(b.lng - userPos.lng, 2);
    return d1 - d2;
  });
  const nearestPhc = sorted.find(c => c.type === 'PHC') || sorted[0];
  const nearestChc = sorted.find(c => c.type === 'CHC') || sorted[0];

  const phcDist = userPos ? dist(userPos.lat, userPos.lng, nearestPhc.lat, nearestPhc.lng) : '2 km';
  const chcDist = userPos ? dist(userPos.lat, userPos.lng, nearestChc.lat, nearestChc.lng) : '2.5 km';

  // 1. Emergency (Chest Pain / Heart / Breathing)
  if (/chest|heart|breath|suffoc|दर्|सीना|நெஞ்சு|வலி|சுவாசம்|நெஞ்சுவலி|மூச்சு/i.test(lower)) {
    if (lang === 'हिन्दी') {
      return {
        role: 'ai',
        text: `🚨 आपातकालीन चेतावनी: आपके लक्षण हृदय संबंधी गंभीर समस्या का संकेत दे रहे हैं। कृपया तुरंत 108 पर कॉल करें।\n\nहम आपको तुरंत ${nearestChc.name} (${chcDist} दूर) जाने की सलाह देते हैं, जहाँ आपातकालीन बिस्तर उपलब्ध हैं।`,
        emergency: true,
      };
    }
    if (lang === 'தமிழ்') {
      return {
        role: 'ai',
        text: `🚨 அவசர எச்சரிக்கை: உங்கள் அறிகுறிகள் கடுமையான இருதயப் பிரச்சினையைக் குறிக்கின்றன. உடனே 108 ஐ அழைக்கவும்.\n\nஅவசர படுக்கைகள் மற்றும் தீவிர சிகிச்சை வசதிகள் கொண்ட ${nearestChc.name} (${chcDist} தொலைவில் உள்ளது) செல்ல பரிந்துரைக்கிறோம்.`,
        emergency: true,
      };
    }
    return {
      role: 'ai',
      text: `🚨 EMERGENCY ALERT: Your symptoms suggest a potential cardiac issue. Please call 108 immediately.\n\nWe recommend heading directly to ${nearestChc.name} (${chcDist} away), which has emergency beds and critical care available.`,
      emergency: true,
    };
  }

  // 2. Fever / Temperature / Flu
  if (/fever|temp|cold|cough|flu|hot|बुखार|ताप|सर्दी|खांसी|காய்ச்சல்|சளி|இருமல்/i.test(lower)) {
    if (lang === 'हिन्दी') {
      return {
        role: 'ai',
        text: `बुखार और सर्दी के लक्षणों के लिए, हम ${nearestPhc.name} (${phcDist} दूर) जाने की सलाह देते हैं। यहाँ वर्तमान प्रतीक्षा समय लगभग ${nearestPhc.waitMins} मिनट है।\n\nडॉक्टर उपलब्ध हैं। तुरंत आराम के लिए ये सलाह लें:`,
        firstAidTips: [
          'दिन में ८-१० गिलास पानी/तरल पदार्थ पिएं',
          'पूर्ण विश्राम करें और भारी काम से बचें',
          'यदि तापमान ३८.५ डिग्री सेल्सियस से अधिक है, तो पैरासिटामोल ५०० एमजी लें',
          'यदि बुखार ३ दिन से अधिक समय तक बना रहता है, तो डॉक्टर से मिलें'
        ],
      };
    }
    if (lang === 'தமிழ்') {
      return {
        role: 'ai',
        text: `காய்ச்சல் மற்றும் சளி அறிகுறிகளுக்கு, நீங்கள் ${nearestPhc.name} (${phcDist} தொலைவில் உள்ளது) செல்ல பரிந்துரைக்கிறோம். தற்போதைய காத்திருப்பு நேரம் சுமார் ${nearestPhc.waitMins} நிமிடங்கள்.\n\nஉடனடி நிவாரணத்திற்கான குறிப்புகள்:`,
        firstAidTips: [
          'தினமும் 8-10 கிளாஸ் தண்ணீர் அல்லது திரவ உணவுகளை உட்கொள்ளவும்',
          'முழு ஓய்வு எடுக்கவும், கடின வேலைகளை தவிர்க்கவும்',
          'வெப்பநிலை 38.5°C க்கு மேல் இருந்தால் பாராசிட்டமால் 500mg மாத்திரை எடுக்கலாம்',
          'காய்சல் 3 நாட்களுக்கு மேல் நீடித்தால் மருத்துவரை அணுகவும்'
        ],
      };
    }
    return {
      role: 'ai',
      text: `Based on your symptoms (fever/cold), we recommend visiting ${nearestPhc.name} (${phcDist} away). Current wait time is around ${nearestPhc.waitMins} minutes.\n\nHere are some immediate self-care steps:`,
      firstAidTips: [
        'Drink 8–10 glasses of water or fluids daily',
        'Take complete rest and avoid physical exertion',
        'Paracetamol 500mg every 6 hours if temperature exceeds 38.5°C',
        'Seek professional medical evaluation if fever persists > 3 days',
      ],
    };
  }

  // 3. Stomach pain / Diarrhea / Vomiting
  if (/stomach|vomit|diarrh|belly|pain|पे|दस्|வயிற்று|வாந்தி/i.test(lower)) {
    if (lang === 'हिन्दी') {
      return {
        role: 'ai',
        text: `पेट दर्द या दस्त के लिए, निर्जलीकरण (dehydration) से बचना सबसे महत्वपूर्ण है। ओआरएस (ORS) घोल पिएं।\n\nयदि दर्द गंभीर है, तो तुरंत ${nearestChc.name} (${chcDist} दूर) जाएं, जहां 24/7 आपातकालीन सेवाएं उपलब्ध हैं।`,
        firstAidTips: [
          'ओआरएस (ORS) घोल या नारियल पानी पिएं',
          'मसालेदार और भारी भोजन से बचें',
          'उबला हुआ हल्का खाना जैसे खिचड़ी लें',
          'उल्टी होने पर घूंट-घूंट कर पानी पिएं'
        ],
      };
    }
    if (lang === 'தமிழ்') {
      return {
        role: 'ai',
        text: `வயிற்று வலி அல்லது வயிற்றுப்போக்கிற்கு, நீர்ச்சத்து இழப்பைத் தவிர்ப்பதே முக்கியம். ஓஆர்எஸ் (ORS) கரைசலைக் குடிக்கவும்.\n\nவலி அதிகமாக இருந்தால், 24/7 அவசர சிகிச்சை வசதி கொண்ட ${nearestChc.name} (${chcDist} தொலைவில் உள்ளது) செல்லவும்.`,
        firstAidTips: [
          'ஓஆர்எஸ் (ORS) கரைசல் அல்லது இளநீர் அடிக்கடி குடிக்கவும்',
          'காரமான மற்றும் கடின உணவுகளை தவிர்க்கவும்',
          'கஞ்சி அல்லது எளிதில் ஜீரணமாகும் உணவுகளை உட்கொள்ளவும்',
          'ஓய்வு எடுக்கவும்'
        ],
      };
    }
    return {
      role: 'ai',
      text: `For abdominal pain, diarrhea, or vomiting, it is crucial to stay hydrated. Drink ORS.\n\nIf the pain is severe or sharp, visit ${nearestChc.name} (${chcDist} away) immediately for full diagnostic services.`,
      firstAidTips: [
        'Rehydrate continuously with ORS solution or coconut water',
        'Avoid spicy, oily, or heavy foods',
        'Eat light, easily digestible food like boiled rice or porridge',
        'Rest and monitor for signs of dehydration (dry mouth, dark urine)',
      ],
    };
  }

  // 4. Headache / Migraine
  if (/head|migrain|सिर|தலை/i.test(lower)) {
    if (lang === 'हिन्दी') {
      return {
        role: 'ai',
        text: `सिरदर्द के लिए, हम शांत और अंधेरे कमरे में आराम करने की सलाह देते हैं।\n\nपरामर्श के लिए, आप ${nearestPhc.name} (${phcDist} दूर) जा सकते हैं, जहाँ सामान्य चिकित्सक उपलब्ध हैं।`,
        firstAidTips: [
          'शांत, अंधेरे कमरे में लेट जाएं',
          'माथे पर ठंडी या गर्म पट्टी लगाएं',
          'पर्याप्त मात्रा में पानी पिएं (निर्जलीकरण सिरदर्द का मुख्य कारण है)',
          'मोबाइल या कंप्यूटर स्क्रीन देखने से बचें'
        ],
      };
    }
    if (lang === 'தமிழ்') {
      return {
        role: 'ai',
        text: `தலைவலி அல்லது ஒற்றைத் தலைவலிக்கு, அமைதியான மற்றும் இருண்ட அறையில் ஓய்வெடுக்க பரிந்துரைக்கிறோம்.\n\nஆலோசனைக்கு, நீங்கள் ${nearestPhc.name} (${phcDist} தொலைவில் உள்ளது) செல்லலாம்.`,
        firstAidTips: [
          'அமைதியான, இருண்ட அறையில் படுத்து ஓய்வெடுக்கவும்',
          'நெற்றியில் குளிர்ந்த அல்லது வெதுவெதுப்பான துணியை வைக்கவும்',
          'நிறைய தண்ணீர் குடிக்கவும்',
          'மொபைல், கணினி திரைகளைப் பார்ப்பதைத் தவிர்க்கவும்'
        ],
      };
    }
    return {
      role: 'ai',
      text: `For headaches or migraines, we advise resting in a quiet, dark environment.\n\nTo consult a doctor, visit ${nearestPhc.name} (${phcDist} away) where physicians are available.`,
      firstAidTips: [
        'Rest in a quiet, dark room',
        'Apply a cold or warm compress to your forehead',
        'Stay hydrated — drink plenty of water',
        'Avoid screens, laptop, and bright lights',
      ],
    };
  }

  // 5. Dengue / Malaria / Outbreak
  if (/dengue|malaria|mosquit|डेंगू|मलेरिया|मच्छर|கொசு|டெங்கு/i.test(lower)) {
    if (lang === 'हिन्दी') {
      return {
        role: 'ai',
        text: `⚠️ डेंगू/मलेरिया चेतावनी: करंगल वार्ड में डेंगू के १४ मामले पाए गए हैं। बुखार होने पर तुरंत ${nearestPhc.name} (${phcDist} दूर) में रेपिड टेस्ट कराएं।`,
        firstAidTips: [
          'मच्छरदानी और मॉस्किटो रेपेलेंट का उपयोग करें',
          'घर के आसपास पानी जमा न होने दें',
          'शरीर को पूरी तरह ढकने वाले कपड़े पहनें',
          'बिना डॉक्टर की सलाह के एस्पिरिन या इबुप्रोफेन न लें'
        ],
      };
    }
    if (lang === 'தமிழ்') {
      return {
        role: 'ai',
        text: `⚠️ டெங்கு/மலேரியா எச்சரிக்கை: கருங்கல் பகுதியில் 14 டெங்கு பாதிப்புகள் கண்டறியப்பட்டுள்ளன. காய்ச்சல் இருந்தால் உடனே ${nearestPhc.name} (${phcDist} தொலைவில் உள்ளது) சென்று டெங்கு பரிசோதனை செய்து கொள்ளவும்.`,
        firstAidTips: [
          'கொசு வலை மற்றும் கொசு விரட்டிகளைப் பயன்படுத்தவும்',
          'வீட்டைச் சுற்றி தண்ணீர் தேங்காமல் பார்த்துக் கொள்ளவும்',
          'முழு கை சட்டைகளை அணியவும்',
          'மருத்துவர் அறிவுரை இன்றி மாத்திரைகளை உட்கொள்ள வேண்டாம்'
        ],
      };
    }
    return {
      role: 'ai',
      text: `⚠️ DENGUE/MALARIA ALERT: There are active dengue cases reported in Karungal Ward. If you have high fever, visit ${nearestPhc.name} (${phcDist} away) for rapid diagnostic testing immediately.`,
      firstAidTips: [
        'Use mosquito nets and repellents at all times',
        'Ensure no standing or stagnant water accumulates near your home',
        'Wear long-sleeved clothing to prevent bites',
        'Avoid self-medicating with Aspirin or Ibuprofen; seek medical advice',
      ],
    };
  }

  // 6. Default response
  if (lang === 'हिन्दी') {
    return {
      role: 'ai',
      text: "मैं समझता हूं कि आप ठीक महसूस नहीं कर रहे हैं। कृपया अपने लक्षणों का थोड़ा और विस्तार से वर्णन करें। जैसे: यह समस्या कब से है? क्या आपको बुखार, बदन दर्द या सांस लेने में परेशानी हो रही है? मैं आपको सटीक सलाह दूंगा।",
    };
  }
  if (lang === 'தமிழ்') {
    return {
      role: 'ai',
      text: "நீங்கள் நலமாக இல்லை என்பதை நான் உணர்கிறேன். உங்கள் அறிகுறிகளைப் பற்றி இன்னும் விரிவாகக் கூற முடியுமா? உதாரணமாக: இது எவ்வளவு நாட்களாக இருக்கிறது? காய்ச்சல், உடல் வலி அல்லது மூச்சு விடுவதில் சிரமம் உள்ளதா?",
    };
  }
  return {
    role: 'ai',
    text: "I understand you are not feeling well. Can you please describe your symptoms in a bit more detail? For example: How long have you had this? Do you have a fever, body ache, or difficulty breathing? I will find the best recommendations for you.",
  };
}

/* ─── Message Bubble ──────────────────────────────────────── */
function Bubble({ msg }: { msg: Message }) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const isAi = msg.role === 'ai';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-3`}
    >
      <div className={`max-w-[82%] ${isAi ? 'order-2' : ''}`}>
        {/* Main bubble */}
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          msg.emergency
            ? 'bg-red-500 text-white rounded-tl-sm'
            : isAi
              ? 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
              : 'bg-blue-600 text-white rounded-tr-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
          {msg.emergency && (
            <a href="tel:108">
              <motion.div
                whileTap={{ scale: 0.96 }}
                className="mt-3 bg-white text-red-600 font-black text-sm py-2.5 rounded-xl
                  flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                CALL 108
              </motion.div>
            </a>
          )}
        </div>
        {/* First Aid Tips */}
        {msg.firstAidTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 bg-green-50 border border-green-100 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setTipsOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-green-700"
            >
              <span className="text-xs font-bold">💊 First Aid Tips</span>
              {tipsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {tipsOpen && (
                <motion.ul
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="px-4 pb-3 space-y-1.5 overflow-hidden"
                >
                  {msg.firstAidTips.map((tip, i) => (
                    <li key={i} className="text-xs text-green-700 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Typing Indicator ────────────────────────────────────── */
function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-3">
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, delay, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'ai',
  text: "Hello! I'm your health assistant. You can describe your symptoms in Hindi, Tamil, or English. I'll help you find the right care. 🏥",
};

const QUICK_CHIPS = ['Fever', 'Headache', 'Cough', 'Stomach Pain', 'Emergency'];

/* ─── Chat Page ───────────────────────────────────────────── */
export default function PatientChat() {
  const { t, lang } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const userPos = useMemo(() => {
    const saved = localStorage.getItem('user_pos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        ...getAiResponse(text, lang as Language, userPos) 
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">CareGrid AI Assistant</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
              {t('geminiPowered', 'Gemini-powered')}
            </span>
            <span className="text-[10px] bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <WifiOff className="w-2.5 h-2.5" /> {t('worksOffline', 'Works offline')}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map(m => {
          const text = m.id === 'welcome' ? t('chatGreeting') : m.text;
          return <Bubble key={m.id} msg={{ ...m, text }} />;
        })}
        {typing && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* Quick chips */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-100 flex-shrink-0">
        {QUICK_CHIPS.map(chip => {
          const chipLabel = chip === 'Fever' ? t('fever', 'Fever') :
                            chip === 'Headache' ? t('headache', 'Headache') :
                            chip === 'Cough' ? t('cough', 'Cough') :
                            chip === 'Stomach Pain' ? t('stomachPain', 'Stomach Pain') :
                            t('emergency', 'Emergency');
          return (
            <motion.button
              key={chip}
              whileTap={{ scale: 0.94 }}
              onClick={() => sendMessage(chip)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                chip === 'Emergency'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}
            >
              {chipLabel}
            </motion.button>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 bg-white flex items-end gap-3 flex-shrink-0">
        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-end gap-2">
          <textarea
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none resize-none placeholder-gray-400 max-h-24"
            placeholder={t('chatPlaceholder', 'Describe your symptoms...')}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            className="text-blue-600 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
