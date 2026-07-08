import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, Clock, BedDouble, Stethoscope,
  Check, TestTube, User, Calendar, AlertTriangle,
} from 'lucide-react';
import { useAppDB, db_actions } from '@/lib/appDB';
import { useStaffSession } from '@/lib/staffAuth';

const TASKS_INIT = [
  { id: 1, label: 'Check cold chain vaccine fridge (2°C – 8°C)',      done: false },
  { id: 2, label: 'Inspect emergency crash cart & equipment',           done: false },
  { id: 3, label: 'Mark attendance for visiting specialist doctor',     done: false },
  { id: 4, label: 'Upload NCD screening logs to National Portal',       done: false },
  { id: 5, label: 'Follow up on high-risk ANC pregnancy referrals',     done: false },
  { id: 6, label: 'Verify TB DOTS treatment card dispensations',        done: false },
  { id: 7, label: 'Supervise biomedical waste colour-coded bag pickup', done: false },
];

const DIAG_TESTS = [
  { name: 'Blood CBC',   status: 'available', qty: null },
  { name: 'Malaria RDT', status: 'available', qty: null },
  { name: 'Urine Test',  status: 'available', qty: null },
  { name: 'Dengue NS1',  status: 'available', qty: null },
];

export default function FrontlineDashboard() {
  const [tasks, setTasks] = useState(TASKS_INIT);
  const appDB  = useAppDB();
  const session = useStaffSession('staff');

  const facilityCode = session?.facilityCode ?? '';
  const today = new Date().toISOString().split('T')[0];

  // All counts come from shared database — zero until staff enters data
  const todayPatients = appDB.patients.filter(p => p.facilityCode === facilityCode && p.registeredAt.startsWith(today)).length;
  const waitingCount  = appDB.patients.filter(p => p.facilityCode === facilityCode && p.status === 'waiting' && p.registeredAt.startsWith(today)).length;
  const facilityBeds  = appDB.beds.filter(b => b.facilityCode === facilityCode);
  const totalFree     = facilityBeds.reduce((s, b) => s + (b.total - b.occupied), 0);
  const totalBeds     = facilityBeds.reduce((s, b) => s + b.total, 0);
  const doctorsOnDuty = appDB.doctorStatuses.filter(d => d.facilityCode === facilityCode && d.onDuty).length;
  const totalDoctors  = appDB.doctorStatuses.filter(d => d.facilityCode === facilityCode).length;

  const staffName = session?.name?.split(' ').slice(0, 2).join(' ') ?? 'Staff';
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-5 pb-6 rounded-b-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-base font-bold">{session?.facility ?? 'PHC'}</h1>
            <p className="text-blue-200 text-[11px] mt-0.5">Frontline Staff Portal</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <User className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] text-blue-200">{staffName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-200 text-[11px]">
            <Calendar className="w-3.5 h-3.5" />{todayLabel}
          </div>
          <span className="flex items-center gap-1 bg-green-500/20 border border-green-400/30 text-green-300 text-[10px] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />OPD Open
          </span>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* Stats — all live from appDB, start at 0 */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Today's Patients", value: todayPatients,                              icon: Users,      color: 'blue'  },
            { label: 'Waiting Now',      value: waitingCount,                               icon: Clock,      color: 'amber' },
            { label: 'Beds Free',        value: totalBeds > 0 ? `${totalFree}/${totalBeds}` : '—', icon: BedDouble,  color: totalFree === 0 && totalBeds > 0 ? 'red' : 'green' },
            { label: 'Doctors On Duty',  value: totalDoctors > 0 ? `${doctorsOnDuty}/${totalDoctors}` : '—', icon: Stethoscope, color: doctorsOnDuty === 0 && totalDoctors > 0 ? 'red' : 'green' },
          ].map((s, i) => {
            const Icon = s.icon;
            const cm: Record<string, string> = { blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', green: 'bg-green-50 text-green-700' };
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} className={`rounded-xl p-3 ${cm[s.color]} border border-current/10`}>
                <Icon className="w-4 h-4 mb-1.5 opacity-70" />
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[10px] mt-0.5 opacity-80">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/staff/patients">
            <div className="bg-blue-600 rounded-xl p-3.5 text-white flex items-center gap-3 cursor-pointer hover:bg-blue-700 transition-colors">
              <Users className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Patient Queue</p>
                <p className="text-[10px] text-blue-200">{waitingCount} waiting</p>
              </div>
            </div>
          </Link>
          <Link href="/staff/beds">
            <div className="bg-emerald-600 rounded-xl p-3.5 text-white flex items-center gap-3 cursor-pointer hover:bg-emerald-700 transition-colors">
              <BedDouble className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Bed Status</p>
                <p className="text-[10px] text-emerald-200">
                  {totalBeds > 0 ? `${totalFree}/${totalBeds} free` : 'Tap to set up'}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-gray-800">Today's Tasks</p>
            <span className="text-[10px] text-gray-400">{tasks.filter(t => t.done).length}/{tasks.length} done</span>
          </div>
          <div className="space-y-1.5">
            {tasks.map(task => (
              <button key={task.id} onClick={() => setTasks(p => p.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                className="w-full flex items-center gap-2.5 py-1.5 text-left group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-blue-400'}`}>
                  {task.done && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-xs ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Doctors on duty — from appDB */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-xs font-bold text-gray-800 mb-2">Doctors On Duty</p>
          {appDB.doctorStatuses.filter(d => d.facilityCode === facilityCode).length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">No doctors have logged in yet today.</p>
          ) : (
            <div className="space-y-2">
              {appDB.doctorStatuses.filter(d => d.facilityCode === facilityCode).map(doc => (
                <div key={doc.empId} className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${doc.onDuty ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Stethoscope className={`w-3.5 h-3.5 ${doc.onDuty ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-800">{doc.name}</p>
                    <p className="text-[10px] text-gray-400">{doc.specialty}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${doc.onDuty ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
                    {doc.onDuty ? 'On Duty' : 'Off Duty'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Tests — static status, staff can update later */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-xs font-bold text-gray-800 mb-2.5">Diagnostic Test Kits</p>
          <div className="grid grid-cols-2 gap-2">
            {DIAG_TESTS.map(test => (
              <div key={test.name} className="rounded-lg p-2.5 border bg-green-50 border-green-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <TestTube className="w-3 h-3 text-green-600" />
                  <span className="text-[10px] font-semibold text-gray-700">{test.name}</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">Available</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
