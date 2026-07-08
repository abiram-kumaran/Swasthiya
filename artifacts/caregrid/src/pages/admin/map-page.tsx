import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BedDouble, Stethoscope, Clock, Package, Activity } from 'lucide-react';
import { CENTERS, type PHC } from '@/lib/data';

const LAT_MIN = 11.00; const LAT_MAX = 11.10;
const LNG_MIN = 76.97; const LNG_MAX = 77.06;
const W = 360; const H = 300;

function toXY(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
  const y = H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
  return { x, y };
}

const STATUS_COLOR: Record<string, string> = {
  critical: '#ef4444', warning: '#f59e0b', healthy: '#22c55e',
};

const ROADS: [string, string][] = [
  ['phc-01','chc-01'], ['chc-01','phc-02'], ['chc-01','phc-03'],
  ['chc-01','phc-04'], ['phc-01','phc-04'],
];

function healthScore(c: PHC): number {
  const meds    = c.medicines;
  const doctors = Math.round((c.doctors / c.doctorsTotal) * 100);
  const beds    = c.bedsTotal > 0 ? Math.round(((c.bedsTotal - c.beds) / c.bedsTotal) * 100) : 50;
  const tests   = c.tests;
  const wait    = c.waitMins <= 30 ? 100 : c.waitMins <= 60 ? 70 : c.waitMins <= 90 ? 40 : 20;
  return Math.round((meds + doctors + beds + tests + wait) / 5);
}

export default function AdminMapPage() {
  const [selected, setSelected] = useState<PHC | null>(null);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <h1 className="text-sm font-bold mb-1">District Map</h1>
        <p className="text-indigo-200 text-[11px]">Tap a PHC node for live details</p>
        <div className="flex gap-3 mt-2">
          {[['🔴', 'Critical'], ['🟡', 'Warning'], ['🟢', 'Healthy']].map(([dot, label]) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-indigo-200">
              <span>{dot}</span>{label}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* SVG Map */}
        <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-[#1e293b] relative">
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 260 }}>
            {/* Grid */}
            {[0.25, 0.5, 0.75].map(t => (
              <g key={t}>
                <line x1={W*t} y1={0} x2={W*t} y2={H} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
                <line x1={0} y1={H*t} x2={W} y2={H*t} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
              </g>
            ))}
            {/* Roads */}
            {ROADS.map(([a, b]) => {
              const ca = CENTERS.find(c => c.id === a)!;
              const cb = CENTERS.find(c => c.id === b)!;
              if (!ca || !cb) return null;
              const p1 = toXY(ca.lat, ca.lng);
              const p2 = toXY(cb.lat, cb.lng);
              return <line key={`${a}-${b}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="rgba(148,163,184,0.15)" strokeWidth={1.5} strokeDasharray="4 3" />;
            })}
            {/* PHC nodes */}
            {CENTERS.map(c => {
              const {x, y} = toXY(c.lat, c.lng);
              const col = STATUS_COLOR[c.status];
              const isSelected = selected?.id === c.id;
              return (
                <g key={c.id} style={{cursor:'pointer'}} onClick={() => setSelected(c)}>
                  {c.status === 'critical' && (
                    <circle cx={x} cy={y} r={20} fill="none" stroke={col} strokeWidth={1.5} opacity={0.3}
                      className="animate-ping" />
                  )}
                  <circle cx={x} cy={y} r={isSelected ? 13 : 10} fill={col} opacity={0.25}/>
                  <circle cx={x} cy={y} r={isSelected ? 9 : 7} fill={col}/>
                  <circle cx={x} cy={y} r={isSelected ? 4 : 3} fill="white"/>
                  <text x={x} y={y+22} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={8} fontWeight={600}>
                    {c.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
          {/* Live badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur px-2 py-1 rounded-full border border-white/10">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full blink"/>
            <span className="text-[10px] text-green-300 font-medium">Live</span>
          </div>
        </div>

        {/* PHC Detail Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div>
                  <p className="text-xs font-bold text-gray-900">{selected.name}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    selected.status === 'critical' ? 'bg-red-100 text-red-700' :
                    selected.status === 'warning'  ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>{selected.status}</span>
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500"/>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-50">
                {[
                  { icon: Stethoscope, label: 'Doctors', value: `${selected.doctors}/${selected.doctorsTotal}`, color: selected.doctors < 2 ? 'text-red-600' : 'text-gray-800' },
                  { icon: BedDouble,   label: 'Beds Free', value: `${selected.beds}/${selected.bedsTotal}`,   color: selected.beds === 0 ? 'text-red-600' : 'text-gray-800' },
                  { icon: Clock,       label: 'Wait Time', value: `${selected.waitMins} min`,                  color: selected.waitMins > 90 ? 'text-red-600' : 'text-gray-800' },
                  { icon: Package,     label: 'Stock %',   value: `${selected.medicines}%`,                    color: selected.medicines < 30 ? 'text-red-600' : 'text-gray-800' },
                  { icon: Activity,    label: 'Footfall',  value: `${selected.footfallToday}/${selected.footfallCapacity}`, color: 'text-gray-800' },
                  { icon: Activity,    label: 'Health Score', value: String(healthScore(selected)),             color: healthScore(selected) < 50 ? 'text-red-600' : 'text-green-600' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3 text-gray-400" />
                      <p className="text-[9px] text-gray-400 uppercase">{label}</p>
                    </div>
                    <p className={`text-sm font-black ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All PHCs list */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-700">All Health Centres</p>
          {CENTERS.map(c => {
            const hs = healthScore(c);
            const col = hs >= 70 ? 'bg-green-500' : hs >= 45 ? 'bg-yellow-400' : 'bg-red-500';
            return (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full bg-white border rounded-xl p-3 text-left transition-all ${
                  selected?.id === c.id ? 'border-indigo-300 shadow-md' : 'border-gray-100 shadow-sm'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {c.doctors}/{c.doctorsTotal} doctors · {c.waitMins} min wait · {c.beds} beds free
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      c.status === 'critical' ? 'bg-red-100 text-red-700' :
                      c.status === 'warning'  ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>{c.status}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${col}`} style={{ width: `${hs}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-gray-400">{hs}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
