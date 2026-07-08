import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, Zap, TestTube, ArrowRight, Mic, PenLine,
  CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { PATIENTS } from '@/lib/data';

const AI_DIAGNOSIS = {
  conditions: ['Type 2 Diabetes with Hypertension', 'Hypertensive Crisis (Stage 2)'],
  redFlags: ['BP 145/92 — Elevated. Immediate management needed.', 'Dual chronic condition increases cardiac risk.'],
  tests: ['HbA1c (Glycated Haemoglobin)', 'Fasting Blood Glucose', 'Lipid Profile', 'Renal Function Test'],
  treatment: ['Continue Metformin 500mg BD', 'Initiate Amlodipine 5mg OD for BP', 'Low-sodium diet counselling', 'Follow-up in 2 weeks'],
  referral: 'Refer to CHC if BP remains > 140/90 after 48 hours',
};

const LAB_TESTS = [
  { id: 'cbc', label: 'Blood CBC', eta: '2 hours', cost: '₹80' },
  { id: 'lft', label: 'Liver Function Test', eta: '3 hours', cost: '₹150' },
  { id: 'rft', label: 'Renal Function Test', eta: '3 hours', cost: '₹180' },
  { id: 'urine', label: 'Urine Analysis', eta: '1 hour', cost: '₹60' },
  { id: 'ecg', label: 'ECG', eta: '30 min', cost: '₹100' },
  { id: 'xray', label: 'Chest X-Ray', eta: '1 hour', cost: '₹200' },
  { id: 'hba1c', label: 'HbA1c', eta: '4 hours', cost: '₹250' },
  { id: 'lipid', label: 'Lipid Profile', eta: '4 hours', cost: '₹300' },
];

const REFERRAL_CENTERS = [
  { name: 'Peelamedu CHC', distance: '1.2 km', beds: 28, specialty: 'Medicine + Surgery', wait: '15 min' },
  { name: 'Coimbatore District Hospital', distance: '7.8 km', beds: 120, specialty: 'Multi-specialty', wait: '45 min' },
  { name: 'GH Erode', distance: '15 km', beds: 200, specialty: 'Tertiary Care', wait: '60 min' },
];

type Section = 'vitals' | 'ai' | 'prescription' | 'lab' | 'referral';

export default function DoctorConsultation() {
  const [selectedPatient, setSelectedPatient] = useState(PATIENTS[0]);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedLabs, setSelectedLabs] = useState<Set<string>>(new Set());
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [openSection, setOpenSection] = useState<Section>('vitals');
  const [signed, setSigned] = useState(false);

  function toggleLab(id: string) {
    setSelectedLabs(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function requestAI() {
    setAiLoading(true);
    setTimeout(() => { setAiLoading(false); setShowAI(true); }, 1200);
  }

  function sign() {
    setSigned(true);
    toast.success('Prescription Signed & Saved', { description: 'Digital signature applied. Record updated.' });
  }

  function orderLabs() {
    if (selectedLabs.size === 0) { toast.error('Select at least one test'); return; }
    toast.success(`${selectedLabs.size} Lab Test(s) Ordered`, { description: 'Lab team notified.' });
    setSelectedLabs(new Set());
  }

  const SectionHeader = ({ id, label, icon: Icon }: { id: Section; label: string; icon: React.ElementType }) => (
    <button
      className="w-full flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
      onClick={() => setOpenSection(openSection === id ? ('_' as Section) : id)}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-600" />
        <span className="text-xs font-bold text-gray-800">{label}</span>
      </div>
      {openSection === id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </button>
  );

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <h1 className="text-sm font-bold mb-2">Consultation Workspace</h1>
        {/* Patient Selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {PATIENTS.slice(0, 4).map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedPatient(p); setShowAI(false); setSigned(false); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                selectedPatient.id === p.id
                  ? 'bg-white text-cyan-700 border-white'
                  : 'bg-white/15 text-white border-white/25'
              }`}
            >
              {p.name.split(' ')[0]} (#{p.tokenNumber ?? '–'})
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2.5">
        {/* Patient info bar */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-200 flex items-center justify-center font-bold text-cyan-800 text-sm shrink-0">
            {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900">{selectedPatient.name}</p>
            <p className="text-[10px] text-gray-500">
              {selectedPatient.age}y · {selectedPatient.gender === 'M' ? 'Male' : 'Female'} · {selectedPatient.bloodGroup} · Last: {selectedPatient.lastVisit}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-gray-400">Conditions</p>
            <p className="text-[10px] font-bold text-gray-700">{selectedPatient.conditions.join(', ') || '—'}</p>
          </div>
        </div>

        {/* Vitals Section */}
        <SectionHeader id="vitals" label="Symptoms & Vitals" icon={Stethoscope} />
        <AnimatePresence>
          {openSection === 'vitals' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm space-y-3">
                {/* Vitals Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Temperature', placeholder: '36.8°C' },
                    { label: 'Blood Pressure', placeholder: '120/80 mmHg' },
                    { label: 'Pulse Rate', placeholder: '72 bpm' },
                    { label: 'Weight', placeholder: '65 kg' },
                  ].map(v => (
                    <div key={v.label}>
                      <p className="text-[9px] text-gray-400 mb-0.5">{v.label}</p>
                      <input
                        type="text"
                        placeholder={v.placeholder}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
                      />
                    </div>
                  ))}
                </div>
                {/* Symptoms */}
                <div>
                  <p className="text-[9px] text-gray-400 mb-0.5">Chief Complaint / Symptoms</p>
                  <textarea
                    placeholder="e.g. Headache, fatigue, high BP since 3 days..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-cyan-400 resize-none"
                  />
                </div>
                {/* Allergies reminder */}
                {selectedPatient.allergies.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <p className="text-[10px] text-red-700 font-semibold">
                      Allergy Alert: {selectedPatient.allergies.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Clinical Assistant */}
        <SectionHeader id="ai" label="AI Clinical Assistant" icon={Zap} />
        <AnimatePresence>
          {openSection === 'ai' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                    AI suggestions are for clinical assistance only. Final decisions remain with the doctor.
                  </p>
                </div>
                {!showAI ? (
                  <button
                    onClick={requestAI}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold rounded-lg disabled:opacity-60 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {aiLoading ? 'Analysing patient data…' : 'Request AI Clinical Analysis'}
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-purple-700 uppercase mb-2">Possible Conditions</p>
                      {AI_DIAGNOSIS.conditions.map(c => (
                        <div key={c} className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                          <span className="text-xs text-gray-700 font-medium">{c}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-red-700 uppercase mb-2">⚠️ Red Flags</p>
                      {AI_DIAGNOSIS.redFlags.map(f => (
                        <div key={f} className="flex items-start gap-1.5 mb-1">
                          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-red-700">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-teal-700 uppercase mb-2">Suggested Tests</p>
                      {AI_DIAGNOSIS.tests.map(t => (
                        <span key={t} className="inline-block text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded mr-1 mb-1">{t}</span>
                      ))}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-blue-700 uppercase mb-2">Treatment Considerations</p>
                      {AI_DIAGNOSIS.treatment.map(t => (
                        <div key={t} className="flex items-start gap-1.5 mb-1">
                          <CheckCircle className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-blue-700">{t}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                      <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Referral Suggestion</p>
                      <p className="text-[11px] text-amber-700">{AI_DIAGNOSIS.referral}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prescription Editor */}
        <SectionHeader id="prescription" label="Prescription Editor" icon={PenLine} />
        <AnimatePresence>
          {openSection === 'prescription' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm space-y-3">
                <div>
                  <p className="text-[9px] text-gray-400 mb-0.5">Prescription (Medicines, Dosage, Duration)</p>
                  <textarea
                    value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    placeholder="1. Metformin 500mg — 1 tab BD × 30 days&#10;2. Amlodipine 5mg — 1 tab OD × 30 days&#10;3. Aspirin 75mg — 1 tab OD (with food)"
                    rows={5}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-700 outline-none focus:border-cyan-400 resize-none font-mono"
                  />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 mb-0.5">Doctor's Notes</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Advice, follow-up instructions..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-cyan-400 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toast.info('Voice note started', { description: 'Recording...' })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" /> Voice Note
                  </button>
                  <button
                    onClick={sign}
                    disabled={signed}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-colors ${
                      signed
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {signed ? 'Signed & Saved ✓' : 'Sign & Save Prescription'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lab Request */}
        <SectionHeader id="lab" label="Lab Test Request" icon={TestTube} />
        <AnimatePresence>
          {openSection === 'lab' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {LAB_TESTS.map(test => (
                    <button
                      key={test.id}
                      onClick={() => toggleLab(test.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        selectedLabs.has(test.id)
                          ? 'bg-teal-50 border-teal-400 shadow-sm'
                          : 'bg-gray-50 border-gray-200 hover:border-teal-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-gray-800">{test.label}</span>
                        {selectedLabs.has(test.id) && <CheckCircle className="w-3 h-3 text-teal-600" />}
                      </div>
                      <p className="text-[9px] text-gray-400">{test.eta} · {test.cost}</p>
                    </button>
                  ))}
                </div>
                {selectedLabs.size > 0 && (
                  <button
                    onClick={orderLabs}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <TestTube className="w-3.5 h-3.5" />
                    Order {selectedLabs.size} Test{selectedLabs.size > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Referral */}
        <SectionHeader id="referral" label="Referral" icon={ArrowRight} />
        <AnimatePresence>
          {openSection === 'referral' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm space-y-2.5">
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-2.5">
                  <p className="text-[10px] font-bold text-purple-700 mb-1">🤖 AI Referral Recommendation</p>
                  <p className="text-[11px] text-purple-600">Based on BP & diabetes levels, CHC referral advised within 48 hours if no improvement.</p>
                </div>
                {REFERRAL_CENTERS.map(c => (
                  <div key={c.name} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{c.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.distance} · {c.specialty}</p>
                      <p className="text-[10px] text-gray-400">Beds: <strong className="text-gray-700">{c.beds}</strong> · Wait: <strong className="text-gray-700">{c.wait}</strong></p>
                    </div>
                    <button
                      onClick={() => toast.success(`Referral to ${c.name} initiated`, { description: 'Referral letter generated.' })}
                      className="flex items-center gap-1 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Refer <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
