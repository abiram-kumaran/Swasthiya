import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  useGetCentersSummary,
  useListCenters,
  useGetEpidemicRadar,
  useGetRedistributionSuggestions,
  useApproveRedistribution,
} from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ArrowRightLeft, CheckCircle2, AlertTriangle,
  AlertOctagon, Users, Bed, ActivitySquare, Shield,
  Truck, MessageSquare, Thermometer, CloudRain, Wind,
  TrendingUp, Clock, MapPin, Zap, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/* ─── Mock district map coordinate system ─────────────────────
   We use a fixed SVG viewBox with preset coordinates per center.
   These are "stage" coords, not real lat/lng. ─────────────────*/
const CENTER_COORDS: Record<string, { x: number; y: number }> = {
  'PHC-Alpha':   { x: 210, y: 320 },
  'PHC-Beta':    { x: 430, y: 180 },
  'PHC-North':   { x: 560, y: 310 },
  'CHC-Central': { x: 370, y: 390 },
};

function getCenterCoords(name: string, lat?: number, lng?: number) {
  // Try named match first
  for (const [key, coords] of Object.entries(CENTER_COORDS)) {
    if (name?.toLowerCase().includes(key.toLowerCase().replace('phc-', '').replace('chc-', ''))) {
      return coords;
    }
  }
  // Fallback: spread by lat/lng normalised to SVG space
  if (lat !== undefined && lng !== undefined) {
    return { x: (lng / 100) * 720 + 40, y: (lat / 100) * 480 + 40 };
  }
  return { x: 300, y: 300 };
}

/* ─── KPI Card ────────────────────────────────────────────── */
function KPICard({
  title, value, sub, icon, color = 'blue', trend,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: 'blue' | 'red' | 'green' | 'yellow'; trend?: number;
}) {
  const palette = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    red:    'bg-red-50 text-red-600 border-red-100',
    green:  'bg-emerald-50 text-emerald-600 border-emerald-100',
    yellow: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border p-5 shadow-sm flex items-start gap-4 ${color === 'red' ? 'border-red-200' : 'border-gray-100'}`}
    >
      <div className={`p-3 rounded-xl border ${palette[color]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-3xl font-black tracking-tight ${color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-0.5 text-xs font-bold mt-1 ${trend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
          {Math.abs(trend)}%
        </div>
      )}
    </motion.div>
  );
}

/* ─── Epidemic Alert Card ─────────────────────────────────── */
function EpidemicCard({ alert }: { alert: {
  id: string; type: string; severity: string; message: string;
  affectedCenters: string[]; predictedSurgePercent: number; weatherTrigger?: string | null;
}}) {
  const severityIcon: Record<string, React.ReactNode> = {
    critical: <AlertOctagon className="w-4 h-4" />,
    warning:  <AlertTriangle className="w-4 h-4" />,
    info:     <Activity className="w-4 h-4" />,
  };
  const weatherIcon: Record<string, React.ReactNode> = {
    'Extreme Heat (40C+)': <Thermometer className="w-3.5 h-3.5" />,
    'Monsoon Season':       <CloudRain className="w-3.5 h-3.5" />,
  };
  const palette = alert.severity === 'critical'
    ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50 text-red-700'
    : 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-700';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative rounded-xl border p-4 overflow-hidden ${palette}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-400'}`} />
      <div className="pl-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {severityIcon[alert.severity]}
            <span className="font-bold text-sm leading-tight">{alert.type}</span>
          </div>
          <Badge className={`text-[10px] uppercase font-bold shrink-0 ${
            alert.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
          }`}>{alert.severity}</Badge>
        </div>
        <p className="text-xs leading-relaxed opacity-90 mb-3">{alert.message}</p>
        {alert.weatherTrigger && (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold opacity-80 mb-2">
            {weatherIcon[alert.weatherTrigger] ?? <Wind className="w-3.5 h-3.5" />}
            {alert.weatherTrigger}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {alert.affectedCenters.slice(0, 3).map(c => (
              <span key={c} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                alert.severity === 'critical' ? 'bg-red-100/60 border-red-200' : 'bg-amber-100/60 border-amber-200'
              }`}>{c}</span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-black">
            <TrendingUp className="w-3 h-3" />+{alert.predictedSurgePercent}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── District SVG Map ─────────────────────────────────────── */
function DistrictMap({
  centers,
  approvedRoutes,
}: {
  centers: Array<{id: number; name: string; type: string; lat: number; lng: number; status: string; activeBeds: number; bedCapacity: number; waitTimeMinutes?: number | null;}>;
  approvedRoutes: Array<{id: string; fromCenterName: string; toCenterName: string;}>;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const statusColor = (s: string) =>
    s === 'critical' ? '#d93025' : s === 'warning' ? '#f9ab00' : '#1e8e3e';
  const statusBg = (s: string) =>
    s === 'critical' ? '#fce8e6' : s === 'warning' ? '#fef9e0' : '#e6f4ea';

  return (
    <div className="relative w-full h-full min-h-[420px] bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(#1a73e8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* District boundary decoration */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 760 520" preserveAspectRatio="xMidYMid meet">
        {/* District shape */}
        <path
          d="M80 80 Q 200 40 420 60 T 680 120 Q 730 200 720 340 Q 700 440 580 470 Q 420 500 240 480 Q 100 460 60 360 Q 30 260 80 80 Z"
          fill="rgba(26,115,232,0.04)" stroke="rgba(26,115,232,0.15)" strokeWidth="1.5" strokeDasharray="6 4"
        />
        {/* Road network lines */}
        <line x1="210" y1="320" x2="370" y2="390" stroke="rgba(100,116,139,0.15)" strokeWidth="2" />
        <line x1="370" y1="390" x2="430" y2="180" stroke="rgba(100,116,139,0.15)" strokeWidth="2" />
        <line x1="430" y1="180" x2="560" y2="310" stroke="rgba(100,116,139,0.15)" strokeWidth="2" />
        <line x1="370" y1="390" x2="560" y2="310" stroke="rgba(100,116,139,0.15)" strokeWidth="2" />

        {/* Approved dispatch routes */}
        {approvedRoutes.map((route) => {
          const from = getCenterCoords(route.fromCenterName);
          const to = getCenterCoords(route.toCenterName);
          const cx = (from.x + to.x) / 2;
          const cy = Math.min(from.y, to.y) - 50;
          return (
            <g key={`route-${route.id}`}>
              <path
                d={`M${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                fill="none" stroke="#1a73e8" strokeWidth="2.5"
                strokeDasharray="10 6" className="map-path-draw" opacity="0.7"
              />
              <motion.circle
                cx={to.x} cy={to.y} r={5}
                fill="#1a73e8"
                animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </g>
          );
        })}

        {/* Center pins */}
        {centers.map((center) => {
          const coords = getCenterCoords(center.name, center.lat, center.lng);
          const isCritical = center.status === 'critical';
          const isWarning  = center.status === 'warning';
          const color = statusColor(center.status);
          const bg    = statusBg(center.status);
          const isHovered = hovered === center.name;
          const occupancy = Math.round((center.activeBeds / center.bedCapacity) * 100);

          return (
            <g key={center.id} transform={`translate(${coords.x},${coords.y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(center.name)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Pulse ring for critical */}
              {isCritical && (
                <motion.circle r={20} fill={color} opacity={0.15}
                  animate={{ scale: [1, 2.5, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                />
              )}
              {isWarning && (
                <motion.circle r={16} fill={color} opacity={0.12}
                  animate={{ scale: [1, 2, 1], opacity: [0.15, 0, 0.15] }}
                  transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                />
              )}

              {/* Pin circle */}
              <circle r={isHovered ? 13 : 11} fill={color} stroke="white" strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
              />
              {/* Type label inside */}
              <text textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="800" fill="white">
                {center.type}
              </text>

              {/* Tooltip on hover */}
              {isHovered && (
                <g>
                  <rect x={14} y={-40} width={130} height={56} rx={8} fill="white"
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }} />
                  <text x={20} y={-26} fontSize="10" fontWeight="700" fill="#1e293b">{center.name}</text>
                  <text x={20} y={-13} fontSize="9" fill="#64748b">
                    Beds: {center.activeBeds}/{center.bedCapacity} ({occupancy}%)
                  </text>
                  <text x={20} y={0} fontSize="9" fill={color} fontWeight="600">
                    ● {center.status.toUpperCase()}
                  </text>
                  {center.waitTimeMinutes && (
                    <text x={20} y={12} fontSize="9" fill="#64748b">
                      Wait: {Math.round(center.waitTimeMinutes / 60 * 10) / 10}h
                    </text>
                  )}
                </g>
              )}

              {/* Center name label */}
              <text x={0} y={22} textAnchor="middle" fontSize="9.5" fontWeight="700"
                fill={isCritical ? color : '#334155'}
                style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: '3px' }}
              >
                {center.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
        {[['#1e8e3e','Healthy'],['#f9ab00','Warning'],['#d93025','Critical']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            <span className="text-[10px] font-semibold text-gray-600">{l}</span>
          </div>
        ))}
      </div>

      {/* Live badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-100 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 blink" />
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Live Feed</span>
      </div>
    </div>
  );
}

/* ─── Redistribution Card ─────────────────────────────────── */
function RedistributionCard({
  suggestion,
  onApprove,
  isPending,
}: {
  suggestion: {
    id: string; fromCenterName: string; toCenterName: string;
    medicineName: string; quantity: number; reason: string;
    estimatedTransitMinutes?: number;
  };
  onApprove: () => void;
  isPending: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ x: '110%', opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">AI Recommendation</span>
          </div>
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
            {suggestion.quantity} units
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-gray-50 rounded-lg px-3 py-1.5">
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">From</p>
            <p className="text-sm font-bold text-gray-900 truncate">{suggestion.fromCenterName}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <div className="flex-1 bg-red-50 rounded-lg px-3 py-1.5">
            <p className="text-[9px] text-red-400 font-semibold uppercase tracking-wide">To (Critical)</p>
            <p className="text-sm font-bold text-red-700 truncate">{suggestion.toCenterName}</p>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed mb-3 line-clamp-2">{suggestion.reason}</p>

        <div className="flex items-center gap-2 mb-3 text-[10px] text-gray-400">
          <Clock className="w-3 h-3" />
          <span>~{suggestion.estimatedTransitMinutes ?? 35} min transit</span>
          <span>•</span>
          <Truck className="w-3 h-3" />
          <span>{suggestion.medicineName}</span>
        </div>

        <Button
          onClick={onApprove}
          disabled={isPending}
          className="w-full h-10 font-bold text-sm bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Approve & Dispatch
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────── */
export default function Dashboard() {
  const { data: summary }         = useGetCentersSummary({ query: { queryKey: ['centers-summary'] } });
  const { data: centers }         = useListCenters({ query: { queryKey: ['list-centers'] } });
  const { data: epidemicAlerts }  = useGetEpidemicRadar({ query: { queryKey: ['epidemic-radar'] } });
  const { data: redistributions } = useGetRedistributionSuggestions({ query: { queryKey: ['redistribution'] } });
  const approveRedistribution     = useApproveRedistribution();

  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [approvedRoutes, setApprovedRoutes] = useState<Array<{id: string; fromCenterName: string; toCenterName: string;}>>([]);

  const handleApprove = (id: string) => {
    const suggestion = redistributions?.find(r => r.id === id);
    approveRedistribution.mutate({ id }, {
      onSuccess: () => {
        setApprovedIds(prev => [...prev, id]);
        if (suggestion) {
          setApprovedRoutes(prev => [...prev, {
            id,
            fromCenterName: suggestion.fromCenterName,
            toCenterName: suggestion.toCenterName,
          }]);
        }
        toast.success('Dispatch approved! Driver app notified.', { duration: 3000 });
      },
    });
  };

  const pendingSuggestions = redistributions?.filter(r => !approvedIds.includes(r.id)) ?? [];

  const navLinks = [
    { href: '/dashboard', icon: <ActivitySquare className="w-5 h-5" />, label: 'Command' },
    { href: '/frontline', icon: <Users className="w-5 h-5" />, label: 'Frontline' },
    { href: '/dispatch',  icon: <Truck className="w-5 h-5" />, label: 'Dispatch' },
    { href: '/patient',   icon: <MessageSquare className="w-5 h-5" />, label: 'Patient' },
  ];

  return (
    <div className="flex h-screen bg-[#f0f4f9] overflow-hidden font-sans">

      {/* ── Left Sidebar ───────────────────────────────────── */}
      <aside className="w-[72px] flex-shrink-0 bg-[#174ea6] flex flex-col items-center py-5 gap-6 z-20 shadow-xl">
        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mb-2">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {navLinks.map(({ href, icon, label }) => (
            <Link key={href} href={href}>
              <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all gap-1 group
                ${href === '/dashboard'
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              >
                {icon}
                <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">{label}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/70 text-xs font-bold">
          DM
        </div>
      </aside>

      {/* ── Center Stage ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-[60px] flex items-center justify-between px-8 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-extrabold text-gray-900 leading-tight tracking-tight">
                District Command Dashboard
              </h1>
              <p className="text-[11px] text-gray-400 font-medium">CareGrid AI · District Operations Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 blink" />
              <span className="text-[11px] font-bold text-emerald-700">All Systems Operational</span>
            </div>
            <div className="text-xs text-gray-400 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">
          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-4">
            <KPICard
              title="Total Beds" value={summary?.totalBeds ?? '—'}
              sub={`${summary?.activeBeds ?? 0} currently occupied`}
              icon={<Bed className="w-4 h-4" />} color="blue"
            />
            <KPICard
              title="Active Staff" value={summary?.activeStaff ?? '—'}
              sub="Doctors checked in today"
              icon={<Users className="w-4 h-4" />} color="green"
            />
            <KPICard
              title="Critical Shortages" value={summary?.criticalShortages ?? '—'}
              sub="Centers at capacity or out of stock"
              icon={<AlertTriangle className="w-4 h-4" />}
              color={(summary?.criticalShortages ?? 0) > 0 ? 'red' : 'green'}
              trend={(summary?.criticalShortages ?? 0) > 0 ? 45 : undefined}
            />
            <KPICard
              title="Pending AI Actions" value={summary?.pendingAiActions ?? '—'}
              sub="Awaiting admin approval"
              icon={<Zap className="w-4 h-4" />} color="yellow"
            />
          </div>

          {/* Map */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-800">Live District Map</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{centers?.length ?? 0} health centers tracked</span>
              </div>
            </div>
            <div className="p-4 h-full" style={{ minHeight: 360 }}>
              <DistrictMap
                centers={(centers ?? []) as any}
                approvedRoutes={approvedRoutes}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Right Panel ────────────────────────────────────── */}
      <aside className="w-[360px] flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden shadow-xl">
        <header className="h-[60px] flex items-center gap-2.5 px-5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">AI Action Feed</h2>
          {pendingSuggestions.length > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendingSuggestions.length}
            </span>
          )}
        </header>

        <div className="flex-1 overflow-auto p-4 flex flex-col gap-5">
          {/* Epidemic Radar */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
              <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Epidemic Radar</h3>
            </div>
            <div className="flex flex-col gap-3">
              {(epidemicAlerts ?? []).map(alert => (
                <EpidemicCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Smart Redistribution */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Smart Redistribution</h3>
            </div>
            <AnimatePresence mode="popLayout">
              {pendingSuggestions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-400"
                >
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm font-semibold">All actions processed</p>
                </motion.div>
              ) : (
                pendingSuggestions.map(s => (
                  <RedistributionCard
                    key={s.id}
                    suggestion={s}
                    onApprove={() => handleApprove(s.id)}
                    isPending={approveRedistribution.isPending}
                  />
                ))
              )}
            </AnimatePresence>
          </section>
        </div>
      </aside>
    </div>
  );
}
