import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertTriangle, Users, Clock, BedDouble, Stethoscope,
  CheckSquare, Check, ChevronRight, Thermometer, TestTube,
  User, Calendar,
} from 'lucide-react';
import { CENTERS, MEDICINES, AI_ACTIONS } from '@/lib/data';

const CENTER = CENTERS.find(c => c.id === 'phc-01')!;
const CENTER_MEDS = MEDICINES.filter(m => m.centerId === 'phc-01');
const CRITICAL_MEDS = CENTER_MEDS.filter(m => m.status === 'critical');

const DOCTORS = [
  { id: 1, name: 'Dr. Arumugam',  specialty: 'General Medicine', checked: true },
  { id: 2, name: 'Dr. Sundari',   specialty: 'Paediatrics',      checked: false },
  { id: 3, name: 'Dr. Rajan',     specialty: 'General Medicine', checked: false },
];

const TASKS_INIT = [
  { id: 1, label: 'Check cold chain vaccine fridge temp (2°C to 8°C)', done: false },
  { id: 2, label: 'Inspect & replenish emergency crash cart drugs', done: false },
  { id: 3, label: 'Mark attendance for visiting specialist doctor', done: true  },
  { id: 4, label: 'Upload NCD screening logs to National Portal', done: false },
  { id: 5, label: 'Follow up on high-risk ANC pregnancy referrals', done: false },
  { id: 6, label: 'Verify TB DOTS treatment card dispensations', done: false },
  { id: 7, label: 'Supervise biomedical waste color-coded bags pickup', done: true },
];

const DIAG_TESTS = [
  { name: 'Blood CBC',    status: 'available',     qty: null },
  { name: 'Malaria RDT',  status: 'low',           qty: 8    },
  { name: 'Urine Test',   status: 'available',     qty: null },
  { name: 'Dengue NS1',   status: 'critical',      qty: 2    },
];

export default function FrontlineDashboard() {
  const [tasks, setTasks] = useState(TASKS_INIT);
  const [docChecked, setDocChecked] = useState<Set<number>>(new Set([1]));

  function toggleTask(id: number) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function checkInDoctor(id: number) {
    setDocChecked(prev => new Set([...prev, id]));
    const doc = DOCTORS.find(d => d.id === id);
    toast.success(`${doc?.name} checked in`, { description: 'Attendance recorded successfully.' });
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const criticalAction = AI_ACTIONS.find(a => a.severity === 'critical' && a.phcId === 'phc-01');

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="gradient-gov text-white px-4 pt-5 pb-6 rounded-b-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-base font-bold">{CENTER.name}</h1>
            <p className="text-blue-200 text-[11px] mt-0.5">Frontline Staff Portal</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <User className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] text-blue-200">Nurse Vijaya</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-200 text-[11px]">
            <Calendar className="w-3.5 h-3.5" />
            {today}
          </div>
          <span className="flex items-center gap-1 bg-green-500/20 border border-green-400/30 text-green-300 text-[10px] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />
            OPD Open
          </span>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Today's Patients", value: CENTER.footfallToday, icon: Users,       color: 'blue'  },
            { label: 'Waiting Now',      value: 23,                   icon: Clock,       color: 'amber' },
            { label: 'Beds Available',   value: CENTER.beds,          icon: BedDouble,   color: CENTER.beds === 0 ? 'red' : 'green' },
            { label: 'Doctors Present',  value: `${CENTER.doctors}/${CENTER.doctorsTotal}`, icon: Stethoscope, color: CENTER.doctors < 2 ? 'red' : 'green' },
          ].map((s, i) => {
            const Icon = s.icon;
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700',
              red: 'bg-red-50 text-red-700', green: 'bg-green-50 text-green-700',
            };
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-xl p-3 ${colorMap[s.color]} border border-current/10`}
              >
                <Icon className="w-4 h-4 mb-1.5 opacity-70" />
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[10px] mt-0.5 opacity-80">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* AI Alert Banner */}
        {criticalAction && (
          <Link href="/staff/inventory">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 cursor-pointer hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-700">
                  ⚠️ {CRITICAL_MEDS.length} critical medicines near stock-out. AI recommends immediate reorder.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
            </div>
          </Link>
        )}

        {/* Critical Medicines Grid/List */}
        <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-gray-800">Critical & Low Stock Medicines</p>
            <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
              {CENTER_MEDS.filter(m => m.status === 'critical').length} Urgent
            </span>
          </div>
          <div className="space-y-2">
            {CENTER_MEDS.filter(m => m.status === 'critical' || m.status === 'low').map(med => (
              <div
                key={med.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  med.status === 'critical' ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-gray-900 truncate">{med.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{med.unit}</p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className={`text-xs font-black ${med.status === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                      {med.quantity}
                    </p>
                    <p className="text-[9px] text-gray-400 font-medium">Stock</p>
                  </div>
                  <div className="w-16">
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded text-center w-full ${
                      med.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {med.daysLeft === 0 ? 'Stockout' : `${med.daysLeft}d left`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {CENTER_MEDS.filter(m => m.status === 'critical' || m.status === 'low').length === 0 && (
              <p className="text-xs text-gray-400 py-2 text-center">All medicines are fully stocked.</p>
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-gray-800">Today&apos;s Tasks</p>
            <span className="text-[10px] text-gray-400">
              {tasks.filter(t => t.done).length}/{tasks.length} done
            </span>
          </div>
          <div className="space-y-1.5">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-center gap-2.5 py-1.5 text-left group"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-blue-400'
                }`}>
                  {task.done && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-xs ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.label}
                </span>
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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    present ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Stethoscope className={`w-3.5 h-3.5 ${present ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-800">{doc.name}</p>
                    <p className="text-[10px] text-gray-400">{doc.specialty}</p>
                  </div>
                  {present ? (
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Present</span>
                  ) : (
                    <button
                      onClick={() => checkInDoctor(doc.id)}
                      className="text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors"
                    >
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
          <p className="text-xs font-bold text-gray-800 mb-2.5">Diagnostic Tests</p>
          <div className="grid grid-cols-2 gap-2">
            {DIAG_TESTS.map(test => (
              <div
                key={test.name}
                className={`rounded-lg p-2.5 border ${
                  test.status === 'critical' ? 'bg-red-50 border-red-200' :
                  test.status === 'low' ? 'bg-orange-50 border-orange-200' :
                  'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <TestTube className={`w-3 h-3 ${
                    test.status === 'critical' ? 'text-red-500' :
                    test.status === 'low' ? 'text-orange-500' : 'text-green-600'
                  }`} />
                  <span className="text-[10px] font-semibold text-gray-700">{test.name}</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                  test.status === 'critical' ? 'bg-red-100 text-red-700' :
                  test.status === 'low' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {test.status === 'critical' && test.qty ? `${test.qty} kits left` :
                   test.status === 'low' && test.qty ? `${test.qty} kits` :
                   'Available'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
