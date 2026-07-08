import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';

function OtpBox({ digits, onChange, verified }: {
  digits: string[]; onChange: (d: string[]) => void; verified: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const handle = (i: number, v: string) => {
    const c = v.replace(/\D/, '').slice(-1);
    const n = [...digits]; n[i] = c; onChange(n);
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <motion.input key={i} ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handle(i, e.target.value)} onKeyDown={e => onKey(i, e)}
          animate={verified ? { scale: [1, 1.2, 1] } : {}}
          transition={{ delay: i * 0.05 }}
          className={`w-10 h-12 text-center font-bold text-base rounded-xl border-2 bg-white/10 text-white outline-none transition-all
            ${d ? 'border-green-400' : 'border-white/30 focus:border-white'}`}
        />
      ))}
    </div>
  );
}

function PatientModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [, navigate] = useLocation();

  const sendOtp = () => {
    if (phone.length < 10) { toast.error('Enter valid 10-digit number'); return; }
    setSending(true);
    setTimeout(() => { setSending(false); setStep('otp'); setTimeout(() => setDigits(['1','2','3','4','5','6']), 1500); }, 800);
  };
  const verify = () => {
    if (digits.join('').length < 6) { toast.error('Enter 6-digit OTP'); return; }
    setVerified(true);
    setTimeout(() => navigate('/patient/home'), 900);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#0B6CBB 0%,#084e8a 100%)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => step === 'otp' ? setStep('phone') : onClose()} className="text-white/60 hover:text-white">
            {step === 'otp' ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          <p className="text-white font-bold">Patient Login</p>
          <div className="w-5" />
        </div>
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-blue-200 text-xs text-center mb-4">We'll send a verification code to your number</p>
              <div className="flex rounded-xl overflow-hidden bg-white/10 border border-white/20 mb-3">
                <div className="flex items-center gap-1.5 px-3 border-r border-white/20">
                  <span className="text-lg">🇮🇳</span><span className="text-white text-xs font-semibold">+91</span>
                </div>
                <input type="tel" inputMode="numeric" placeholder="98765 43210" maxLength={10} value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/,'').slice(0,10))}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  className="flex-1 bg-transparent text-white placeholder-blue-300 px-3 py-3 text-sm outline-none"
                />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={sendOtp} disabled={sending}
                className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send OTP via SMS'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-blue-200 text-xs text-center mb-4">Enter the code sent to <span className="text-white font-bold">+91 {phone}</span></p>
              <div className="mb-5"><OtpBox digits={digits} onChange={setDigits} verified={verified} /></div>
              {verified && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-green-300 mb-3 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Verified! Redirecting…
                </motion.div>
              )}
              <motion.button whileTap={{ scale: 0.97 }} onClick={verify} disabled={verified}
                className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-60"
              >
                Verify &amp; Continue →
              </motion.button>
              <p className="text-center text-blue-300 text-[11px] mt-3">
                Didn't receive it?{' '}
                <button className="text-white font-semibold underline" onClick={sendOtp}>Resend OTP</button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

const ROLES = [
  { emoji:'🏥', title:'Patient',          subtitle:'Book tokens, find health centres, AI triage', action:'patient' },
  { emoji:'🩺', title:'Clinic Staff',     subtitle:'Manage patients, inventory & attendance',     action:'staff'   },
  { emoji:'🚚', title:'Logistics Driver', subtitle:'Medicine delivery & ambulance dispatch',      action:'driver'  },
  { emoji:'🏛️', title:'District Admin',  subtitle:'District-wide analytics & AI command',        action:'admin'   },
];

export default function Login() {
  const [, navigate] = useLocation();
  const [showPatient, setShowPatient] = useState(false);

  const handleRole = (action: string) => {
    if (action === 'patient') { setShowPatient(true); return; }
    navigate(`/${action}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'linear-gradient(160deg,#0B6CBB 0%,#084e8a 55%,#05345c 100%)' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'radial-gradient(white 1px,transparent 1px)', backgroundSize:'20px 20px' }} />

      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}
        className="flex flex-col items-center pt-12 pb-8 px-6 relative"
      >
        <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center border border-white/25 mb-4 shadow-lg backdrop-blur-sm">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-white text-2xl font-black tracking-tight mb-1">CareGrid AI</h1>
        <p className="text-blue-200 text-xs text-center max-w-xs">National Health Mission · District Healthcare Operations Platform</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
          {['Gemini AI','Google Maps','Firebase','Offline-First'].map(t => (
            <span key={t} className="text-[10px] text-blue-300 bg-white/8 border border-white/15 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      </motion.div>

      <div className="flex-1 px-6 pb-8 relative">
        <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest text-center mb-4">Select your role to continue</p>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {ROLES.map((r, i) => (
            <motion.button key={r.title}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 + i*.07 }}
              whileTap={{ scale:.95 }} onClick={() => handleRole(r.action)}
              className="bg-white/8 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-left hover:bg-white/15 transition-all cursor-pointer"
            >
              <span className="text-2xl mb-2.5 block">{r.emoji}</span>
              <p className="text-white font-bold text-xs leading-tight">{r.title}</p>
              <p className="text-blue-200 text-[10px] mt-1 leading-relaxed">{r.subtitle}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.footer initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.6 }}
        className="text-center pb-6 px-6 relative"
      >
        <p className="text-blue-400 text-[10px]">Govt. of India · National Health Mission · Powered by Google Cloud</p>
      </motion.footer>

      <AnimatePresence>
        {showPatient && <PatientModal onClose={() => setShowPatient(false)} />}
      </AnimatePresence>
    </div>
  );
}
