import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Scan, User, AlertTriangle, FileText, Stethoscope,
  Phone, ChevronDown, ChevronUp, TestTube, ArrowRight,
} from 'lucide-react';
import { PATIENTS, type Patient } from '@/lib/data';
import { Link } from 'wouter';

const PRIORITY_BADGE: Record<string, { label: string; style: string }> = {
  emergency: { label: 'Emergency', style: 'bg-red-100 text-red-700' },
  senior:    { label: 'Senior',    style: 'bg-amber-100 text-amber-700' },
  pregnant:  { label: 'Pregnant',  style: 'bg-pink-100 text-pink-700' },
  child:     { label: 'Child',     style: 'bg-blue-100 text-blue-700' },
  normal:    { label: 'Normal',    style: 'bg-gray-100 text-gray-600' },
};

const VITALS: Record<string, { bp: string; pulse: string; temp: string; weight: string }> = {
  p1: { bp: '145/92', pulse: '88', temp: '37.2°C', weight: '74 kg' },
  p2: { bp: '110/70', pulse: '82', temp: '36.9°C', weight: '58 kg' },
  p3: { bp: '—',      pulse: '96', temp: '37.8°C', weight: '22 kg' },
  p4: { bp: '158/94', pulse: '79', temp: '37.1°C', weight: '61 kg' },
  p5: { bp: '120/78', pulse: '90', temp: '38.4°C', weight: '68 kg' },
  p6: { bp: '130/82', pulse: '84', temp: '37.0°C', weight: '70 kg' },
};

function PatientCard({ patient }: { patient: Patient }) {
  const [expanded, setExpanded] = useState(false);
  const badge = PRIORITY_BADGE[patient.priority];
  const vitals = VITALS[patient.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
          patient.priority === 'emergency' ? 'bg-red-100 text-red-700' :
          patient.priority === 'senior' ? 'bg-amber-100 text-amber-700' :
          patient.priority === 'pregnant' ? 'bg-pink-100 text-pink-700' :
          'bg-cyan-100 text-cyan-700'
        }`}>
          {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-bold text-gray-900">{patient.name}</p>
            {patient.tokenNumber && (
              <span className="text-[9px] font-bold bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full">
                Token #{patient.tokenNumber}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {patient.age}y · {patient.gender === 'M' ? 'Male' : 'Female'} · {patient.village}
          </p>
          {patient.conditions.length > 0 && (
            <p className="text-[10px] text-gray-600 mt-0.5 font-medium">
              {patient.conditions.join(', ')}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.style}`}>{badge.label}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
          {/* Vitals */}
          {vitals && (
            <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-2.5">
              <p className="text-[9px] font-bold text-cyan-700 uppercase mb-1.5">Current Vitals</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'BP', value: vitals.bp },
                  { label: 'Pulse', value: vitals.pulse },
                  { label: 'Temp', value: vitals.temp },
                  { label: 'Weight', value: vitals.weight },
                ].map(v => (
                  <div key={v.label}>
                    <p className="text-[9px] text-cyan-500">{v.label}</p>
                    <p className="text-[11px] font-bold text-cyan-800">{v.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical History */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-semibold mb-1">Medical History</p>
              {patient.conditions.map(c => (
                <span key={c} className="inline-block text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mr-1 mb-1">{c}</span>
              ))}
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-semibold mb-1">Allergies</p>
              {patient.allergies.length > 0
                ? patient.allergies.map(a => (
                  <span key={a} className="inline-block text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded mr-1 mb-1">{a}</span>
                ))
                : <span className="text-[10px] text-gray-400">None known</span>
              }
            </div>
          </div>

          {/* ABHA */}
          <div className="flex items-center justify-between text-[10px] bg-gray-50 rounded-lg px-2.5 py-1.5">
            <span className="text-gray-500">ABHA ID</span>
            <span className="font-mono font-semibold text-gray-700">{patient.abhaId}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link href="/doctor/consultation" className="flex-1">
              <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition-colors">
                <Stethoscope className="w-3.5 h-3.5" /> Consult
              </button>
            </Link>
            <button
              onClick={() => toast.info(`Requesting lab for ${patient.name}`, { description: 'Lab request form opened.' })}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg border border-teal-200 transition-colors"
            >
              <TestTube className="w-3.5 h-3.5" /> Lab
            </button>
            <button
              onClick={() => toast.info(`Refer ${patient.name}`, { description: 'Referral form opened.' })}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Refer
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function DoctorPatients() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'emergency' | 'senior' | 'pregnant' | 'child'>('all');

  const filtered = PATIENTS.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'all' && p.priority !== filter) return false;
    return true;
  });

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'emergency', label: '🚨 Emergency' },
    { key: 'senior', label: '👴 Senior' },
    { key: 'pregnant', label: '🤰 Pregnant' },
    { key: 'child', label: '👶 Child' },
  ];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <h1 className="text-sm font-bold mb-3">Patient List</h1>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-200" />
            <input
              type="text"
              placeholder="Search by name, ABHA ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/15 border border-white/20 text-white placeholder:text-cyan-200 text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-white/50"
            />
          </div>
          <button
            onClick={() => toast.info('QR Scan / ABHA Lookup', { description: 'Scanner opened (simulated).' })}
            className="flex items-center gap-1.5 px-3 bg-white/15 border border-white/20 rounded-lg text-white text-xs font-medium"
          >
            <Scan className="w-3.5 h-3.5" /> Scan
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* Priority filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                filter === f.key
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Alert banner */}
        {PATIENTS.some(p => p.priority === 'emergency') && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-700 font-semibold">Emergency case requires immediate attention</p>
          </div>
        )}

        {/* AI suggestion */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-3 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <p className="text-[11px] font-bold">🤖 AI Patient Prioritization</p>
          </div>
          <p className="text-[11px] text-purple-100 leading-relaxed">
            2 high-risk patients flagged today.{' '}
            <strong className="text-white">Muthu Selvam</strong> — uncontrolled BP + Diabetes (risk score: High).{' '}
            <strong className="text-white">Rajammal Devi</strong> — Arthritis flare-up possible.
          </p>
        </div>

        {/* Patient list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">No patients found</div>
          ) : (
            filtered.map(patient => <PatientCard key={patient.id} patient={patient} />)
          )}
        </div>
      </div>
    </div>
  );
}
