import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Calendar, AlertTriangle, Clock, BedDouble,
  Stethoscope, MapPin, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { CENTERS } from '@/lib/data';
import { useTranslation } from '@/lib/translations';
import { getPatient, getAge, getInitials } from '@/lib/patientStore';

/* ── Haversine ──────────────────────────────────────────── */
function dist(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

const CROWD_STYLE: Record<string, { dot: string; card: string }> = {
  high:     { dot: 'bg-red-500',   card: 'border-red-200 bg-red-50/30'     },
  moderate: { dot: 'bg-amber-400', card: 'border-amber-200 bg-amber-50/30' },
  low:      { dot: 'bg-green-500', card: 'border-green-200 bg-green-50/20' },
};

export default function PatientHome() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const patient = getPatient();

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(() => {
    try { const s = localStorage.getItem('user_pos'); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(c);
        localStorage.setItem('user_pos', JSON.stringify(c));
      },
      () => { if (!userPos) setUserPos({ lat: 11.0168, lng: 76.9558 }); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const sortedCenters = useMemo(() => {
    if (!userPos) return CENTERS;
    return [...CENTERS].sort((a, b) => {
      const d1 = (a.lat - userPos.lat) ** 2 + (a.lng - userPos.lng) ** 2;
      const d2 = (b.lat - userPos.lat) ** 2 + (b.lng - userPos.lng) ** 2;
      return d1 - d2;
    });
  }, [userPos]);

  const topCenters = sortedCenters.slice(0, 3);
  const recommended = sortedCenters.find(c => c.status === 'healthy') ?? sortedCenters[0];
  const recDist = userPos ? dist(userPos.lat, userPos.lng, recommended.lat, recommended.lng) : '2.1 km';

  /* personalised health tips based on conditions */
  const healthTips = useMemo(() => {
    const tips: { icon: string; title: string; desc: string; color: string; badge: string }[] = [];
    const conds = patient?.conditions ?? [];
    if (conds.some(c => /diabet/i.test(c)))
      tips.push({ icon: '🩸', title: 'Diabetes Tip', desc: 'Check blood sugar levels daily. Avoid sugary foods and drinks.', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' });
    if (conds.some(c => /hypertension|blood pressure/i.test(c)))
      tips.push({ icon: '❤️', title: 'BP Management', desc: 'Reduce salt intake. Take medications on time. Avoid stress.', color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700' });
    if (conds.some(c => /asthma/i.test(c)))
      tips.push({ icon: '🌬️', title: 'Asthma Alert', desc: 'Carry inhaler always. Avoid dust and smoke. Monitor peak flow.', color: 'bg-sky-50 border-sky-200', badge: 'bg-sky-100 text-sky-700' });
    // General advisories always shown
    tips.push({ icon: '🌡️', title: 'Heatwave Advisory', desc: 'Stay hydrated. Avoid outdoor activity 12 pm – 4 pm.', color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700' });
    tips.push({ icon: '🦟', title: 'Dengue Alert', desc: 'Dengue cases rising. Use mosquito repellent and nets.', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' });
    return tips.slice(0, 3);
  }, [patient]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <p className="font-bold text-gray-800">No profile found</p>
        <p className="text-sm text-gray-500">Please log out and register your health profile.</p>
        <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl">
          Go to Login
        </button>
      </div>
    );
  }

  const age = getAge(patient.dob);
  const initials = getInitials(patient.name);
  const primaryAllergy = patient.allergies[0] ?? 'None';

  return (
    <div className="pt-6 pb-6 space-y-4 px-4">

      {/* ABHA Health Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg,#0B6CBB,#084e8a)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200 mb-1">
              {t('abhaCard', 'ABHA Health Card')}
            </p>
            <p className="font-black text-base truncate">{patient.name}</p>
            <p className="text-blue-200 text-[10px] mt-0.5 font-mono">{patient.abhaId}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {[
                [t('blood', 'Blood'), patient.bloodGroup],
                [t('age', 'Age'), String(age)],
                [t('allergy', 'Allergy'), primaryAllergy],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-[9px] text-blue-300">{l}</p>
                  <p className="text-[11px] font-bold text-white">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0 ml-3">
            <span className="text-white font-black text-lg">{initials}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/15">
          <p className="text-[9px] text-blue-200 text-center tracking-[0.25em] font-mono">
            ██████████████████████████████
          </p>
        </div>
      </motion.div>

      {/* AI Recommendation */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🤖</span>
          <p className="text-xs font-bold text-gray-900">{t('aiRecommends', 'AI Recommends')}</p>
          <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold border border-purple-200">
            {t('basedOnFactors', 'Based on 5 factors')}
          </span>
        </div>
        <p className="text-sm font-black text-blue-700">{recommended.name}</p>
        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
          {[
            `${recommended.waitMins} ${t('minWait', 'min wait')}`,
            `${recommended.doctors} ${t('doctors', 'doctors')}`,
            `${recommended.beds} ${t('beds', 'beds')} free`,
            recDist,
            'Medicines stocked',
          ].map(chip => (
            <span key={chip} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
              {chip}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/patient/appointment')}
            className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
            {t('bookAppointment', 'Book Appointment')}
          </button>
          <button onClick={() => navigate('/patient/map')}
            className="flex-1 py-2 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl hover:bg-purple-100 transition-colors">
            {t('viewMaps', 'View Maps')}
          </button>
        </div>
      </motion.div>

      {/* Nearby Centres */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-700">{t('nearbyCentres', 'Nearby Health Centres')}</p>
          <button onClick={() => navigate('/patient/map')} className="text-[11px] text-blue-600 font-semibold">
            {t('viewMapArrow', 'View Map →')}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {topCenters.map(c => {
            const cs = CROWD_STYLE[c.crowd] ?? CROWD_STYLE.low;
            const centerDist = userPos ? dist(userPos.lat, userPos.lng, c.lat, c.lng) : '—';
            return (
              <div key={c.id} className={`shrink-0 min-w-[160px] rounded-2xl border p-3 ${cs.card}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-2 h-2 rounded-full ${cs.dot}`} />
                  <p className="text-[11px] font-bold text-gray-800 truncate">{c.name}</p>
                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 rounded-full font-medium ml-auto shrink-0">{c.type}</span>
                </div>
                <div className="space-y-1">
                  {([
                    [<Clock className="w-3 h-3" key="c" />, `${c.waitMins} ${t('minWait', 'min wait')}`],
                    [<Stethoscope className="w-3 h-3" key="s" />, `${c.doctors}/${c.doctorsTotal} ${t('doctors', 'doctors')}`],
                    [<BedDouble className="w-3 h-3" key="b" />, `${c.beds} ${t('beds', 'beds')}`],
                    [<MapPin className="w-3 h-3" key="m" />, `~${centerDist}`],
                  ] as [React.ReactNode, string][]).map(([icon, text], i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <span className="text-gray-400">{icon}</span>{text}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-bold text-gray-700 mb-2">{t('quickActions', 'Quick Actions')}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Calendar className="w-5 h-5 text-blue-600" />, label: t('bookAppointment', 'Book Appointment'), color: 'bg-blue-50', action: () => navigate('/patient/appointment') },
            { icon: <AlertTriangle className="w-5 h-5 text-rose-700" />, label: t('emergencySos', 'Emergency SOS'), color: 'bg-rose-100', action: () => toast.error(t('sosSent', '🚨 SOS sent! Help is on the way.')) },
          ].map(a => (
            <motion.button key={a.label} whileTap={{ scale: 0.93 }} onClick={a.action}
              className="flex flex-col items-center gap-1.5 py-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>{a.icon}</div>
              <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Personalised Health Advisories */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-bold text-gray-700">{t('healthAdvisories', 'Health Advisories')}</p>
        {healthTips.map((tip, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className={`flex items-center gap-3 border rounded-xl p-3 ${tip.color}`}
          >
            <span className="text-xl shrink-0">{tip.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">{tip.title}</p>
              <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{tip.desc}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${tip.badge}`}>
              {i === 0 && patient.conditions.length > 0 ? 'Personal' : i < healthTips.length - 2 ? 'Personal' : 'Alert'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
