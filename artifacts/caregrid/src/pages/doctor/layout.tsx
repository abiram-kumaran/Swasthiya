import { useState, useRef } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  LayoutDashboard, Users, Stethoscope, User, Fingerprint,
  CheckCircle, X, AlertCircle, ArrowLeft, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useDoctorStore, doctorActions, REGISTERED_DOCTORS } from '@/lib/doctorStore';
import DoctorDashboard from './dashboard';
import DoctorPatients from './patients';
import DoctorConsultation from './consultation';
import DoctorProfile from './profile';

/* ── OTP box ──────────────────────────────────────────────── */
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
          className={`w-11 text-center font-bold text-lg rounded-xl border-2 bg-white/10 text-white outline-none transition-all ${d ? 'border-green-400' : 'border-white/30 focus:border-white'}`}
          style={{ height: '3.25rem' }}
        />
      ))}
    </div>
  );
}

type LoginStep = 'nmc' | 'otp' | 'biometric' | 'error';

/* ── Doctor Login ─────────────────────────────────────────── */
function DoctorLogin() {
  const [step, setStep]       = useState<LoginStep>('nmc');
  const [nmc, setNmc]         = useState('');
  const [digits, setDigits]   = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [docName, setDocName] = useState('');

  function validateNMC() {
    if (!nmc.trim()) { toast.error('Enter your NMC Registration Number'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const result = doctorActions.validateNMC(nmc.trim());
      if (result === 'not_found') {
        setError(`NMC Number ${nmc.toUpperCase()} is not registered in this PHC's CareGrid system.`);
        setStep('error');
      } else {
        const created = doctorActions.createSession(nmc.trim());
        if (created) {
          const doc = REGISTERED_DOCTORS[nmc.trim().toUpperCase()];
          if (doc) setDocName(doc.name);
        }
        setStep('otp');
      }
    }, 1000);
  }

  function verifyOtp() {
    if (digits.join('').length < 6) { toast.error('Enter complete 6-digit OTP'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('biometric'); }, 800);
  }

  function verifyBiometric() {
    setLoading(true);
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(() => {
          setTimeout(() => {
            doctorActions.verifyBiometric();
            setLoading(false);
            toast.success('Identity verified. Welcome, Doctor.');
          }, 1600);
        });
    } else {
      setTimeout(() => {
        doctorActions.verifyBiometric();
        setLoading(false);
        toast.success('Identity verified.');
      }, 1600);
    }
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg,#0e4f6e 0%,#0c3d58 55%,#071f30 100%)' }}>
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mb-4">
          <Stethoscope className="w-7 h-7 text-cyan-300" />
        </div>
        <h1 className="text-white font-black text-xl tracking-tight">Doctor Portal</h1>
        <p className="text-cyan-300 text-xs mt-1">CareGrid AI · Clinical Workspace</p>
        <div className="flex items-center gap-2 mt-2">
          {['NMC Verified','Device Bound','WebAuthn'].map(b => (
            <span key={b} className="text-[9px] text-cyan-400 bg-cyan-900/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">{b}</span>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <AnimatePresence mode="wait">
          {step === 'nmc' && (
            <motion.div key="nmc" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }} className="w-full max-w-sm mx-auto">
              <h2 className="text-white font-black text-xl text-center mb-1">Doctor Login</h2>
              <p className="text-cyan-300 text-xs text-center mb-6">Enter your NMC Registration Number</p>
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 mb-4">
                <p className="text-[10px] text-cyan-300 font-semibold mb-1.5 uppercase tracking-wider">NMC Registration Number</p>
                <input value={nmc} onChange={e => setNmc(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && validateNMC()}
                  placeholder="e.g. TN-MC-34521"
                  className="w-full bg-transparent text-white placeholder-cyan-500 text-sm font-mono outline-none" />
              </div>
              <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-3 mb-5">
                <p className="text-[10px] text-cyan-400 font-semibold mb-1">Demo NMC numbers:</p>
                {Object.keys(REGISTERED_DOCTORS).map(id => {
                  const doc = REGISTERED_DOCTORS[id];
                  return (
                    <button key={id} onClick={() => setNmc(id)}
                      className="block text-[10px] text-left font-mono text-cyan-300 hover:text-white mb-0.5">
                      {id} — {doc.name} ({doc.phcName})
                    </button>
                  );
                })}
              </div>
              <motion.button whileTap={{ scale:0.97 }} onClick={validateNMC} disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {loading ? <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity,duration:1 }} className="w-5 h-5 border-2 border-cyan-300 border-t-white rounded-full" /> : 'Validate & Send OTP →'}
              </motion.button>
              <p className="text-cyan-600 text-[10px] text-center mt-3">Doctors must be pre-registered by the PHC administrator</p>
            </motion.div>
          )}
          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="w-full max-w-sm mx-auto text-center">
              <button onClick={() => setStep('nmc')} className="flex items-center gap-1 text-cyan-300 text-xs mb-4 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4"/> Back
              </button>
              <div className="w-12 h-12 bg-green-500/20 border border-green-400/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-400"/>
              </div>
              <p className="text-green-400 text-xs font-semibold mb-0.5">NMC Validated ✓</p>
              {docName && <p className="text-white font-bold text-base mt-1 mb-1">{docName}</p>}
              <p className="text-cyan-300 text-xs mb-6">OTP sent to your registered mobile · Enter any 6 digits</p>
              <OtpBox digits={digits} onChange={setDigits} />
              <motion.button whileTap={{ scale:0.97 }} onClick={verifyOtp} disabled={loading}
                className="w-full mt-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {loading ? <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity,duration:1 }} className="w-5 h-5 border-2 border-cyan-300 border-t-white rounded-full" /> : 'Verify OTP →'}
              </motion.button>
            </motion.div>
          )}
          {step === 'biometric' && (
            <motion.div key="bio" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="w-full max-w-sm mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400/30 flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="w-10 h-10 text-cyan-300"/>
              </div>
              <h2 className="text-white font-black text-xl mb-2">Verify Your Identity</h2>
              <p className="text-cyan-300 text-sm mb-1">Use your device biometrics</p>
              <p className="text-cyan-500 text-[10px] mb-6">Face ID · Touch ID · Fingerprint · Windows Hello</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {['Face ID','Touch ID','Fingerprint','Security Key'].map(m => (
                  <div key={m} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-cyan-400">{m}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5 text-left">
                <p className="text-[10px] text-cyan-300 font-semibold">🔒 Device-Bound Authentication</p>
                <p className="text-[10px] text-cyan-500 mt-0.5">This device will be registered as your trusted clinical device. Future logins will require both your NMC number and this device.</p>
              </div>
              <motion.button whileTap={{ scale:0.97 }} onClick={verifyBiometric} disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {loading ? <><motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity,duration:1 }} className="w-5 h-5 border-2 border-cyan-300 border-t-white rounded-full" /> Verifying…</> : <><Fingerprint className="w-5 h-5"/> Authenticate with Biometrics</>}
              </motion.button>
            </motion.div>
          )}
          {step === 'error' && (
            <motion.div key="err" initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} className="w-full max-w-sm mx-auto text-center">
              <div className="w-16 h-16 bg-red-500/20 border border-red-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400"/>
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Verification Failed</h2>
              <p className="text-red-300 text-sm mb-6 leading-relaxed">{error}</p>
              <button onClick={() => { setStep('nmc'); setNmc(''); setError(''); }}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors">
                <X className="w-4 h-4"/> Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="text-center pb-8 text-cyan-800 text-[10px]">NHM · Government of India · NMC-Verified Clinical Portal</p>
    </div>
  );
}

/* ── Bottom nav ───────────────────────────────────────────── */
const NAV_TABS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/doctor'              },
  { label: 'Patients',  icon: Users,           href: '/doctor/patients'     },
  { label: 'Consult',   icon: Stethoscope,     href: '/doctor/consultation' },
  { label: 'Profile',   icon: User,            href: '/doctor/profile'      },
];

function DoctorWorkspace() {
  const [location] = useLocation();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-[480px] mx-auto w-full flex flex-col min-h-screen relative">
        <main className="flex-1 overflow-y-auto pb-20">
          <Switch>
            <Route path="/doctor"               component={DoctorDashboard}    />
            <Route path="/doctor/patients"      component={DoctorPatients}     />
            <Route path="/doctor/consultation"  component={DoctorConsultation} />
            <Route path="/doctor/profile"       component={DoctorProfile}      />
          </Switch>
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 pb-safe">
          <div className="max-w-[480px] mx-auto flex">
            {NAV_TABS.map(({ label, icon: Icon, href }) => {
              const active = location === href || (href !== '/doctor' && location.startsWith(href));
              return (
                <Link key={href} href={href} className="flex-1">
                  <div className={`flex flex-col items-center gap-0.5 py-2 px-1 transition-all ${active ? 'text-cyan-600' : 'text-gray-400'}`}>
                    <div className={`w-9 h-7 flex items-center justify-center rounded-full ${active ? 'bg-cyan-100' : ''}`}>
                      <Icon className="w-4 h-4"/>
                    </div>
                    <span className="text-[10px] font-medium">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function DoctorLayout() {
  const { session } = useDoctorStore();
  if (!session?.biometricVerified) return <DoctorLogin />;
  return <DoctorWorkspace />;
}
