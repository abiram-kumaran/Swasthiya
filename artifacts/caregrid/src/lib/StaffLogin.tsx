/** StaffLogin — Clinic Staff & Stock Handler. Flow: Employee ID → OTP → Confirm Facility */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, CheckCircle, Building2, CreditCard, Hash, Shield } from 'lucide-react';
import { staffAuthActions, type StaffRole, type StaffRecord, STAFF_REGISTRY } from './staffAuth';

function OtpBox({ digits, onChange }: { digits: string[]; onChange: (d: string[]) => void }) {
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
        <input key={i} ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handle(i, e.target.value)} onKeyDown={e => onKey(i, e)}
          className={`w-11 text-center font-black text-xl rounded-2xl border-2 bg-white/10 text-white outline-none transition-all ${d ? 'border-green-400 bg-green-500/20' : 'border-white/30 focus:border-white'}`}
          style={{ height: '3.25rem' }} />
      ))}
    </div>
  );
}

function Spinner() {
  return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />;
}

function maskPhone(p: string) { return p.slice(0, -4).replace(/\d/g, 'X') + p.slice(-4); }

type Step = 'empid' | 'otp' | 'confirm' | 'error';
const STEP_IDX: Record<Step, number> = { empid: 0, otp: 1, confirm: 2, error: 0 };

interface Props { role: StaffRole; accentColor: string; icon: React.ReactNode; title: string; subtitle: string; }

export default function StaffLogin({ role, accentColor, icon, title, subtitle }: Props) {
  const [step, setStep]         = useState<Step>('empid');
  const [empId, setEmpId]       = useState('');
  const [digits, setDigits]     = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [found, setFound]       = useState<StaffRecord | null>(null);
  const demos = STAFF_REGISTRY.filter(s => s.role === role);

  function validateEmpId() {
    if (!empId.trim()) { toast.error('Enter your Employee ID'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const rec = staffAuthActions.validateEmpId(empId.trim(), role);
      if (!rec) { setErrorMsg(`Employee ID "${empId.toUpperCase()}" not found. Contact your PHC administrator.`); setStep('error'); return; }
      setFound(rec);
      toast.success(`OTP sent to ${maskPhone(rec.phone)}`);
      setStep('otp');
    }, 900);
  }

  function verifyOtp() {
    if (digits.join('').length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('confirm'); }, 800);
  }

  function confirmAndLogin() {
    setLoading(true);
    setTimeout(() => { staffAuthActions.createSession(empId.trim(), role); setLoading(false); }, 600);
  }

  function reset() { setStep('empid'); setEmpId(''); setFound(null); setErrorMsg(''); setDigits(['','','','','','']); }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)' }}>
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-5 px-6">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center mb-4 shadow-lg`}>{icon}</div>
        <h1 className="text-white font-black text-xl tracking-tight">{title}</h1>
        <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mt-4">
          {['Emp ID', 'OTP', 'Confirm'].map((label, i) => {
            const idx = STEP_IDX[step];
            return (
              <div key={label} className="flex items-center gap-1">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${i === idx ? 'bg-white/15 text-white border-white/30' : i < idx ? 'bg-green-500/15 text-green-300 border-green-500/25' : 'text-slate-600 border-slate-700'}`}>
                  {i < idx ? '✓' : i + 1} {label}
                </div>
                {i < 2 && <span className="text-slate-700 text-[9px]">›</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <AnimatePresence mode="wait">

          {step === 'empid' && (
            <motion.div key="empid" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }} className="w-full max-w-sm mx-auto">
              <h2 className="text-white font-black text-xl text-center mb-1">Staff Login</h2>
              <p className="text-slate-400 text-xs text-center mb-6">Enter your government-issued Employee ID</p>
              <div className="bg-white/8 border border-white/15 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400"/>
                  <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Employee ID</p>
                </div>
                <input value={empId} onChange={e => setEmpId(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && validateEmpId()} placeholder="e.g. CG-PHC01-N04"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-600 px-3 py-2.5 rounded-xl text-sm font-mono outline-none focus:border-white/40 transition-all"/>
                <p className="text-[10px] text-slate-600 mt-1.5">Printed on your government staff ID card</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-5">
                <p className="text-[10px] text-slate-400 font-semibold mb-1.5">Demo IDs — {role === 'staff' ? 'Clinic Staff' : 'Stock Handler'}:</p>
                {demos.map(s => (
                  <button key={s.empId} onClick={() => setEmpId(s.empId)}
                    className="block w-full text-left text-[10px] font-mono text-slate-300 hover:text-white py-0.5 px-1 rounded hover:bg-white/5 transition-colors">
                    {s.empId} — {s.name}
                  </button>
                ))}
              </div>
              <motion.button whileTap={{ scale:0.97 }} onClick={validateEmpId} disabled={loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2 bg-gradient-to-r ${accentColor} shadow-lg`}>
                {loading ? <Spinner/> : 'Send OTP →'}
              </motion.button>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="w-full max-w-sm mx-auto text-center">
              <button onClick={() => setStep('empid')} className="flex items-center gap-1.5 text-slate-400 text-xs mb-4 hover:text-white transition-colors mx-auto">
                <ArrowLeft className="w-4 h-4"/> Back
              </button>
              <div className="w-14 h-14 bg-green-500/20 border border-green-400/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-400"/>
              </div>
              <p className="text-green-400 text-xs font-semibold mb-0.5">{found?.name}</p>
              <h2 className="text-white font-black text-xl mb-2">Enter OTP</h2>
              <p className="text-slate-400 text-xs mb-1">Sent to your registered number</p>
              <p className="text-white font-semibold text-sm mb-6">{found ? maskPhone(found.phone) : ''}</p>
              <OtpBox digits={digits} onChange={setDigits}/>
              <motion.button whileTap={{ scale:0.97 }} onClick={verifyOtp} disabled={loading || digits.join('').length < 6}
                className={`w-full mt-5 py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2 bg-gradient-to-r ${accentColor}`}>
                {loading ? <Spinner/> : 'Verify OTP →'}
              </motion.button>
              <button onClick={() => { toast.success('OTP resent'); setDigits(['','','','','','']); }}
                className="text-slate-400 text-[11px] mt-3 hover:text-white transition-colors block mx-auto">
                Didn't receive it? Resend OTP
              </button>
              <p className="text-slate-600 text-[10px] mt-1">Enter any 6 digits for demo</p>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="w-full max-w-sm mx-auto">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-green-500/20 border border-green-400/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-7 h-7 text-green-400"/>
                </div>
                <p className="text-green-400 text-xs font-bold">OTP Verified ✓</p>
                <h2 className="text-white font-black text-xl mt-1">Confirm Your Facility</h2>
                <p className="text-slate-400 text-xs mt-1">Review your assigned health centre</p>
              </div>
              <div className={`rounded-2xl p-4 mb-4 bg-gradient-to-br ${accentColor} shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-black text-white text-base shrink-0">
                    {found?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm">{found?.name}</p>
                    <p className="text-white/70 text-[11px]">{found?.designation}</p>
                    <p className="text-white/50 font-mono text-[10px] mt-0.5">{found?.empId}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/15 border border-white/20 px-2 py-1 rounded-full shrink-0">
                    <Shield className="w-3 h-3 text-white/70"/>
                    <span className="text-[9px] text-white/70 font-semibold">Verified</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/8 border border-white/15 rounded-2xl p-4 mb-4 space-y-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Health Centre</p>
                {([
                  [<Building2 className="w-3.5 h-3.5" key="f"/>,  'Facility',      found?.facility     ],
                  [<Hash className="w-3.5 h-3.5" key="c"/>,       'Facility Code', found?.facilityCode ],
                  [<CreditCard className="w-3.5 h-3.5" key="d"/>, 'Department',    found?.department   ],
                  [<Building2 className="w-3.5 h-3.5" key="di"/>, 'District',      found?.district     ],
                ] as [React.ReactNode, string, string | undefined][]).map(([ico, label, val]) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="text-slate-500 shrink-0">{ico}</span>
                    <div className="flex-1 flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">{label}</span>
                      <span className="text-white text-[11px] font-semibold">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
              <motion.button whileTap={{ scale:0.97 }} onClick={confirmAndLogin} disabled={loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2 bg-gradient-to-r ${accentColor} shadow-lg`}>
                {loading ? <Spinner/> : '✓ Enter Portal'}
              </motion.button>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div key="err" initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} className="w-full max-w-sm mx-auto text-center">
              <div className="w-16 h-16 bg-red-500/20 border border-red-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400"/>
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Login Failed</h2>
              <p className="text-red-300 text-sm mb-6 leading-relaxed">{errorMsg}</p>
              <button onClick={reset} className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors">
                ← Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <p className="text-center pb-8 text-slate-700 text-[10px]">NHM · Government of India · Secure Staff Portal</p>
    </div>
  );
}
