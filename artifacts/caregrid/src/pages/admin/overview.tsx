import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Stethoscope, Package, Zap, Truck,
  TrendingUp, TrendingDown, AlertTriangle, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CENTERS, DISTRICT_KPIS, AI_ACTIONS, FOOTFALL_WEEKLY, BED_OCCUPANCY,
} from '@/lib/data';

/* ── KPI cards ─────────────────────────────────────────── */
const KPI_CARDS = [
  { label: 'Patients Today',       value: '486',     trend: '+12%', up: true,  color: 'blue',   icon: Users       },
  { label: 'Avg Wait',             value: '52 min',  trend: '-8%',  up: false, color: 'green',  icon: Clock       },
  { label: 'Doctor Attendance',    value: '71%',     trend: '-3%',  up: false, color: 'yellow', icon: Stethoscope },
  { label: 'Stock-Outs',           value: '3',       trend: 'critical', up: false, color: 'red', icon: Package  },
  { label: 'AI Actions Pending',   value: String(DISTRICT_KPIS.pendingAiActions), trend: 'pending', up: false, color: 'purple', icon: Zap },
  { label: 'Ambulance Response',   value: '8.4 min', trend: 'avg',  up: true,  color: 'teal',   icon: Truck       },
];

const COLOR_MAP: Record<string, { bg: string; icon: string; badge: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700'   },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  yellow: { bg: 'bg-amber-50',  icon: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600',    badge: 'bg-red-100 text-red-700'     },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600',   badge: 'bg-teal-100 text-teal-700'   },
};

/* ── SVG map coordinate transform ─────────────────────── */
// lat: 11.01..11.09, lng: 77.03..77.10
const LAT_MIN = 11.01; const LAT_MAX = 11.09;
const LNG_MIN = 77.03; const LNG_MAX = 77.10;
const MAP_W = 520; const MAP_H = 340;

function latlng2xy(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
  const y = MAP_H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return { x, y };
}

const STATUS_PIN: Record<string, string> = {
  critical: '#ef4444',
  warning:  '#f97316',
  healthy:  '#22c55e',
};

type TooltipCenter = typeof CENTERS[0] | null;

/* ── Road connections ──────────────────────────────────── */
const ROADS: Array<[string, string]> = [
  ['phc-01', 'chc-01'],
  ['chc-01', 'phc-02'],
  ['chc-01', 'phc-03'],
  ['chc-01', 'phc-04'],
  ['phc-01', 'phc-04'],
];

export default function AdminOverview() {
  const [tooltipCenter, setTooltipCenter] = useState<TooltipCenter>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const sorted = [...CENTERS].sort((a, b) => b.riskScore - a.riskScore);

  const bedOccupancyColored = BED_OCCUPANCY.map(d => ({
    ...d,
    fill: d.pct >= 90 ? '#ef4444' : d.pct >= 70 ? '#f97316' : '#22c55e',
  }));

  return (
    <div className="p-5 space-y-5 min-h-full">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-6 gap-3">
        {KPI_CARDS.map((kpi, i) => {
          const c = COLOR_MAP[kpi.color];
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
            >
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${c.icon}`} />
              </div>
              <p className="text-lg font-bold text-gray-900 leading-none">{kpi.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{kpi.label}</p>
              <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${c.badge}`}>
                {kpi.up ? <TrendingUp className="inline w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="inline w-2.5 h-2.5 mr-0.5" />}
                {kpi.trend}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* ── Map + Right Panel ── */}
      <div className="flex gap-4">
        {/* SVG District Map */}
        <div className="flex-1 bg-[#1a2744] rounded-xl border border-[#243660] overflow-hidden relative" style={{ height: 420 }}>
          {/* Live badge */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#0d1a30]/80 backdrop-blur px-2 py-1 rounded-full border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-[10px] text-green-300 font-medium">Live</span>
          </div>

          <svg width="100%" height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
            {/* Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map(t => (
              <g key={t}>
                <line x1={MAP_W * t} y1={0} x2={MAP_W * t} y2={MAP_H} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                <line x1={0} y1={MAP_H * t} x2={MAP_W} y2={MAP_H * t} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              </g>
            ))}

            {/* Roads */}
            {ROADS.map(([fromId, toId]) => {
              const from = CENTERS.find(c => c.id === fromId)!;
              const to = CENTERS.find(c => c.id === toId)!;
              const p1 = latlng2xy(from.lat, from.lng);
              const p2 = latlng2xy(to.lat, to.lng);
              return (
                <line
                  key={`${fromId}-${toId}`}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="rgba(99,179,237,0.25)" strokeWidth={2} strokeDasharray="4 4"
                />
              );
            })}

            {/* Center pins */}
            {CENTERS.map(center => {
              const { x, y } = latlng2xy(center.lat, center.lng);
              const color = STATUS_PIN[center.status];
              return (
                <g
                  key={center.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => {
                    setTooltipCenter(center);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setTooltipCenter(null)}
                >
                  {/* Pulsing ring for critical */}
                  {center.status === 'critical' && (
                    <circle cx={x} cy={y} r={18} fill="none" stroke={color} strokeWidth={2} opacity={0.4} className="pulse-ring" />
                  )}
                  <circle cx={x} cy={y} r={10} fill={color} opacity={0.2} />
                  <circle cx={x} cy={y} r={7} fill={color} />
                  <circle cx={x} cy={y} r={3} fill="white" />
                  {/* Label */}
                  <text x={x} y={y + 22} textAnchor="middle" fill="white" fontSize={9} fontWeight={600} opacity={0.85}>
                    {center.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-[#0d1a30]/80 backdrop-blur px-2.5 py-1.5 rounded-lg border border-white/10">
            {[['Critical', '#ef4444'], ['Warning', '#f97316'], ['Healthy', '#22c55e']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-gray-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Hover tooltip */}
          <AnimatePresence>
            {tooltipCenter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-3 min-w-[160px] z-20 border border-gray-100"
                style={{ pointerEvents: 'none' }}
              >
                <p className="font-bold text-xs text-gray-900">{tooltipCenter.name}</p>
                <div className="mt-1.5 space-y-0.5 text-[10px] text-gray-600">
                  <div className="flex justify-between gap-4"><span>Crowd</span><span className="font-medium capitalize">{tooltipCenter.crowd}</span></div>
                  <div className="flex justify-between gap-4"><span>Beds</span><span className="font-medium">{tooltipCenter.beds}/{tooltipCenter.bedsTotal}</span></div>
                  <div className="flex justify-between gap-4"><span>Doctors</span><span className="font-medium">{tooltipCenter.doctors}/{tooltipCenter.doctorsTotal}</span></div>
                  <div className="flex justify-between gap-4"><span>Wait</span><span className="font-medium">{tooltipCenter.waitMins} min</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel */}
        <div className="w-72 shrink-0 flex flex-col gap-4" style={{ height: 420 }}>
          {/* Active Alerts */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex-1 overflow-auto">
            <h3 className="font-bold text-xs text-gray-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              🚨 Active Alerts ({AI_ACTIONS.filter(a => a.severity === 'critical').length + AI_ACTIONS.filter(a => a.severity === 'warning').length})
            </h3>
            <div className="space-y-2">
              {AI_ACTIONS.slice(0, 3).map(action => (
                <div
                  key={action.id}
                  className={`border-l-2 pl-2 py-1 ${
                    action.severity === 'critical' ? 'border-red-500' : action.severity === 'warning' ? 'border-orange-400' : 'border-blue-400'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-gray-800 leading-tight">{action.title}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{action.phcName}</p>
                  <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{action.message}</p>
                  <Link href="/admin/ai">
                    <span className="text-[10px] text-blue-600 font-medium hover:underline inline-flex items-center gap-0.5 mt-0.5 cursor-pointer">
                      → Review
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* PHC Rankings */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <h3 className="font-bold text-xs text-gray-800 mb-2">PHC Rankings</h3>
            <div className="space-y-2">
              {sorted.map((center, idx) => (
                <div key={center.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 w-4">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-800 truncate">{center.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-0.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          center.riskScore >= 70 ? 'bg-red-500' : center.riskScore >= 40 ? 'bg-orange-400' : 'bg-green-500'
                        }`}
                        style={{ width: `${center.riskScore}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    center.status === 'critical' ? 'bg-red-100 text-red-700' :
                    center.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {center.riskScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Charts ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Footfall Weekly */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h3 className="font-bold text-xs text-gray-800 mb-3">Patient Footfall — This Week</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={FOOTFALL_WEEKLY} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                cursor={{ fill: 'rgba(59,130,246,0.05)' }}
              />
              <Bar dataKey="patients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bed Occupancy */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h3 className="font-bold text-xs text-gray-800 mb-3">Bed Occupancy by Center (%)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={bedOccupancyColored} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="center" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                formatter={(v: number) => [`${v}%`, 'Occupancy']}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {bedOccupancyColored.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
