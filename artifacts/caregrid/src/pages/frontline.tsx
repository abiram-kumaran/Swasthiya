import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  useListInventory, useScanInventory,
  useListLogs, useProcessVoiceLog,
  useListAttendance, useLogAttendance,
} from '@workspace/api-client-react';
import {
  PackageSearch, Mic, ClipboardCheck, Camera,
  CheckCircle2, Clock, MapPin, Package, AlertTriangle,
  ArrowLeft, Wifi, WifiOff, Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type Tab = 'inventory' | 'voice' | 'attendance';

/* ─── Bottom Nav Button ──────────────────────────────────── */
function NavBtn({ active, icon, label, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-colors ${
        active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {active && (
        <motion.div layoutId="tab-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-blue-600 rounded-full" />
      )}
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-blue-50' : ''}`}>
        {React.cloneElement(icon as React.ReactElement<{ strokeWidth?: number }>, {
          strokeWidth: active ? 2.5 : 1.8,
        })}
      </div>
      <span className={`text-[9px] font-extrabold uppercase tracking-widest ${
        active ? 'text-blue-600' : 'text-gray-400'
      }`}>{label}</span>
    </button>
  );
}

/* ─── Inventory Tab ───────────────────────────────────────── */
function InventoryTab({ centerId }: { centerId: number }) {
  const { data: inventory, refetch } = useListInventory(
    { centerId }, { query: { queryKey: ['inventory', centerId] } }
  );
  const scanInventory = useScanInventory();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<'idle' | 'scanning' | 'detected' | 'done'>('idle');
  const [scanResult, setScanResult] = useState('');

  const handleScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStage('scanning');
    setScanResult('');

    setTimeout(() => {
      setScanStage('detected');
      setScanResult('Paracetamol 500mg · 1,000 units detected');
      scanInventory.mutate({ data: { centerId, imageText: 'Paracetamol 500mg 1000' } }, {
        onSuccess: () => {
          setScanStage('done');
          setTimeout(() => {
            setIsScanning(false);
            setScanStage('idle');
            setScanResult('');
            refetch();
          }, 2400);
        },
      });
    }, 1600);
  };

  const statusStyle = (s: string) => {
    if (s === 'critical') return { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700 border-red-200', icon: <AlertTriangle className="w-4 h-4" /> };
    if (s === 'low')      return { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle className="w-4 h-4" /> };
    if (s === 'surplus')  return { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Package className="w-4 h-4" /> };
    return { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Package className="w-4 h-4" /> };
  };

  return (
    <motion.div key="inv" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="p-5 flex flex-col gap-5"
    >
      {/* OCR Scanner Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4">
        <div className="text-center">
          <h2 className="font-extrabold text-gray-900 text-base">Zero-Type Inventory Scan</h2>
          <p className="text-xs text-gray-400 mt-0.5">Point at medicine strip or register label</p>
        </div>

        {/* Big scan button */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleScan}
            disabled={isScanning}
            className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
              scanStage === 'done' ? 'bg-emerald-500' :
              isScanning ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {scanStage === 'done'
              ? <CheckCircle2 className="w-12 h-12" />
              : <Camera className="w-12 h-12" />
            }
          </motion.button>
          {isScanning && scanStage !== 'done' && (
            <motion.div className="absolute inset-0 border-4 border-blue-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
            />
          )}
        </div>

        <AnimatePresence>
          {scanStage === 'scanning' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs font-bold text-blue-600 uppercase tracking-widest"
            >
              Scanning…
            </motion.p>
          )}
          {(scanStage === 'detected' || scanStage === 'done') && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl border font-semibold text-sm ${
                scanStage === 'done'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {scanResult}
            </motion.div>
          )}
          {scanStage === 'idle' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-gray-400"
            >
              Tap to scan
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Stock List */}
      <div>
        <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-1">Current Stock — PHC Alpha</h3>
        <div className="flex flex-col gap-2.5">
          {inventory?.map(item => {
            const style = statusStyle(item.status);
            return (
              <div key={item.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border bg-white shadow-sm ${
                  item.status === 'critical' ? 'border-red-200' : 'border-gray-100'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${style.bg} ${style.text}`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{item.medicineName}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.quantity.toLocaleString()} units
                    {item.daysRemaining != null && ` · ${Math.round(item.daysRemaining)}d left`}
                  </p>
                </div>
                <Badge className={`text-[9px] font-bold uppercase border ${style.badge}`}>
                  {item.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Voice Log Tab ───────────────────────────────────────── */
function VoiceLogTab({ centerId }: { centerId: number }) {
  const [stage, setStage] = useState<'idle' | 'recording' | 'processing' | 'done'>('idle');
  const processLog = useProcessVoiceLog();

  const simulatedTranscript = 'आज 150 मरीज़ आए। Paracetamol स्टॉक खत्म हो रहा है।';
  const [transcript, setTranscript] = useState('');

  const handleToggle = () => {
    if (stage === 'idle') {
      setStage('recording');
      setTranscript('');
    } else if (stage === 'recording') {
      setStage('processing');
      setTranscript(simulatedTranscript);
      processLog.mutate({
        data: { centerId, transcript: 'We had 150 patients today. Paracetamol stock is running low.' }
      }, {
        onSuccess: () => {
          setStage('done');
          setTimeout(() => {
            setStage('idle');
            setTranscript('');
          }, 4000);
        }
      });
    }
  };

  const stageLabel: Record<typeof stage, string> = {
    idle: 'Tap to start recording',
    recording: 'Recording… tap to stop',
    processing: 'AI parsing your report…',
    done: 'Report saved successfully!',
  };

  return (
    <motion.div key="voice" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="p-5 flex flex-col h-full"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="font-extrabold text-gray-900 text-base">Multilingual Voice Log</h2>
          <p className="text-xs text-gray-400 mt-1">Speak in Hindi or English — AI will parse patients, medicines & alerts automatically</p>
        </div>

        {/* Big mic button */}
        <div className="relative flex items-center justify-center w-40 h-40">
          {stage === 'recording' && (
            <>
              {[1, 2, 3].map(i => (
                <motion.div key={i}
                  className="absolute rounded-full bg-red-500"
                  initial={{ width: 80, height: 80, opacity: 0.3 }}
                  animate={{ width: 80 + i * 32, height: 80 + i * 32, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.4, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
            disabled={stage === 'processing'}
            className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
              stage === 'done'       ? 'bg-emerald-500' :
              stage === 'recording' ? 'bg-red-500' :
              stage === 'processing' ? 'bg-amber-500 cursor-wait' :
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {stage === 'done'
              ? <CheckCircle2 className="w-12 h-12" />
              : <Mic className={`w-12 h-12 ${stage === 'recording' ? 'animate-pulse' : ''}`} />
            }
          </motion.button>
        </div>

        <p className={`text-sm font-bold tracking-wide ${
          stage === 'recording' ? 'text-red-600' :
          stage === 'done' ? 'text-emerald-600' : 'text-gray-500'
        }`}>
          {stageLabel[stage]}
        </p>

        {/* Languages supported */}
        <div className="flex gap-2">
          {['हिन्दी', 'English', 'தமிழ்'].map(l => (
            <span key={l} className="text-[10px] bg-gray-50 border border-gray-200 text-gray-500 px-2 py-1 rounded-full font-medium">
              {l}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {transcript && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Transcript</p>
            <p className="text-sm text-gray-700 italic leading-relaxed">"{transcript}"</p>

            {stage === 'done' && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 grid grid-cols-2 gap-2"
              >
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-blue-700">150</p>
                  <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Patients Logged</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-sm font-black text-red-700 leading-tight">Paracetamol</p>
                  <p className="text-[9px] font-bold text-red-400 uppercase tracking-wide">Stock Alert Raised</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Attendance Tab ──────────────────────────────────────── */
function AttendanceTab({ centerId }: { centerId: number }) {
  const { data: records, refetch } = useListAttendance(
    { centerId }, { query: { queryKey: ['attendance', centerId] } }
  );
  const logAttendance = useLogAttendance();

  const staff = [
    { name: 'Dr. A. Sharma',    role: 'Chief Medical Officer' },
    { name: 'Dr. P. Gupta',     role: 'General Physician' },
    { name: 'Nurse R. Singh',   role: 'Senior Nurse' },
    { name: 'Tech M. Patel',    role: 'Lab Technician' },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCheckIn = (name: string) => {
    logAttendance.mutate({
      data: { centerId, doctorName: name, date: todayStr, lat: 28.6139, lng: 77.2090 }
    }, {
      onSuccess: () => {
        toast.success(`${name} checked in`, { icon: '✅' });
        refetch();
      }
    });
  };

  return (
    <motion.div key="att" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Staff Roster — Today</h3>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
          {records?.filter(r => r.date === todayStr).length ?? 0}/{staff.length} Present
        </Badge>
      </div>

      {staff.map(member => {
        const record = records?.find(r => r.doctorName === member.name && r.date === todayStr);
        const isPresent = !!record;

        return (
          <motion.div
            key={member.name}
            whileTap={{ scale: 0.98 }}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm ${
              isPresent ? 'border-emerald-200' : 'border-gray-100'
            }`}
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
              isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
            }`}>
              {member.name.split(' ').slice(-1)[0][0]}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm truncate">{member.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400">{member.role}</span>
                {isPresent && (
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(record.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            {isPresent ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Present</span>
              </div>
            ) : (
              <Button
                onClick={() => handleCheckIn(member.name)}
                disabled={logAttendance.isPending}
                className="h-10 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100"
              >
                Check In
              </Button>
            )}
          </motion.div>
        );
      })}

      {/* GPS badge */}
      <div className="flex items-center gap-2 mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-600 font-medium">GPS timestamp will be captured on check-in to prevent absenteeism</p>
      </div>
    </motion.div>
  );
}

/* ─── Main Frontline Page ─────────────────────────────────── */
export default function Frontline() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [isOffline] = useState(false);
  const currentCenterId = 1;

  return (
    <div className="max-w-[480px] mx-auto min-h-[100dvh] bg-gray-50 flex flex-col shadow-2xl overflow-hidden relative">

      {/* Sticky Header */}
      <header className="gradient-mesh text-white relative overflow-hidden z-10 flex-shrink-0">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative px-5 pt-10 pb-6">
          <div className="flex items-start justify-between mb-4">
            <Link href="/dashboard">
              <div className="p-2 bg-white/15 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {isOffline
                ? <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/30 text-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                    <WifiOff className="w-3 h-3" /> Offline Mode
                  </div>
                : <div className="flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                    <Wifi className="w-3 h-3" /> Live
                  </div>
              }
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">PHC ALPHA · FRONTLINE</p>
              <h1 className="text-2xl font-black tracking-tight">Staff Portal</h1>
              <p className="text-white/70 text-xs mt-0.5">Swasthiya Setu · Offline-first PWA</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'inventory'  && <InventoryTab key="inventory" centerId={currentCenterId} />}
          {activeTab === 'voice'      && <VoiceLogTab key="voice" centerId={currentCenterId} />}
          {activeTab === 'attendance' && <AttendanceTab key="attendance" centerId={currentCenterId} />}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-100 shadow-2xl z-50 flex">
        <NavBtn active={activeTab === 'inventory'}  icon={<PackageSearch className="w-5 h-5" />}   label="Inventory"  onClick={() => setActiveTab('inventory')} />
        <NavBtn active={activeTab === 'voice'}      icon={<Mic className="w-5 h-5" />}             label="Voice Log"  onClick={() => setActiveTab('voice')} />
        <NavBtn active={activeTab === 'attendance'} icon={<ClipboardCheck className="w-5 h-5" />}  label="Attendance" onClick={() => setActiveTab('attendance')} />
      </nav>
    </div>
  );
}
