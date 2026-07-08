import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Plus, X, Phone, MapPin, AlertCircle,
  User, ArrowLeft, Check, Mic, ChevronRight,
  Users, Clock, Volume2, SkipForward, RefreshCw,
} from 'lucide-react';
import { db_actions, useAppDB } from '@/lib/appDB';
import { useStaffSession } from '@/lib/staffAuth';
import type { PatientEntry } from '@/lib/appDB';

/* ── Priority config ─────────────────────────────────────── */
const P_STYLE: Record<PatientEntry['priority'], { badge: string; token: string; order: number; label: string }> = {
  emergency: { badge:'bg-red-100 text-red-700 border-red-200',       token:'bg-red-500',    order:0, label:'Emergency' },
  senior:    { badge:'bg-orange-100 text-orange-700 border-orange-200', token:'bg-orange-400', order:1, label:'Senior'    },
  pregnant:  { badge:'bg-purple-100 text-purple-700 border-purple-200', token:'bg-purple-500', order:2, label:'Pregnant'  },
  child:     { badge:'bg-blue-100 text-blue-700 border-blue-200',     token:'bg-blue-500',   order:3, label:'Child'     },
  normal:    { badge:'bg-gray-100 text-gray-600 border-gray-200',     token:'bg-gray-400',   order:4, label:'Normal'    },
};

/* ── Register modal ──────────────────────────────────────── */
function RegisterModal({ onClose, facilityCode, registeredBy }: {
  onClose: () => void; facilityCode: string; registeredBy: string;
}) {
  const [name,     setName]     = useState('');
  const [age,      setAge]      = useState('');
  const [phone,    setPhone]    = useState('');
  const [village,  setVillage]  = useState('');
  const [gender,   setGender]   = useState<'M'|'F'>('M');
  const [priority, setPriority] = useState<PatientEntry['priority']>('normal');
  const [symptoms, setSymptoms] = useState('');
  const [recording, setRecording] = useState(false);

  function submit() {
    if (!name.trim()) { toast.error('Patient name is required'); return; }
    if (!age || isNaN(Number(age))) { toast.error('Valid age is required'); return; }
    // Write directly to appDB — visible to Doctor and Admin immediately
    const entry = db_actions.registerPatient({
      name: name.trim(),
      age: Number(age),
      gender,
      phone: phone.trim() || '—',
      village: village.trim() || '—',
      conditions: symptoms.trim() ? [symptoms.trim()] : [],
      priority,
      facilityCode,
      registeredBy,
    });
    toast.success(`Token #${entry.tokenNumber} assigned — ${name.trim()}`, { description: `Priority: ${priority}` });
    onClose();
  }

  function toggleRecord() {
    setRecording(r => !r);
    if (!recording) {
      setTimeout(() => {
        setSymptoms('Fever for 3 days, mild cough, body ache');
        setRecording(false);
        toast.success('Voice input captured');
      }, 2000);
    }
  }

  return (
    <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
      transition={{ type:'tween', ease:'easeInOut', duration:0.3 }}
      className="fixed inset-x-0 bottom-0 z-50 max-w-[480px] mx-auto bg-white rounded-t-2xl shadow-2xl">
      <div className="px-4 pt-4 pb-2 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900">Register New Patient</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-4 h-4 text-gray-500"/></button>
      </div>
      <div className="px-4 py-4 space-y-3 max-h-[75vh] overflow-y-auto pb-8">
        {[
          { label:'Full Name *',  value:name,    setter:setName,    placeholder:'Patient full name',   type:'text'   },
          { label:'Age *',        value:age,     setter:setAge,     placeholder:'Age in years',        type:'number' },
          { label:'Phone',        value:phone,   setter:setPhone,   placeholder:'+91 XXXXX XXXXX',     type:'tel'    },
          { label:'Village/Area', value:village, setter:setVillage, placeholder:'Village or locality', type:'text'   },
        ].map(f => (
          <div key={f.label}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
            <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)}
              placeholder={f.placeholder}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        ))}

        {/* Gender */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Gender</label>
          <div className="flex gap-2 mt-1">
            {(['M','F','Other'] as const).map(g => (
              <button key={g} onClick={() => setGender(g as 'M'|'F'|'Other')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${gender===g?'bg-blue-600 text-white border-blue-600':'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(Object.keys(P_STYLE) as Patient['priority'][]).map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize transition-all ${priority===p?'ring-2 ring-blue-500 '+P_STYLE[p].badge:P_STYLE[p].badge+' opacity-60'}`}>
                {P_STYLE[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms + voice */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Chief Complaint / Symptoms</label>
          <div className="flex gap-2 mt-1">
            <input value={symptoms} onChange={e => setSymptoms(e.target.value)}
              placeholder="e.g. Fever, cough for 3 days..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <button onClick={toggleRecord}
              className={`px-3 py-2 rounded-xl border transition-colors ${recording?'bg-red-500 text-white border-red-500 animate-pulse':'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}>
              <Mic className="w-4 h-4"/>
            </button>
          </div>
          {recording && <p className="text-[10px] text-red-500 mt-1 animate-pulse">🎤 Recording… speak clearly</p>}
        </div>

        <button onClick={submit}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4"/> Register & Assign Token
        </button>
      </div>
    </motion.div>
  );
}

/* ── Patient detail sheet ────────────────────────────────── */
function PatientSheet({ patient, onClose }: { patient: PatientEntry; onClose: () => void }) {
  return (
    <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
      transition={{ type:'tween', ease:'easeInOut', duration:0.26 }}
      className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto max-w-[480px] mx-auto">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <button onClick={onClose} className="flex items-center gap-1.5 text-blue-200 text-xs mb-3 hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5"/> Back to Queue
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-white text-base">
            {patient.name.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">{patient.name}</h2>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${P_STYLE[patient.priority].badge}`}>{P_STYLE[patient.priority].label}</span>
            </div>
            <p className="text-blue-200 text-[11px]">{patient.age}y · {patient.gender==='M'?'Male':'Female'}</p>
          </div>
        </div>
      </div>
      <div className="px-4 pt-4 pb-6 space-y-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Contact</p>
          <div className="space-y-1.5 text-xs text-gray-700">
            <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400"/>{patient.phone}</div>
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400"/>{patient.village}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Chief Complaint</p>
          {patient.conditions.length > 0
            ? <div className="flex flex-wrap gap-1.5">{patient.conditions.map(c => <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full border border-blue-100">{c}</span>)}</div>
            : <p className="text-xs text-gray-400">Not recorded</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Token Info</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-[9px] text-gray-400">Token</p><p className="font-bold text-gray-800">#{patient.tokenNumber}</p></div>
            <div><p className="text-[9px] text-gray-400">Status</p><p className="font-bold text-gray-800 capitalize">{patient.status}</p></div>
            <div><p className="text-[9px] text-gray-400">Registered</p><p className="font-semibold text-gray-700">{new Date(patient.registeredAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p></div>
            <div><p className="text-[9px] text-gray-400">Priority</p><p className="font-semibold text-gray-700 capitalize">{patient.priority}</p></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Queue card ──────────────────────────────────────────── */
function QueueCard({ patient, pos, onCall, onSkip, onDone, onView }: {
  patient: PatientEntry; pos: number;
  onCall: () => void; onSkip: () => void; onDone: () => void; onView: () => void;
}) {
  const ps = P_STYLE[patient.priority];
  const isCalled = patient.status === 'called';

  return (
    <motion.div layout initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,x:-60,scale:0.96 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isCalled?'border-blue-300 shadow-blue-100':'border-gray-100'}`}>
      {isCalled && <div className="h-0.5 bg-blue-500 w-full animate-pulse"/>}
      <div className="flex items-center gap-3 p-3">
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[9px] text-gray-400 font-semibold">#{pos + 1}</span>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mt-0.5 ${ps.token}`}>
            <span className="text-white text-[11px] font-black">#{patient.tokenNumber}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-bold text-gray-900">{patient.name}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${ps.badge}`}>{ps.label}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{patient.age}y · {patient.gender==='M'?'M':'F'} · {patient.village}</p>
          {patient.conditions.length > 0 && (
            <p className="text-[10px] text-gray-600 mt-0.5 font-medium truncate">{patient.conditions.join(', ')}</p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-2.5 h-2.5 text-gray-300"/>
            <span className="text-[9px] text-gray-400">{new Date(patient.registeredAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
            {isCalled && <span className="text-[9px] text-blue-600 font-bold ml-1">📢 CALLED</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button onClick={onCall}
            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-colors ${isCalled?'bg-green-600 text-white hover:bg-green-700':'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {isCalled ? <><Check className="w-3 h-3"/>Done</> : <><Volume2 className="w-3 h-3"/>Call</>}
          </button>
          {isCalled
            ? <button onClick={onDone} className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200">Done</button>
            : <button onClick={onSkip} className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"><SkipForward className="w-3 h-3"/>Skip</button>}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page — reads/writes appDB ──────────────────────── */
export default function FrontlinePatients() {
  const appDB   = useAppDB();
  const session = useStaffSession('staff');
  const [search, setSearch]             = useState('');
  const [tab, setTab]                   = useState<'waiting'|'called'|'done'>('waiting');
  const [showRegister, setShowRegister] = useState(false);
  const [detail, setDetail]             = useState<PatientEntry | null>(null);
  const [online, setOnline]             = useState(navigator.onLine);

  const facilityCode  = session?.facilityCode ?? '';
  const registeredBy  = session?.empId ?? 'staff';
  const today         = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // All patients from appDB for this facility today
  const todayPatients = appDB.patients
    .filter(p => p.facilityCode === facilityCode && p.registeredAt.startsWith(today))
    .sort((a, b) => P_STYLE[a.priority].order - P_STYLE[b.priority].order);

  const waiting = todayPatients.filter(p => p.status === 'waiting');
  const called  = todayPatients.filter(p => p.status === 'called' || p.status === 'consulting');
  const done    = todayPatients.filter(p => p.status === 'done' || p.status === 'skipped');

  const searchFilter = (list: PatientEntry[]) =>
    list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || String(p.tokenNumber).includes(search));

  const activeList = tab === 'waiting' ? searchFilter(waiting)
    : tab === 'called' ? searchFilter(called)
    : searchFilter(done);

  function callPatient(id: string) {
    const pt = appDB.patients.find(p => p.id === id);
    if (!pt) return;
    const newStatus = pt.status === 'called' ? 'consulting' : 'called';
    db_actions.updatePatientStatus(id, newStatus);
    if (pt.status !== 'called') toast.success(`📢 Calling Token #${pt.tokenNumber} — ${pt.name}`);
    else toast.success(`✅ ${pt.name} — consultation started`);
  }

  function skipPatient(id: string) {
    const pt = appDB.patients.find(p => p.id === id);
    db_actions.updatePatientStatus(id, 'skipped');
    toast.info(`Token #${pt?.tokenNumber} skipped`);
  }

  function donePatient(id: string) {
    const pt = appDB.patients.find(p => p.id === id);
    db_actions.updatePatientStatus(id, 'done');
    toast.success(`${pt?.name} — consultation complete`);
  }

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold">Patient Queue</h1>
            {waiting.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{waiting.length} waiting</span>}
            {!online && <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Offline</span>}
          </div>
          <button onClick={() => setShowRegister(true)}
            className="flex items-center gap-1.5 bg-white/15 border border-white/30 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl">
            <Plus className="w-3.5 h-3.5"/> Register
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-300"/>
          <input type="text" placeholder="Search by name or token…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/15 border border-white/20 text-white placeholder:text-blue-300 text-xs rounded-xl pl-8 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-white/50"/>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ label:'Waiting',value:waiting.length,color:'text-white'},{ label:'Called',value:called.length,color:'text-blue-200'},{ label:'Done',value:done.length,color:'text-green-300'}].map(s => (
            <div key={s.label} className="bg-white/10 border border-white/15 rounded-xl p-2 text-center">
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-blue-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* Priority legend */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth:'none' }}>
          {(Object.entries(P_STYLE) as [PatientEntry['priority'], typeof P_STYLE[PatientEntry['priority']]][]).map(([k,v]) => (
            <span key={k} className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${v.badge}`}>{v.label}</span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['waiting','called','done'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab===t?'bg-white text-blue-700 shadow-sm':'text-gray-500'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Queue list */}
        <AnimatePresence mode="popLayout">
          {activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
              <p className="text-sm font-semibold text-gray-400">
                {tab === 'waiting' ? 'No patients waiting' : tab === 'called' ? 'No active calls' : 'No completed visits yet'}
              </p>
              {tab === 'waiting' && <button onClick={() => setShowRegister(true)} className="mt-3 text-xs text-blue-600 font-semibold underline">Register a patient</button>}
            </div>
          ) : (
            <div className="space-y-2">
              {activeList.map((pt, i) => (
                <QueueCard key={pt.id} patient={pt} pos={i}
                  onCall={() => callPatient(pt.id)}
                  onSkip={() => skipPatient(pt.id)}
                  onDone={() => donePatient(pt.id)}
                  onView={() => setDetail(pt)}/>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {detail && <PatientSheet patient={detail} onClose={() => setDetail(null)}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showRegister && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:0.5 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setShowRegister(false)}/>
            <RegisterModal onClose={() => setShowRegister(false)} facilityCode={facilityCode} registeredBy={registeredBy}/>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

