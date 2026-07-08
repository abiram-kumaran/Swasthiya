import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, Clock, BedDouble, Stethoscope,
  Check, TestTube, User, Calendar, Zap, AlertTriangle,
} from 'lucide-react';
import { CENTERS, AI_ACTIONS } from '@/lib/data';

const CENTER = CENTERS.find(c => c.id === 'phc-01')!;

const DOCTORS = [
  { id: 1, name: 'Dr. Arumugam', specialty: 'General Medicine' },
  { id: 2, name: 'Dr. Sundari',  specialty: 'Paediatrics'      },
  { id: 3, name: 'Dr. Rajan',    specialty: 'General Medicine' },
];

const TASKS_INIT = [
  { id: 1, label: 'Check cold chain vaccine fridge (2°C – 8°C)',       done: false },
  { id: 2, label: 'Inspect emergency crash cart & equipment',            done: false },
  { id: 3, label: 'Mark attendance for visiting specialist doctor',      done: true  },
  { id: 4, label: 'Upload NCD screening logs to National Portal',        done: false },
  { id: 5, label: 'Follow up on high-risk ANC pregnancy referrals',      done: false },
  { id: 6, label: 'Verify TB DOTS treatment card dispensations',         done: false },
  { id: 7, label: 'Supervise biomedical waste colour-coded bag pickup',  done: true  },
];

const DIAG_TESTS = [
  { name: 'Blood CBC',   status: 'available', qty: null },
  { name: 'Malaria RDT', status: 'low',       qty: 8    },
  { name: 'Urine Test',  status: 'available', qty: null },
  { name: 'Dengue NS1',  status: 'critical',  qty: 2    },
];

export default function FrontlineDashboard() {
  const [tasks, setTasks]     = useState(TASKS_INIT);
  const [docChecked, setDocChecked] = useState<Set<number>>(new Set([1]));
  const [waitingCount]        = useState(23);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const aiAlert = AI_ACTIONS.find(a => a.severity === 'critical' && a.phcId === 'phc-01');

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-5 pb-6 rounded-b-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-base font-bold">{CENTER.name}</h1>
            <p className="text-blue-200 text-[11px] mt-0.5">Frontline Staff Portal</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <User className="w-4 h-4 text-white"/>
            </div>
            <p className="text-[10px] text-blue-200">Nurse Vijaya</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-200 text-[11px]">
            <Calendar className="w-3.5 h-3.5"/>{today}
          </div>
          <span className="flex items-center gap-1 bg-green-500/20 border border-green-400/30 text-green-300 text-[10px] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink"/>OPD Open
          </span>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Today's Patients", value: CENTER.footfallToday, icon: Users,      color: 'blue'                                 },
            { label: 'Waiting Now',      value: waitingCount,         icon: Clock,      color: 'amber'                                },
            { label: 'Beds Available',   value: CENTER.beds,          icon: BedDouble,  color: CENTER.beds === 0 ? 'red' : 'green'    },
            { label: 'Doctors Present',  value: `${docChecked.size}/${DOCTORS.length}`, icon: Stethoscope, color: docChecked.size < 2 ? 'red' : 'green' },
          ].map((s, i) => {
            const Icon = s.icon;
            const cm: Record<string,string> = { blue:'bg-blue-50 text-blue-700', amber:'bg-amber-50 text-amber-700', red:'bg-red-50 text-red-700', green:'bg-green-50 text-green-700' };
            return (
              <motion.div key={s.label} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*.06 }}
                className={`rounded-xl p-3 ${cm[s.color]} border border-current/10`}>
                <Icon className="w-4 h-4 mb-1.5 opacity-70"/>
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[10px] mt-0.5 opacity-80">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* AI Alert */}
        {aiAlert && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">⚠️ District AI Alert — {aiAlert.phcName}</p>
              <p className="text-[10px] text-amber-700 mt-0.5 line-clamp-2">{aiAlert.message}</p>
            </div>
          </div>
        )}

        {/* Quick links to queue & beds */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/staff/patients">
            <div className="bg-blue-600 rounded-xl p-3.5 text-white flex items-center gap-3 cursor-pointer hover:bg-blue-700 transition-colors">
              <Users className="w-5 h-5 shrink-0"/>
              <div>
                <p className="text-xs font-bold">Patient Queue</p>
                <p className="text-[10px] text-blue-200">{waitingCount} waiting</p>
              </div>
            </div>
          </Link>
          <Link href="/staff/beds">
            <div className="bg-emerald-600 rounded-xl p-3.5 text-white flex items-center gap-3 cursor-pointer hover:bg-emerald-700 transition-colors">
              <BedDouble className="w-5 h-5 shrink-0"/>
              <div>
                <p className="text-xs font-bold">Bed Status</p>
                <p className="text-[10px] text-emerald-200">{CENTER.beds}/{CENTER.bedsTotal} free</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-gray-800">Today's Tasks</p>
            <span className="text-[10px] text-gray-400">{tasks.filter(t=>t.done).length}/{tasks.length} done</span>
          </div>
          <div className="space-y-1.5">
            {tasks.map(task => (
              <button key={task.id} onClick={() => setTasks(p => p.map(t => t.id===task.id ? {...t,done:!t.done} : t))}
                className="w-full flex items-center gap-2.5 py-1.5 text-left group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-blue-400'}`}>
                  {task.done && <Check className="w-2.5 h-2.5 text-white"/>}
                </div>
                <span className={`text-xs ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Attendance */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-xs font-bold text-gray-800 mb-2.5">Doctor Attendance</p>
          <div className="space-y-2">
            {DOCTORS.map(doc => {
              const present = docChecked.has(doc.id);
              return (
                <div key={doc.id} className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${present ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Stethoscope className={`w-3.5 h-3.5 ${present ? 'text-green-600' : 'text-gray-400'}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-800">{doc.name}</p>
                    <p className="text-[10px] text-gray-400">{doc.specialty}</p>
                  </div>
                  {present ? (
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Present</span>
                  ) : (
                    <button onClick={() => { setDocChecked(p => new Set([...p,doc.id])); toast.success(`${doc.name} checked in`); }}
                      className="text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors">
                      Check In
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostic Tests */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-xs font-bold text-gray-800 mb-2.5">Diagnostic Test Kits</p>
          <div className="grid grid-cols-2 gap-2">
            {DIAG_TESTS.map(test => (
              <div key={test.name} className={`rounded-lg p-2.5 border ${test.status==='critical'?'bg-red-50 border-red-200':test.status==='low'?'bg-orange-50 border-orange-200':'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TestTube className={`w-3 h-3 ${test.status==='critical'?'text-red-500':test.status==='low'?'text-orange-500':'text-green-600'}`}/>
                  <span className="text-[10px] font-semibold text-gray-700">{test.name}</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${test.status==='critical'?'bg-red-100 text-red-700':test.status==='low'?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'}`}>
                  {test.status==='critical'&&test.qty?`${test.qty} kits`:test.status==='low'&&test.qty?`${test.qty} kits`:'Available'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
