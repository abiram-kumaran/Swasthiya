import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Plus, X, LogOut, Search, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation, INDIAN_LANGUAGES } from '@/lib/translations';
import { getPatient, updatePatient, clearPatient, getAge, getInitials } from '@/lib/patientStore';

/* ── Language Picker Modal ─────────────────────────────── */
function LanguagePicker({ current, onSelect, onClose }: {
  current: string; onSelect: (l: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = INDIAN_LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.native.includes(search)
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-sm bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '75vh' }}
      >
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-900">Select Language</p>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search language…"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <div className="overflow-y-auto pb-6" style={{ maxHeight: 'calc(75vh - 130px)' }}>
          {filtered.map(l => (
            <button key={l.code}
              onClick={() => { onSelect(l.name); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-xl">{l.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{l.name}</p>
                <p className="text-xs text-gray-500">{l.native}</p>
              </div>
              {(current === l.name || current === l.native) && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No language found</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Tag chip ──────────────────────────────────────────── */
function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100">
      {label}
      <button onClick={onRemove} className="text-blue-400 hover:text-blue-700">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

/* ── Editable row ──────────────────────────────────────── */
function EditRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const save = () => { onChange(draft); setEditing(false); };
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-sm w-24 shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 ml-2">
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="flex-1 text-sm bg-blue-50 rounded-lg px-3 py-1.5 outline-none border border-blue-200" />
          <button onClick={save} className="text-blue-600 text-xs font-bold">Save</button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 ml-2 justify-end">
          <span className="text-gray-800 font-semibold text-sm text-right">{value || '—'}</span>
          <button onClick={() => { setDraft(value); setEditing(true); }} className="text-gray-300 hover:text-blue-500">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-5 pt-4 pb-1">{title}</p>
      <div className="px-5 pb-4">{children}</div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function PatientProfile() {
  const [, navigate] = useLocation();
  const { t, lang, changeLanguage } = useTranslation();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const patient = getPatient();
  const [conditions, setConditions] = useState<string[]>(patient?.conditions ?? []);
  const [allergies, setAllergies] = useState<string[]>(patient?.allergies ?? []);

  // Sync back to store when tags change
  useEffect(() => { updatePatient({ conditions }); }, [conditions]);
  useEffect(() => { updatePatient({ allergies }); }, [allergies]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-8 text-center">
        <p className="font-bold text-gray-700">No profile found. Please log in again.</p>
        <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl">
          Go to Login
        </button>
      </div>
    );
  }

  const age = getAge(patient.dob);
  const initials = getInitials(patient.name);

  const addTag = (list: string[], setter: (v: string[]) => void, msg: string) => {
    const val = window.prompt(msg);
    if (val?.trim()) setter([...list, val.trim()]);
  };

  const handleLangSelect = (l: string) => {
    changeLanguage(l);
    updatePatient({ language: l });
    toast.success(`Language changed to ${l}`);
  };

  const currentLangNative = INDIAN_LANGUAGES.find(l => l.name === lang)?.native ?? lang;

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center py-4"
      >
        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-3 shadow-lg">
          <span className="text-white text-2xl font-black">{initials}</span>
        </div>
        <h1 className="text-xl font-black text-gray-900">{patient.name}</h1>
        <p className="text-gray-400 text-sm">+91 {patient.phone}</p>
        <p className="text-gray-400 text-xs mt-0.5">{patient.village}{patient.village && patient.district ? ', ' : ''}{patient.district}</p>
        <span className="mt-2 text-[10px] bg-blue-50 text-blue-600 font-mono px-3 py-1 rounded-full border border-blue-100">
          {patient.abhaId}
        </span>
      </motion.div>

      {/* Health Info */}
      <Section title={t('healthInfo', 'Health Information')}>
        <EditRow label={t('bloodGroup', 'Blood Group')} value={patient.bloodGroup}
          onChange={v => updatePatient({ bloodGroup: v })} />
        <EditRow label={t('age', 'Age')} value={`${age} years`}
          onChange={() => {}} />
        <EditRow label={t('weight', 'Weight')} value={patient.weight}
          onChange={v => updatePatient({ weight: v })} />
        <EditRow label={t('height', 'Height')} value={patient.height}
          onChange={v => updatePatient({ height: v })} />
        <EditRow label="Gender" value={patient.gender}
          onChange={v => updatePatient({ gender: v as 'Male' | 'Female' | 'Other' })} />
      </Section>

      {/* Conditions */}
      <Section title={t('currentIssues', 'Current Health Issues')}>
        <div className="flex flex-wrap gap-2 pt-1">
          {conditions.length === 0 && <p className="text-xs text-gray-400 py-1">No conditions added.</p>}
          {conditions.map(c => (
            <TagChip key={c} label={c} onRemove={() => setConditions(conditions.filter(x => x !== c))} />
          ))}
          <motion.button whileTap={{ scale: 0.93 }}
            onClick={() => addTag(conditions, setConditions, 'Enter health condition')}
            className="inline-flex items-center gap-1 text-xs text-gray-400 font-semibold px-3 py-1.5 rounded-full border border-dashed border-gray-200 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-3 h-3" /> {t('addCondition', 'Add condition')}
          </motion.button>
        </div>
      </Section>

      {/* Allergies */}
      <Section title={t('allergies', 'Allergies')}>
        <div className="flex flex-wrap gap-2 pt-1">
          {allergies.length === 0 && <p className="text-xs text-gray-400 py-1">No allergies recorded.</p>}
          {allergies.map(a => (
            <TagChip key={a} label={a} onRemove={() => setAllergies(allergies.filter(x => x !== a))} />
          ))}
          <motion.button whileTap={{ scale: 0.93 }}
            onClick={() => addTag(allergies, setAllergies, 'Enter allergy')}
            className="inline-flex items-center gap-1 text-xs text-gray-400 font-semibold px-3 py-1.5 rounded-full border border-dashed border-gray-200 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-3 h-3" /> {t('addAllergy', 'Add allergy')}
          </motion.button>
        </div>
      </Section>

      {/* Emergency Contact */}
      {patient.emergencyContactName && (
        <Section title="Emergency Contact">
          <div className="py-2">
            <p className="text-sm font-semibold text-gray-800">{patient.emergencyContactName}</p>
            <p className="text-xs text-gray-500 mt-0.5">+91 {patient.emergencyContactPhone}</p>
          </div>
        </Section>
      )}

      {/* Settings */}
      <Section title={t('settings', 'Settings')}>
        {/* Language */}
        <button
          onClick={() => setShowLangPicker(true)}
          className="w-full py-3 border-b border-gray-50 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">{t('language', 'Language')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="text-sm font-semibold">{lang}</span>
            <span className="text-[10px] text-gray-400">({currentLangNative})</span>
          </div>
        </button>
        {/* Notifications */}
        <div className="py-3 flex items-center justify-between">
          <span className="text-sm text-gray-700">{t('notifications', 'Notifications')}</span>
          <button
            onClick={() => setNotifications(n => !n)}
            className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <motion.div
              animate={{ x: notifications ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5"
            />
          </button>
        </div>
      </Section>

      {/* Logout */}
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => { clearPatient(); navigate('/'); }}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t('logout', 'Logout')}
      </motion.button>

      {/* Language Picker */}
      <AnimatePresence>
        {showLangPicker && (
          <LanguagePicker
            current={lang}
            onSelect={handleLangSelect}
            onClose={() => setShowLangPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
