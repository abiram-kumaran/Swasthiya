import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, ArrowLeft, X, Plus, Trash2, User, Heart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { savePatient, getPatient, type PatientProfile } from '@/lib/patientStore';

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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const COMMON_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'Arthritis', 'Anaemia', 'Other'];
const COMMON_ALLERGIES = ['Penicillin', 'Aspirin', 'Sulpha', 'Ibuprofen', 'Latex', 'Pollen', 'Dust', 'Other'];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/80 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 px-3 py-2.5 rounded-xl text-sm outline-none focus:border-white/50 focus:bg-white/15 transition-all"
    />
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-white/10 border border-white/20 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-white/50 appearance-none"
      style={{ background: 'rgba(255,255,255,0.1)' }}
    >
      <option value="" style={{ background: '#0B4F8B' }}>Select…</option>
      {options.map(o => <option key={o} value={o} style={{ background: '#0B4F8B' }}>{o}</option>)}
    </select>
  );
}

function TagSelector({ label, selected, options, onToggle }: {
  label: string; selected: string[]; options: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-white/80 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button key={o} type="button" onClick={() => onToggle(o)}
            className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${
              selected.includes(o)
                ? 'bg-white text-blue-700 border-white'
                : 'bg-white/10 text-white border-white/20 hover:border-white/40'
            }`}
          >
            {selected.includes(o) ? '✓ ' : ''}{o}
          </button>
        ))}
      </div>
    </div>
  );
}

type ModalStep = 'phone' | 'otp' | 'personal' | 'health';

function PatientModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<ModalStep>(() => getPatient() ? 'phone' : 'phone');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [, navigate] = useLocation();

  // Personal details
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<PatientProfile['gender']>('Male');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [abhaId, setAbhaId] = useState('');

  // Health details
  const [bloodGroup, setBloodGroup] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const sendOtp = () => {
    if (phone.length < 10) { toast.error('Enter valid 10-digit number'); return; }
    setSending(true);
    setTimeout(() => { setSending(false); setStep('otp'); }, 800);
  };

  const verifyOtp = () => {
    if (digits.join('').length < 6) { toast.error('Enter 6-digit OTP'); return; }
    setVerified(true);
    setTimeout(() => {
      const existing = getPatient();
      if (existing && existing.phone === phone) {
        // Returning user — go straight in
        navigate('/patient/home');
      } else {
        // New user — go to registration
        setStep('personal');
        setVerified(false);
      }
    }, 800);
  };

  const submitPersonal = () => {
    if (!name.trim()) { toast.error('Please enter your full name'); return; }
    if (!dob) { toast.error('Please enter your date of birth'); return; }
    if (!district.trim()) { toast.error('Please enter your district'); return; }
    setStep('health');
  };

  const submitHealth = () => {
    if (!bloodGroup) { toast.error('Please select your blood group'); return; }
    const profile: PatientProfile = {
      phone,
      name: name.trim(),
      abhaId: abhaId.trim() || `14-${phone.slice(0,4)}-${phone.slice(4,8)}-${phone.slice(8)}`,
      dob,
      gender,
      bloodGroup,
      weight: weight || '—',
      height: height || '—',
      village: village.trim(),
      district: district.trim(),
      pincode: pincode.trim(),
      conditions,
      allergies,
      currentMedications: medications.split(',').map(s => s.trim()).filter(Boolean),
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      language: 'English',
      notifications: true,
      registeredAt: new Date().toISOString(),
    };
    savePatient(profile);
    toast.success('Profile created successfully!');
    navigate('/patient/home');
  };

  const toggleTag = (list: string[], setter: (v: string[]) => void, val: string) => {
    setter(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  };

  const stepLabels: Record<ModalStep, string> = {
    phone: 'Patient Login',
    otp: 'Verify Phone',
    personal: 'Personal Details',
    health: 'Health Details',
  };

  const stepIcons: Record<ModalStep, React.ReactNode> = {
    phone: null,
    otp: null,
    personal: <User className="w-4 h-4" />,
    health: <Heart className="w-4 h-4" />,
  };

  const canGoBack = step === 'otp' || step === 'health';
  const goBack = () => {
    if (step === 'otp') { setStep('phone'); setDigits(['','','','','','']); }
    if (step === 'health') setStep('personal');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'linear-gradient(135deg,#0B6CBB 0%,#084e8a 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <button onClick={canGoBack ? goBack : onClose} className="text-white/60 hover:text-white">
            {canGoBack ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            {stepIcons[step]}
            <p className="text-white font-bold text-sm">{stepLabels[step]}</p>
          </div>
          <div className="w-5" />
        </div>

        {/* Progress dots for registration */}
        {(step === 'personal' || step === 'health') && (
          <div className="flex justify-center gap-2 pb-3 shrink-0">
            {(['personal', 'health'] as ModalStep[]).map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-6 bg-white' : 'w-3 bg-white/30'}`} />
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-5 pb-5">
          <AnimatePresence mode="wait">

            {/* PHONE */}
            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-blue-200 text-xs text-center mb-4">Enter your mobile number to continue</p>
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
                <p className="text-center text-blue-300 text-[11px] mt-3">New user? We'll guide you through setup.</p>
              </motion.div>
            )}

            {/* OTP */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-blue-200 text-xs text-center mb-4">Enter the code sent to <span className="text-white font-bold">+91 {phone}</span></p>
                <div className="mb-5"><OtpBox digits={digits} onChange={setDigits} verified={verified} /></div>
                {verified && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-green-300 mb-3 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Verified!
                  </motion.div>
                )}
                <motion.button whileTap={{ scale: 0.97 }} onClick={verifyOtp} disabled={verified}
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

            {/* PERSONAL DETAILS */}
            {step === 'personal' && (
              <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-blue-200 text-xs text-center mb-2">Let's set up your health profile</p>
                <Field label="Full Name" required>
                  <TextInput value={name} onChange={setName} placeholder="e.g. Muthu Selvam" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Date of Birth" required>
                    <TextInput value={dob} onChange={setDob} type="date" />
                  </Field>
                  <Field label="Gender" required>
                    <SelectInput value={gender} onChange={v => setGender(v as PatientProfile['gender'])} options={['Male', 'Female', 'Other']} />
                  </Field>
                </div>
                <Field label="ABHA ID (if available)">
                  <TextInput value={abhaId} onChange={setAbhaId} placeholder="14-XXXX-XXXX-XXXX" />
                </Field>
                <Field label="Village / Area">
                  <TextInput value={village} onChange={setVillage} placeholder="e.g. Kalapatti" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="District" required>
                    <TextInput value={district} onChange={setDistrict} placeholder="e.g. Coimbatore" />
                  </Field>
                  <Field label="Pincode">
                    <TextInput value={pincode} onChange={setPincode} placeholder="641004" type="tel" />
                  </Field>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={submitPersonal}
                  className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors mt-2"
                >
                  Next: Health Details →
                </motion.button>
              </motion.div>
            )}

            {/* HEALTH DETAILS */}
            {step === 'health' && (
              <motion.div key="health" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-blue-200 text-xs text-center mb-2">This helps AI give you personalised health advice</p>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Blood Group" required>
                    <SelectInput value={bloodGroup} onChange={setBloodGroup} options={BLOOD_GROUPS} />
                  </Field>
                  <Field label="Weight">
                    <TextInput value={weight} onChange={setWeight} placeholder="65 kg" />
                  </Field>
                  <Field label="Height">
                    <TextInput value={height} onChange={setHeight} placeholder="170 cm" />
                  </Field>
                </div>
                <TagSelector
                  label="Existing Health Conditions"
                  selected={conditions}
                  options={COMMON_CONDITIONS}
                  onToggle={v => toggleTag(conditions, setConditions, v)}
                />
                <TagSelector
                  label="Known Allergies"
                  selected={allergies}
                  options={COMMON_ALLERGIES}
                  onToggle={v => toggleTag(allergies, setAllergies, v)}
                />
                <Field label="Current Medications (comma separated)">
                  <TextInput value={medications} onChange={setMedications} placeholder="e.g. Metformin, Amlodipine" />
                </Field>
                <div className="bg-white/10 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-white/80">Emergency Contact</p>
                  <TextInput value={emergencyName} onChange={setEmergencyName} placeholder="Contact Name" />
                  <TextInput value={emergencyPhone} onChange={setEmergencyPhone} placeholder="Phone Number" type="tel" />
                </div>
                <div className="bg-blue-900/30 border border-blue-400/20 rounded-xl p-2.5 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-300 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-200">Your health data is stored only on this device and is never shared without your consent.</p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={submitHealth}
                  className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors"
                >
                  Create Health Profile ✓
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

const ROLES = [
  {
    emoji: '🏥',
    title: 'Patient',
    subtitle: 'Book tokens, find health centres, AI triage',
    action: 'patient',
    color: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-400/30',
  },
  {
    emoji: '📦',
    title: 'Stock Handler',
    subtitle: 'Manage medicine inventory, transfers & audits',
    action: 'stock',
    color: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-400/30',
  },
  {
    emoji: '🩺',
    title: 'Clinic Staff',
    subtitle: 'Manage patients, inventory & attendance',
    action: 'staff',
    color: 'from-violet-500/20 to-violet-600/10',
    border: 'border-violet-400/30',
  },
  {
    emoji: '👨‍⚕️',
    title: 'Doctor',
    subtitle: 'Consult patients, prescriptions & AI assist',
    action: 'doctor',
    color: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-400/30',
  },
  {
    emoji: '🏛️',
    title: 'District Admin',
    subtitle: 'District-wide analytics & AI command',
    action: 'admin',
    color: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-400/30',
  },
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
        className="flex flex-col items-center pt-10 pb-6 px-6 relative"
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

      <div className="flex-1 px-5 pb-8 relative">
        <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest text-center mb-4">Select your role to continue</p>

        {/* First row: Patient (full width) */}
        <div className="max-w-sm mx-auto space-y-2.5">
          {ROLES.map((r, i) => (
            <motion.button key={r.title}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15 + i*.06 }}
              whileTap={{ scale:.97 }} onClick={() => handleRole(r.action)}
              className={`w-full bg-gradient-to-r ${r.color} backdrop-blur-sm border ${r.border} rounded-2xl p-4 text-left hover:brightness-110 transition-all cursor-pointer flex items-center gap-4`}
            >
              <span className="text-3xl shrink-0">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">{r.title}</p>
                <p className="text-blue-200 text-[11px] mt-0.5 leading-relaxed">{r.subtitle}</p>
              </div>
              <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.footer initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.7 }}
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
