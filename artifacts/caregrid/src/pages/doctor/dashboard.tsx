import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, AlertTriangle, Calendar, FileText,
  Stethoscope, Zap, CheckCircle, ArrowRight, MapPin,
  Wifi, Camera, X, Play, Square, Shield, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { PATIENTS } from '@/lib/data';
import { useDoctorStore, doctorActions } from '@/lib/doctorStore';

/* ── PHC GPS coordinates (Peelamedu Urban PHC) ─────────── */
const PHC_LAT = 11.0251;
const PHC_LNG = 76.9972;
const PHC_WIFI_SSID_HINT = 'PHC-ALPHA-CLINICAL'; // simulated expected network

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ── Attendance Modal ────────────────────────────────────── */
type AttendStep = 'start' | 'gps' | 'wifi' | 'liveness' | 'face' | 'done' | 'failed';

interface AttendResult { gps: boolean; wifi: boolean; liveness: boolean; face: boolean; reason?: string }

function AttendanceModal({ mode, onClose, onSuccess }: {
  mode: 'start' | 'end'; onClose: () => void; onSuccess: () => void;
}) {
  const [step, setStep]       = useState<AttendStep>('start');
  const [results, setResults] = useState<Partial<AttendResult>>({});
  const [livenessAction, setLivenessAction] = useState('');
  const [countdown, setCountdown]           = useState(3);
  const videoRef = useRef<HTMLVideoElement>(null);

  const LIVENESS_ACTIONS = ['Blink twice', 'Turn head left', 'Turn head right', 'Smile'];

  function startChecks() {
    setStep('gps');
    // GPS check
    if (!navigator.geolocation) {
      simulateGPS();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const dist = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, PHC_LAT, PHC_LNG);
        // In dev, always pass (can't be physically at PHC)
        const pass = true; // dist <= 50 — in production: dist <= 50
        setResults(r => ({ ...r, gps: pass }));
        if (!pass) {
          setResults(r => ({ ...r, reason: `You are ${Math.round(dist)}m from the PHC. Must be within 50m.` }));
          setStep('failed');
        } else {
          setTimeout(() => checkWifi(), 600);
        }
      },
      () => simulateGPS(),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function simulateGPS() {
    setResults(r => ({ ...r, gps: true }));
    setTimeout(() => checkWifi(), 800);
  }

  function checkWifi() {
    setStep('wifi');
    // In production: check navigator.connection or local IP range
    // Simulated: check if online (any network) — in real app verify specific SSID/IP range
    const online = navigator.onLine;
    const wifiPass = online; // simulated pass
    setResults(r => ({ ...r, wifi: wifiPass }));
    if (!wifiPass) {
      setResults(r => ({ ...r, reason: `Device must be connected to ${PHC_WIFI_SSID_HINT} network.` }));
      setStep('failed');
    } else {
      setTimeout(() => startLiveness(), 600);
    }
  }

  function startLiveness() {
    setStep('liveness');
    const action = LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)];
    setLivenessAction(action);
    setCountdown(3);
    // Open camera
    navigator.mediaDevices?.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => {/* camera not available in all envs */});
    // Countdown then simulate pass
    let c = 3;
    const interval = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        // Stop camera
        if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
        setResults(r => ({ ...r, liveness: true }));
        setTimeout(() => doFaceMatch(), 600);
      }
    }, 1000);
  }

  function doFaceMatch() {
    setStep('face');
    setTimeout(() => {
      setResults(r => ({ ...r, face: true }));
      setStep('done');
    }, 1500);
  }

  function confirm() {
    if (mode === 'start') doctorActions.startDuty();
    else doctorActions.endDuty();
    onSuccess();
    onClose();
  }

  const stepLabel: Record<AttendStep, string> = {
    start: 'Attendance Verification', gps: 'Checking GPS Location…',
    wifi: 'Verifying Clinic Network…', liveness: 'AI Liveness Detection',
    face: 'Face Match Verification…', done: 'All Checks Passed ✓', failed: 'Verification Failed',
  };

  const checks = [
    { key: 'gps', label: 'GPS — Within 50m of PHC', done: results.gps },
    { key: 'wifi', label: 'Clinic Wi-Fi Connected', done: results.wifi },
    { key: 'liveness', label: 'AI Liveness Passed', done: results.liveness },
    { key: 'face', label: 'Face Match Verified', done: results.face },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y:80,opacity:0 }} animate={{ y:0,opacity:1 }} exit={{ y:80,opacity:0 }}
        transition={{ type:'spring',damping:28,stiffness:300 }}
        className="w-full max-w-sm bg-white rounded-t-3xl shadow-2xl pb-8">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <p className="font-bold text-sm text-gray-900">{stepLabel[step]}</p>
          {step !== 'gps' && step !== 'wifi' && step !== 'liveness' && step !== 'face' && (
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-500"/>
            </button>
          )}
        </div>
        <div className="px-5 pt-4">
          {step === 'start' && (
            <div className="space-y-4">
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3">
                <p className="text-xs font-bold text-cyan-800 mb-2">
                  {mode === 'start' ? '🟢 Mark Start of Duty' : '🔴 Mark End of Duty'}
                </p>
                <p className="text-[11px] text-cyan-600">The following checks will be performed:</p>
                <div className="space-y-1.5 mt-2">
                  {[['📍','GPS within 50m of PHC'],['📶','Clinic Wi-Fi network'],['👁️','AI Liveness detection'],['🤳','Face match verification']].map(([e,l]) => (
                    <div key={l} className="flex items-center gap-2 text-[11px] text-cyan-700">
                      <span>{e}</span>{l}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={startChecks}
                className={`w-full py-3.5 text-white text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 ${
                  mode === 'start' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                <Shield className="w-4 h-4"/> Begin Verification
              </button>
            </div>
          )}

          {(step === 'gps' || step === 'wifi' || step === 'face') && (
            <div className="space-y-3">
              <div className="space-y-2">
                {checks.map(c => (
                  <div key={c.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    c.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
                  }`}>
                    {c.done
                      ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0"/>
                      : <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity,duration:1 }}
                          className="w-4 h-4 border-2 border-gray-300 border-t-cyan-600 rounded-full shrink-0"/>}
                    <span className={`text-xs font-medium ${c.done ? 'text-green-700' : 'text-gray-500'}`}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'liveness' && (
            <div className="space-y-3 text-center">
              <div className="bg-gray-900 rounded-2xl overflow-hidden" style={{ height: 200 }}>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-800">AI Liveness Check</p>
                <p className="text-sm font-black text-amber-900 mt-1">{livenessAction}</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{countdown}</p>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-3">
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600"/>
                </div>
                <p className="font-bold text-gray-900">All Checks Passed</p>
                <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleTimeString('en-IN')}</p>
              </div>
              <div className="space-y-1.5">
                {checks.map(c => (
                  <div key={c.key} className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0"/> {c.label}
                  </div>
                ))}
              </div>
              <button onClick={confirm}
                className={`w-full py-3 text-white text-sm font-bold rounded-2xl mt-2 ${
                  mode === 'start' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {mode === 'start' ? '🟢 Confirm Start Duty' : '🔴 Confirm End Duty'}
              </button>
            </div>
          )}

          {step === 'failed' && (
            <div className="space-y-3 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-red-600"/>
              </div>
              <p className="font-bold text-gray-900">Verification Failed</p>
              <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3">{results.reason ?? 'Unable to verify location or identity.'}</p>
              <button onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl">
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Dashboard ───────────────────────────────────────────── */
const FOLLOW_UPS = [
  { name: 'Muthu Selvam',  time: '11:00 AM', type: 'BP Review',        priority: 'senior'   },
  { name: 'Kavitha Rajan', time: '12:30 PM', type: 'ANC Checkup',      priority: 'pregnant' },
  { name: 'Arjun Kumar',   time: '02:00 PM', type: 'Asthma Follow-up', priority: 'child'    },
];

const PRIORITY_COLOR: Record<string, string> = {
  emergency:'bg-red-100 text-red-700', senior:'bg-amber-100 text-amber-700',
  pregnant:'bg-pink-100 text-pink-700', child:'bg-blue-100 text-blue-700', normal:'bg-gray-100 text-gray-600',
};

export default function DoctorDashboard() {
  const { session, attendance, consultationCount } = useDoctorStore();
  const [showAttend, setShowAttend] = useState(false);
  const [attendMode, setAttendMode] = useState<'start'|'end'>('start');

  const isOnDuty   = attendance?.status === 'on_duty';
  const totalPts   = PATIENTS.length;
  const waitingPts = PATIENTS.filter(p => p.tokenNumber !== null).length;
  const emergency  = PATIENTS.filter(p => p.priority === 'emergency').length;
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const today      = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

  function openAttendance(mode: 'start'|'end') {
    setAttendMode(mode);
    setShowAttend(true);
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-700 to-cyan-900 text-white px-4 pt-5 pb-6 rounded-b-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-cyan-200 text-[11px]">{greeting}</p>
            <h1 className="text-base font-black">{session?.name ?? 'Doctor'}</h1>
            <p className="text-cyan-200 text-[11px] mt-0.5">{session?.phcName} · {session?.specialty}</p>
          </div>
          <div>
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isOnDuty ? 'bg-green-500/20 border-green-400/30 text-green-200' : 'bg-gray-500/20 border-gray-400/30 text-gray-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnDuty ? 'bg-green-300 blink' : 'bg-gray-400'}`}/>
              {isOnDuty ? 'On Duty' : 'Off Duty'}
            </span>
            <p className="text-[10px] text-cyan-400 mt-1 text-right">{today}</p>
          </div>
        </div>

        {/* Attendance buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => openAttendance('start')} disabled={isOnDuty}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              isOnDuty ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-900/30'
            }`}>
            <Play className="w-4 h-4"/> Start Duty
          </button>
          <button onClick={() => openAttendance('end')} disabled={!isOnDuty}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              !isOnDuty ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-900/30'
            }`}>
            <Square className="w-4 h-4"/> End Duty
          </button>
        </div>

        {isOnDuty && attendance?.startTime && (
          <div className="flex items-center gap-2 mt-2 bg-green-500/10 border border-green-400/20 rounded-lg px-3 py-1.5">
            <Activity className="w-3.5 h-3.5 text-green-300 shrink-0"/>
            <p className="text-[11px] text-green-200">
              On duty since <strong>{attendance.startTime}</strong> · GPS ✓ · Wi-Fi ✓ · Face ✓
            </p>
          </div>
        )}
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Today's Patients", value: totalPts,          icon: Users,         color: 'blue'  },
            { label: 'Waiting Now',      value: waitingPts,        icon: Clock,         color: 'amber' },
            { label: 'Emergency',        value: emergency,         icon: AlertTriangle, color: 'red'   },
            { label: 'Consultations',    value: consultationCount, icon: Stethoscope,   color: 'cyan'  },
          ].map((s, i) => {
            const Icon = s.icon;
            const cm: Record<string, string> = {
              blue:'bg-blue-50 text-blue-700 border-blue-100', amber:'bg-amber-50 text-amber-700 border-amber-100',
              red:'bg-red-50 text-red-700 border-red-100', cyan:'bg-cyan-50 text-cyan-700 border-cyan-100',
            };
            return (
              <motion.div key={s.label} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*.06 }}
                className={`rounded-xl p-3 ${cm[s.color]} border`}>
                <Icon className="w-4 h-4 mb-1.5 opacity-70"/>
                <p className="text-xl font-black leading-none">{s.value}</p>
                <p className="text-[10px] mt-0.5 opacity-80">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* AI Clinical Summary */}
        <div className="bg-gradient-to-r from-cyan-700 to-cyan-800 rounded-2xl p-3.5 text-white shadow-md">
          <div className="flex items-start gap-2.5 mb-2.5">
            <Zap className="w-4 h-4 shrink-0 mt-0.5"/>
            <div>
              <p className="text-[11px] font-bold">🤖 AI Clinical Summary</p>
              <p className="text-[11px] text-cyan-200 mt-0.5">{totalPts} patients · {waitingPts} waiting</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { text:'2 high-risk patients flagged (Hypertension + Diabetes)', bg:'bg-red-500/20 border-red-400/20' },
              { text:'Dengue cluster alert active in district — watch for fever+joint pain', bg:'bg-amber-500/20 border-amber-400/20' },
              { text:'Patient rush predicted 11:00 AM – 1:00 PM today', bg:'bg-white/10 border-white/15' },
            ].map((a, i) => (
              <div key={i} className={`${a.bg} border rounded-lg px-2.5 py-2`}>
                <p className="text-[11px] text-white">{a.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending lab reports */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><FileText className="w-3.5 h-3.5 text-teal-600"/>
              <p className="text-[10px] font-semibold text-gray-500 uppercase">Pending Lab</p>
            </div>
            <p className="text-2xl font-black text-gray-900">3</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Awaiting results</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><Calendar className="w-3.5 h-3.5 text-purple-600"/>
              <p className="text-[10px] font-semibold text-gray-500 uppercase">Follow-ups</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{FOLLOW_UPS.length}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Today's schedule</p>
          </div>
        </div>

        {/* Follow-ups */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-800">Today's Follow-ups</p>
            <Link href="/doctor/patients"><span className="text-[11px] text-cyan-600 font-semibold">View All →</span></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {FOLLOW_UPS.map(f => (
              <div key={f.name} className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-3.5 h-3.5 text-cyan-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{f.name}</p>
                  <p className="text-[10px] text-gray-400">{f.type} · {f.time}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[f.priority]}`}>{f.priority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-xs font-bold text-gray-800 mb-2.5">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label:'Start Consultation', href:'/doctor/consultation', color:'bg-cyan-50 text-cyan-700 border-cyan-200' },
              { label:'View Patient Queue',  href:'/doctor/patients',     color:'bg-blue-50 text-blue-700 border-blue-200'  },
              { label:'Lab Requests',        href:'/doctor/consultation', color:'bg-teal-50 text-teal-700 border-teal-200'  },
              { label:'Referrals',           href:'/doctor/consultation', color:'bg-purple-50 text-purple-700 border-purple-200' },
            ].map(a => (
              <Link key={a.label} href={a.href}>
                <button className={`w-full py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:brightness-95 ${a.color}`}>
                  {a.label}<ArrowRight className="w-3 h-3"/>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAttend && (
          <AttendanceModal mode={attendMode} onClose={() => setShowAttend(false)}
            onSuccess={() => {
              toast.success(attendMode === 'start' ? '🟢 Duty started. Synced to District Admin.' : '🔴 Duty ended. Summary sent.');
            }} />
        )}
      </AnimatePresence>
    </div>
  );
}
