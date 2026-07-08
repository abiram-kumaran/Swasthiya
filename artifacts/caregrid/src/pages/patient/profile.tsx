import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Plus, X, Phone, Clock, LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation, Language } from '@/lib/translations';

/* ─── Editable Field ──────────────────────────────────────── */
function EditableField({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => { onChange(draft); setEditing(false); };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-sm w-20 flex-shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 ml-3">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="flex-1 text-sm text-gray-800 bg-blue-50 rounded-lg px-3 py-1.5 outline-none border border-blue-200"
          />
          <button onClick={save} className="text-blue-600 text-xs font-bold">Save</button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 ml-3 justify-end">
          <span className="text-gray-800 font-semibold text-sm">{value}</span>
          <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-blue-500 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Tag Chip ────────────────────────────────────────────── */
function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold
      px-3 py-1.5 rounded-full border border-blue-100"
    >
      {label}
      <button onClick={onRemove} className="text-blue-400 hover:text-blue-700">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.span>
  );
}

/* ─── Section Card ────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-5 pt-4 pb-1">{title}</p>
      <div className="px-5 pb-4">{children}</div>
    </div>
  );
}

/* ─── Profile Page ────────────────────────────────────────── */
export default function PatientProfile() {
  const [, navigate] = useLocation();
  const { t, lang, changeLanguage } = useTranslation();
  const [name, setName] = useState('Rahul Kumar');
  const [health, setHealth] = useState({ blood: 'B+', age: '34', weight: '72 kg', height: '175 cm' });
  const [conditions, setConditions] = useState(['Hypertension', 'Seasonal Allergies']);
  const [allergies, setAllergies] = useState(['Penicillin']);
  const [notifications, setNotifications] = useState(true);

  const addTag = (list: string[], setList: (v: string[]) => void, promptMsg: string) => {
    const val = window.prompt(promptMsg);
    if (val?.trim()) setList([...list, val.trim()]);
  };

  const HISTORY = [
    { date: 'Jun 28, 2026', clinic: 'Kalapatti PHC', diagnosis: 'Routine Checkup', doctor: 'Dr. Sharma' },
    { date: 'May 15, 2026', clinic: 'Peelamedu CHC', diagnosis: 'Seasonal Allergy', doctor: 'Dr. Priya' },
    { date: 'Mar 3, 2026', clinic: 'Singanallur Urban PHC', diagnosis: 'Viral Fever', doctor: 'Dr. Arjun' },
  ];

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Avatar header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center py-4"
      >
        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-3 shadow-lg">
          <span className="text-white text-2xl font-black">RK</span>
        </div>
        <h1 className="text-xl font-black text-gray-900">{name}</h1>
        <p className="text-gray-400 text-sm">+91 98765 43210</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            const n = window.prompt('Enter your name', name);
            if (n?.trim()) setName(n.trim());
          }}
          className="mt-3 bg-blue-50 text-blue-600 text-xs font-bold px-4 py-2 rounded-full
            border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          {t('editProfile', 'Edit Profile')}
        </motion.button>
      </motion.div>

      {/* Health info */}
      <Section title={t('healthInfo', 'Health Information')}>
        <EditableField label={t('bloodGroup', 'Blood Group')} value={health.blood} onChange={v => setHealth(h => ({ ...h, blood: v }))} />
        <EditableField label={t('age', 'Age')} value={health.age} onChange={v => setHealth(h => ({ ...h, age: v }))} />
        <EditableField label={t('weight', 'Weight')} value={health.weight} onChange={v => setHealth(h => ({ ...h, weight: v }))} />
        <EditableField label={t('height', 'Height')} value={health.height} onChange={v => setHealth(h => ({ ...h, height: v }))} />
      </Section>

      {/* Conditions */}
      <Section title={t('currentIssues', 'Current Health Issues')}>
        <div className="flex flex-wrap gap-2 pt-1">
          {conditions.map(c => (
            <TagChip key={c} label={c} onRemove={() => setConditions(conditions.filter(x => x !== c))} />
          ))}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => addTag(conditions, setConditions, 'Enter health condition')}
            className="inline-flex items-center gap-1 text-xs text-gray-400 font-semibold px-3 py-1.5
              rounded-full border border-dashed border-gray-200 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-3 h-3" /> {t('addCondition', 'Add condition')}
          </motion.button>
        </div>
      </Section>

      {/* Allergies */}
      <Section title={t('allergies', 'Allergies')}>
        <div className="flex flex-wrap gap-2 pt-1">
          {allergies.map(a => (
            <TagChip key={a} label={a} onRemove={() => setAllergies(allergies.filter(x => x !== a))} />
          ))}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => addTag(allergies, setAllergies, 'Enter allergy')}
            className="inline-flex items-center gap-1 text-xs text-gray-400 font-semibold px-3 py-1.5
              rounded-full border border-dashed border-gray-200 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-3 h-3" /> {t('addAllergy', 'Add allergy')}
          </motion.button>
        </div>
      </Section>

      {/* Medical history */}
      <Section title={t('medicalHistory', 'Medical History')}>
        <div className="space-y-0 pt-1">
          {HISTORY.map((h, i) => (
            <div key={h.date} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                {i < HISTORY.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 my-1" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <Clock className="w-3 h-3 text-gray-300" />
                  <span className="text-[11px] text-gray-400">{h.date}</span>
                </div>
                <p className="text-sm font-bold text-gray-800">{h.diagnosis}</p>
                <p className="text-xs text-gray-400">{h.clinic} · {h.doctor}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Settings */}
      <Section title={t('settings', 'Settings')}>
        {/* Language */}
        <div className="py-3 border-b border-gray-50">
          <p className="text-sm text-gray-500 mb-2">{t('language', 'Language')}</p>
          <div className="flex gap-2">
            {['English', 'हिन्दी', 'தமிழ்'].map(l => (
              <button
                key={l}
                onClick={() => { changeLanguage(l as Language); toast.success(`Language set to ${l}`); }}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                  lang === l
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {/* Notifications */}
        <div className="py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">{t('notifications', 'Notifications')}</span>
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
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/')}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold
          py-4 rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t('logout', 'Logout')}
      </motion.button>
      <div className="h-2" />
    </div>
  );
}
