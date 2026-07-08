import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Plus, X, ChevronRight, Phone, MapPin,
  Mic, User, ArrowLeft, Activity, Heart, AlertCircle,
} from 'lucide-react';
import { PATIENTS, type Patient } from '@/lib/data';

type QueueTab = 'queue' | 'registered' | 'history';

const PRIORITY_STYLE: Record<Patient['priority'], { badge: string; token: string; order: number }> = {
  emergency: { badge: 'bg-red-100 text-red-700 border-red-200',     token: 'bg-red-500',    order: 0 },
  senior:    { badge: 'bg-orange-100 text-orange-700 border-orange-200', token: 'bg-orange-400', order: 1 },
  pregnant:  { badge: 'bg-purple-100 text-purple-700 border-purple-200', token: 'bg-purple-500', order: 2 },
  child:     { badge: 'bg-blue-100 text-blue-700 border-blue-200',   token: 'bg-blue-500',   order: 3 },
  normal:    { badge: 'bg-gray-100 text-gray-600 border-gray-200',   token: 'bg-gray-400',   order: 4 },
};

function PatientDetailSheet({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.28 }}
      className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto"
    >
      <div className="gradient-gov text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <button onClick={onClose} className="flex items-center gap-1.5 text-blue-200 text-xs mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">{patient.name}</h2>
            <p className="text-blue-200 text-[11px]">{patient.age}y · {patient.gender === 'M' ? 'Male' : 'Female'} · {patient.bloodGroup}</p>
            <p className="text-[10px] text-blue-300 mt-0.5">ABHA: {patient.abhaId}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-3">
        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Contact</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {patient.phone}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> {patient.village}
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Vitals</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'BP', value: '120/80' },
              { label: 'Temp', value: '98.6°F' },
              { label: 'SpO₂', value: '98%' },
            ].map(v => (
              <div key={v.label} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-[9px] text-gray-400">{v.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{v.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Conditions</p>
          <div className="flex flex-wrap gap-1.5">
            {patient.conditions.map(c => (
              <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full border border-blue-100">{c}</span>
            ))}
          </div>
        </div>

        {/* Allergies */}
        {patient.allergies.length > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-100 p-3">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Allergies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map(a => (
                <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Visit History */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Visit History</p>
          <div className="space-y-2">
            {[
              { date: patient.lastVisit, note: 'Routine checkup. BP normal.' },
              { date: 'Jun 15',          note: 'Follow-up consultation.' },
            ].map((v, i) => (
              <div key={i} className="flex gap-2.5 text-xs">
                <span className="text-gray-400 shrink-0 w-16">{v.date}</span>
                <span className="text-gray-700">{v.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RegisterModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
      className="fixed inset-x-0 bottom-0 z-50 max-w-[480px] mx-auto bg-white rounded-t-2xl shadow-2xl"
    >
      <div className="px-4 pt-4 pb-2 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900">Register Patient</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="px-4 py-4 space-y-3 max-h-[70vh] overflow-y-auto pb-8">
        {[
          { label: 'Full Name', placeholder: 'Enter patient name', type: 'text' },
          { label: 'Age',       placeholder: 'Age in years',       type: 'number' },
          { label: 'Phone',     placeholder: '+91 XXXXX XXXXX',    type: 'tel' },
          { label: 'Village',   placeholder: 'Village / Town',     type: 'text' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        {/* Gender */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Gender</label>
          <div className="flex gap-2 mt-1">
            {['Male', 'Female', 'Other'].map(g => (
              <button key={g} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors">
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(['normal', 'senior', 'pregnant', 'child', 'emergency'] as const).map(p => (
              <button key={p} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${PRIORITY_STYLE[p].badge}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Symptoms</label>
          <div className="flex gap-2 mt-1">
            <input
              placeholder="Describe symptoms..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => toast.info('Voice input active (simulated)')}
              className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => { toast.success('Patient registered successfully!', { description: 'Token assigned: #24' }); onClose(); }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          Register &amp; Assign Token
        </button>
      </div>
    </motion.div>
  );
}

export default function FrontlinePatients() {
  const [tab, setTab] = useState<QueueTab>('queue');
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const queuePatients = PATIENTS.filter(p => p.tokenNumber !== null)
    .sort((a, b) => (PRIORITY_STYLE[a.priority].order - PRIORITY_STYLE[b.priority].order));

  const displayPatients = queuePatients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="gradient-gov text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold">Patients</h1>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {queuePatients.length} waiting
            </span>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-1 bg-white/15 border border-white/30 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            Register
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-300" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/15 border border-white/20 text-white placeholder:text-blue-300 text-xs rounded-lg pl-8 pr-3 py-2 outline-none"
          />
        </div>
      </div>

      <div className="px-4 pt-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-3">
          {(['queue', 'registered', 'history'] as QueueTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Queue */}
        {tab === 'queue' && (
          <AnimatePresence>
            <div className="space-y-2">
              {displayPatients.map((patient, i) => {
                const ps = PRIORITY_STYLE[patient.priority];
                return (
                  <motion.div
                    key={patient.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Token */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ps.token}`}>
                        <span className="text-white text-[11px] font-bold">#{patient.tokenNumber}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-gray-900">{patient.name}</p>
                          <span className="text-[10px] text-gray-400">{patient.age}y · {patient.gender === 'M' ? 'M' : 'F'}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${ps.badge}`}>
                            {patient.priority}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.conditions.slice(0, 2).map(c => (
                            <span key={c} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                          {patient.conditions.length > 2 && (
                            <span className="text-[9px] text-gray-400">+{patient.conditions.length - 2}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => toast.success(`Calling Token #${patient.tokenNumber}`, { description: `${patient.name} — Please proceed to OPD` })}
                          className="text-[10px] font-semibold px-2 py-1 bg-blue-600 text-white rounded-lg"
                        >
                          Call
                        </button>
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="text-[10px] font-semibold px-2 py-1 bg-gray-100 text-gray-700 rounded-lg"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {displayPatients.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-xs">No patients in queue</div>
              )}
            </div>
          </AnimatePresence>
        )}

        {tab !== 'queue' && (
          <div className="text-center py-10 text-gray-400 text-xs">
            {tab === 'registered' ? 'All registered patients will appear here.' : 'Visit history will appear here.'}
          </div>
        )}
      </div>

      {/* Patient Detail */}
      <AnimatePresence>
        {selectedPatient && (
          <PatientDetailSheet patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
        )}
      </AnimatePresence>

      {/* Register Modal */}
      <AnimatePresence>
        {showRegister && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowRegister(false)}
            />
            <RegisterModal onClose={() => setShowRegister(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
