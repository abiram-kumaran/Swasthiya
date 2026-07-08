import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Calendar, Truck, AlertTriangle, Syringe, Search,
  Pill, ChevronRight, Clock, BedDouble, Stethoscope, MapPin,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { CENTERS, MEDICINES } from '@/lib/data';
import { useTranslation } from '@/lib/translations';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// --- Haversine distance ---
function dist(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

function MedicineLocator({ userPos }: { userPos: { lat: number; lng: number } | null }) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const results = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const query = debouncedSearch.toLowerCase();
    return MEDICINES.filter(m => m.name.toLowerCase().includes(query));
  }, [debouncedSearch]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm space-y-3">
      <div>
        <p className="text-xs font-bold text-gray-700">{t('medicineLocator', 'Medicine Locator')}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{t('medicineLocatorDesc', 'Find nearby medicine centres with available stock.')}</p>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-9 pr-9 py-2 border border-gray-200 rounded-xl text-xs focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
          placeholder={t('searchPlaceholder', 'Search medicine (e.g. Paracetamol)...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
          </button>
        )}
      </div>

      {debouncedSearch.trim() !== '' && (
        <div className="space-y-2 mt-2">
          {results.length > 0 ? (
            results.map(m => {
              const center = CENTERS.find(c => c.id === m.centerId);
              const distanceStr = userPos && center
                ? `~${dist(userPos.lat, userPos.lng, center.lat, center.lng)}`
                : `~${center?.waitMins || 15} mins`;
              return (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{m.centerName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${m.quantity > 0 ? (m.status === 'low' || m.status === 'critical' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700') : 'bg-red-100 text-red-700'}`}>
                        {m.quantity} {m.unit}
                      </span>
                      <span className="text-[10px] text-gray-500">{distanceStr} away</span>
                    </div>
                  </div>
                  <button onClick={() => navigate('/patient/map')} className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2.5 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                    {t('viewMaps', 'View Map')}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-gray-600">Medicine not available nearby.</p>
              <p className="text-[10px] text-gray-400 mt-1">Try searching for a different medicine.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CROWD_STYLE: Record<string, { dot: string; label: string; card: string }> = {
  high:     { dot:'bg-red-500',    label:'High Crowd',   card:'border-red-200 bg-red-50/30'    },
  moderate: { dot:'bg-amber-400',  label:'Moderate',     card:'border-amber-200 bg-amber-50/30' },
  low:      { dot:'bg-green-500',  label:'Low Crowd',    card:'border-green-200 bg-green-50/20' },
};

export default function PatientHome() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(() => {
    const saved = localStorage.getItem('user_pos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  // Track Geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        localStorage.setItem('user_pos', JSON.stringify(coords));
      },
      () => {
        if (!userPos) {
          setUserPos({ lat: 11.0168, lng: 76.9558 });
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Sort Health Centers by user proximity
  const sortedCenters = useMemo(() => {
    if (!userPos) return CENTERS;
    return [...CENTERS].sort((a, b) => {
      const d1 = Math.pow(a.lat - userPos.lat, 2) + Math.pow(a.lng - userPos.lng, 2);
      const d2 = Math.pow(b.lat - userPos.lat, 2) + Math.pow(b.lng - userPos.lng, 2);
      return d1 - d2;
    });
  }, [userPos]);

  const topCenters = sortedCenters.slice(0, 3);
  // Recommended center: nearest that is healthy, fallback to nearest center
  const recommended = sortedCenters.find(c => c.status === 'healthy') ?? sortedCenters[0];

  const recDistance = userPos
    ? dist(userPos.lat, userPos.lng, recommended.lat, recommended.lng)
    : '2.1 km';

  const QUICK_ACTIONS = [
    { icon:<Calendar className="w-5 h-5 text-blue-600" />,     label: t('bookAppointment', 'Book Appointment'), color:'bg-blue-50',   onClick: (nav: any) => nav('/patient/appointment') },
    { icon:<AlertTriangle className="w-5 h-5 text-rose-700" />,label: t('emergencySos', 'Emergency SOS'),    color:'bg-rose-100',  onClick: () => toast.error(t('sosSent', '🚨 SOS sent! Help is on the way.')) },
  ];

  return (
    <div className="pt-8 pb-4 space-y-4">
      <div className="px-4 space-y-4">
        {/* 1. ABHA Health Card */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          className="rounded-2xl p-4 text-white" style={{ background:'linear-gradient(135deg,#0B6CBB,#084e8a)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200 mb-1">{t('abhaCard', 'ABHA Health Card')}</p>
              <p className="font-black text-sm">Muthu Selvam</p>
              <p className="text-blue-200 text-[10px] mt-0.5">14-2345-6789-0001</p>
              <div className="flex items-center gap-3 mt-2">
                {[[t('blood', 'Blood'),'B+'],[t('age', 'Age'),'67'],[t('allergy', 'Allergy'),'Penicillin']].map(([l,v]) => (
                  <div key={l}>
                    <p className="text-[9px] text-blue-300">{l}</p>
                    <p className="text-[11px] font-bold text-white">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Profile Picture */}
            <div className="w-[80px] h-[80px] rounded-full border-2 border-white/20 shadow-sm flex items-center justify-center overflow-hidden bg-white/10 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=200&auto=format&fit=crop" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15">
            <p className="text-[9px] text-blue-200 text-center tracking-[0.3em] font-mono">████████████████████████</p>
          </div>
        </motion.div>

        {/* 2. AI Recommendation */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
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
            {[`${recommended.waitMins} ${t('minWait', 'min wait')}`, `${recommended.doctors} ${t('doctors', 'doctors')}`, `${t('beds', 'beds')} available`, recDistance, `Medicines stocked`].map(chip => (
              <span key={chip} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">{chip}</span>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => navigate('/patient/appointment')}
              className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              {t('bookAppointment', 'Book Appointment')}
            </button>
            <button onClick={() => navigate('/patient/map')}
              className="flex-1 py-2 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl hover:bg-purple-100 transition-colors"
            >
              {t('viewMaps', 'View Maps')}
            </button>
          </div>
        </motion.div>

        {/* 3. Nearby Centres */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-700">{t('nearbyCentres', 'Nearby Health Centres')}</p>
            <button onClick={() => navigate('/patient/map')} className="text-[11px] text-blue-600 font-semibold">
              {t('viewMapArrow', 'View Map →')}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth:'none' }}>
            {topCenters.map(c => {
              const cs = CROWD_STYLE[c.crowd];
              const centerDistance = userPos
                ? dist(userPos.lat, userPos.lng, c.lat, c.lng)
                : '2 km';
              return (
                <div key={c.id} className={`shrink-0 min-w-[160px] rounded-2xl border p-3 ${cs.card}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`w-2 h-2 rounded-full ${cs.dot}`} />
                    <p className="text-[11px] font-bold text-gray-800">{c.name}</p>
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 rounded-full font-medium ml-auto">{c.type}</span>
                  </div>
                  <div className="space-y-1">
                    {[[<Clock className="w-3 h-3" />,`${c.waitMins} ${t('minWait', 'min wait')}`],[<Stethoscope className="w-3 h-3" />,`${c.doctors}/${c.doctorsTotal} ${t('doctors', 'doctors')}`],[<BedDouble className="w-3 h-3" />,`${c.beds} ${t('beds', 'beds')}`],[<MapPin className="w-3 h-3" />, `~${centerDistance}`]].map(([icon, text], i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                        <span className="text-gray-400">{icon as React.ReactNode}</span>{text as string}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Medicine Locator */}
        <MedicineLocator userPos={userPos} />

        {/* 5. Quick Actions */}
        <div>
          <p className="text-xs font-bold text-gray-700 mb-2">{t('quickActions', 'Quick Actions')}</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(a => (
              <motion.button key={a.label} whileTap={{ scale:.93 }} onClick={() => a.onClick(navigate)}
                className="flex flex-col items-center gap-1.5 py-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>{a.icon}</div>
                <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 6. Health Alerts / AI Advisory */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-gray-700 mb-1">{t('healthAdvisories', 'Health Advisories')}</p>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <span className="text-lg">🌡️</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-red-700">{t('heatwaveAdvisory', 'Heatwave Advisory')}</p>
              <p className="text-[10px] text-red-500 mt-0.5">{t('heatwaveDesc', 'Stay hydrated. Avoid outdoor activity 12pm–4pm.')}</p>
            </div>
            <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">HIGH</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
            <span className="text-lg">🦟</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-orange-700">{t('dengueAlert', 'Dengue Alert — Karungal Ward')}</p>
              <p className="text-[10px] text-orange-500 mt-0.5">{t('dengueDesc', '14 cases detected. Use mosquito repellent.')}</p>
            </div>
            <span className="text-[9px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">WATCH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
