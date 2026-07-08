/**
 * StaffLogin — Clinic Staff & Stock Handler.
 *
 * First-time on this device:  Register → enter name, username, password, facility → saved to AppDB
 * Returning user:             Login → username + password
 *
 * Sessions are stored per-role in localStorage so user stays logged in.
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertCircle, Eye, EyeOff, Building2, CreditCard,
  UserPlus, LogIn, ChevronRight,
} from 'lucide-react';
import { db_actions, type UserAccount } from './appDB';
import { staffAuthActions, type StaffRole } from './staffAuth';

function Spinner() {
  return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', right }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; right?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-600 px-3 py-2.5 rounded-xl text-sm outline-none focus:border-white/40 transition-all pr-9" />
      {right && <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  );
}

const FACILITIES = [
  { code: 'PHC-01', name: 'Peelamedu Urban PHC', district: 'Coimbatore' },
  { code: 'PHC-02', name: 'Singanallur Urban PHC', district: 'Coimbatore' },
  { code: 'PHC-03', name: 'Kalapatti PHC', district: 'Coimbatore' },
  { code: 'CHC-01', name: 'Peelamedu CHC', district: 'Coimbatore' },
  { code: 'PHC-04', name: 'Sowripalayam Urban PHC', district: 'Coimbatore' },
];

type Mode = 'choose' | 'register' | 'login' | 'error';

interface Props {
  role: StaffRole;
  accentColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const SESS_KEY: Record<StaffRole, string> = { staff: 'caregrid_staff_sess', stock: 'caregrid_stock_sess' };

export default function StaffLogin({ role, accentColor, icon, title, subtitle }: Props) {
  const [mode, setMode]   = useState<Mode>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Register form */
  const [rName, setRName]       = useState('');
  const [rUsername, setRUname]  = useState('');
  const [rPassword, setRPwd]    = useState('');
  const [rFacility, setRFac]    = useState('PHC-01');
  const [rDept, setRDept]       = useState('');
  const [rDesig, setRDesig]     = useState('');
  const [rPhone, setRPhone]     = useState('');
  const [showPwd1, setShow1]    = useState(false);

  /* Login form */
  const [lUsername, setLUname]  = useState('');
  const [lPassword, setLPwd]    = useState('');
  const [showPwd2, setShow2]    = useState(false);

  function persistSession(acc: UserAccount) {
    localStorage.setItem(SESS_KEY[role], JSON.stringify(acc));
    staffAuthActions.createSessionFromAccount(acc);
  }

  function handleRegister() {
    if (!rName.trim() || !rUsername.trim() || !rPassword.trim() || !rPhone.trim()) {
      toast.error('Fill in all required fields'); return;
    }
    if (rPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const fac = FACILITIES.find(f => f.code === rFacility)!;
      const result = db_actions.signup({
        role, username: rUsername.trim(), password: rPassword,
        name: rName.trim(), facility: fac.name, facilityCode: fac.code,
        district: fac.district, department: rDept.trim() || 'General',
        designation: rDesig.trim() || (role === 'staff' ? 'Staff Nurse' : 'Stock Handler'),
        phone: rPhone.trim(),
      });
      if (result === 'exists') {
        setError(`Username "${rUsername}" already exists. Please log in instead.`);
        setMode('error');
        return;
      }
      const acc = db_actions.findAccount(rUsername.trim(), role)!;
      persistSession(acc);
      toast.success(`Account created! Welcome, ${acc.name}`);
    }, 800);
  }

  function handleLogin() {
    if (!lUsername.trim() || !lPassword.trim()) {
      toast.error('Enter your username and password'); return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const acc = db_actions.login(lUsername.trim(), lPassword, role);
      if (!acc) {
        setError('Invalid username or password. Check your credentials and try again.');
        setMode('error');
        return;
      }
      persistSession(acc);
      toast.success(`Welcome back, ${acc.name}!`);
    }, 700);
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)' }}>
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-5 px-6">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center mb-4 shadow-lg`}>{icon}</div>
        <h1 className="text-white font-black text-xl tracking-tight">{title}</h1>
        <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <AnimatePresence mode="wait">

          {/* CHOOSE */}
          {mode === 'choose' && (
            <motion.div key="choose" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }}
              className="w-full max-w-sm mx-auto space-y-3">
              <h2 className="text-white font-black text-xl text-center mb-6">Welcome</h2>
              <button onClick={() => setMode('login')}
                className={`w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-between px-5 bg-gradient-to-r ${accentColor} shadow-lg`}>
                <div className="flex items-center gap-3"><LogIn className="w-5 h-5"/><span>Log In</span></div>
                <ChevronRight className="w-5 h-5 opacity-60"/>
              </button>
              <button onClick={() => setMode('register')}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-between px-5 bg-white/10 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-3"><UserPlus className="w-5 h-5"/><span>First Time? Create Account</span></div>
                <ChevronRight className="w-5 h-5 opacity-60"/>
              </button>
            </motion.div>
          )}

          {/* LOGIN */}
          {mode === 'login' && (
            <motion.div key="login" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}
              className="w-full max-w-sm mx-auto space-y-3">
              <button onClick={() => setMode('choose')} className="text-slate-400 text-xs hover:text-white mb-2">← Back</button>
              <h2 className="text-white font-black text-xl mb-4">Log In</h2>
              <Field label="Employee ID / Username">
                <TextInput value={lUsername} onChange={setLUname} placeholder="Your employee ID or chosen username"/>
              </Field>
              <Field label="Password">
                <TextInput value={lPassword} onChange={setLPwd} type={showPwd2 ? 'text' : 'password'}
                  placeholder="Your password"
                  right={<button onClick={() => setShow2(v => !v)} className="text-slate-400 hover:text-white">{showPwd2 ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>}/>
              </Field>
              <motion.button whileTap={{ scale:0.97 }} onClick={handleLogin} disabled={loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2 bg-gradient-to-r ${accentColor} mt-2`}>
                {loading ? <Spinner/> : 'Log In →'}
              </motion.button>
            </motion.div>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <motion.div key="register" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}
              className="w-full max-w-sm mx-auto">
              <button onClick={() => setMode('choose')} className="text-slate-400 text-xs hover:text-white mb-2">← Back</button>
              <h2 className="text-white font-black text-xl mb-4">Create Account</h2>
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 pb-2" style={{ scrollbarWidth:'none' }}>
                <Field label="Full Name *">
                  <TextInput value={rName} onChange={setRName} placeholder="e.g. Vijaya Lakshmi"/>
                </Field>
                <Field label="Employee ID / Username *">
                  <TextInput value={rUsername} onChange={setRUname} placeholder="e.g. CG-PHC01-N04"/>
                </Field>
                <Field label="Password *">
                  <TextInput value={rPassword} onChange={setRPwd} type={showPwd1 ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    right={<button onClick={() => setShow1(v => !v)} className="text-slate-400 hover:text-white">{showPwd1 ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>}/>
                </Field>
                <Field label="Phone Number *">
                  <TextInput value={rPhone} onChange={setRPhone} placeholder="+91 98765 43210" type="tel"/>
                </Field>
                <Field label="Assigned Facility *">
                  <select value={rFacility} onChange={e => setRFac(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-white/40"
                    style={{ background: 'rgba(15,23,42,0.8)' }}>
                    {FACILITIES.map(f => <option key={f.code} value={f.code}>{f.name}</option>)}
                  </select>
                </Field>
                <Field label="Department">
                  <TextInput value={rDept} onChange={setRDept} placeholder={role === 'staff' ? 'e.g. OPD & Emergency' : 'e.g. Pharmacy & Inventory'}/>
                </Field>
                <Field label="Designation">
                  <TextInput value={rDesig} onChange={setRDesig} placeholder={role === 'staff' ? 'e.g. Staff Nurse' : 'e.g. Stock Handler'}/>
                </Field>
              </div>
              <motion.button whileTap={{ scale:0.97 }} onClick={handleRegister} disabled={loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2 bg-gradient-to-r ${accentColor} mt-3`}>
                {loading ? <Spinner/> : '✓ Create Account & Enter'}
              </motion.button>
            </motion.div>
          )}

          {/* ERROR */}
          {mode === 'error' && (
            <motion.div key="err" initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }}
              className="w-full max-w-sm mx-auto text-center">
              <div className="w-16 h-16 bg-red-500/20 border border-red-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400"/>
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Failed</h2>
              <p className="text-red-300 text-sm mb-6 leading-relaxed">{error}</p>
              <button onClick={() => { setMode('choose'); setError(''); }}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors">
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
