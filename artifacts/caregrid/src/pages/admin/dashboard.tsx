import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Users, Clock, Stethoscope, Package, Zap, AlertTriangle,
  BedDouble, Building2, TrendingUp, TrendingDown, Bell,
  ChevronRight, LogOut, Shield,
} from 'lucide-react';
import { CENTERS, AI_ACTIONS } from '@/lib/data';
import { useStockRequestStore } from '../stock/stockRequestStore';
import { useAdminSession, adminSessionActions } from '@/lib/adminStore';
import { useAppDB } from '@/lib/appDB';
import { toast } from 'sonner';

/* ── Live clock ─────────────────────────────────────────── */
function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return t;
}

/* ── Health score ───────────────────────────────────────── */
function healthScore(c: typeof CENTERS[0]): number {
  const meds     = c.medicines;
  const doctors  = Math.round((c.doctors / c.doctorsTotal) * 100);
  const beds     = c.bedsTotal > 0 ? Math.round(((c.bedsTotal - c.beds) / c.bedsTotal) * 100) : 50;
  const tests    = c.tests;
  const wait     = c.waitMins <= 30 ? 100 : c.waitMins <= 60 ? 70 : c.waitMins <= 90 ? 40 : 20;
  return Math.round((meds + doctors + beds + tests + wait) / 5);
}

function districtScore(centers: typeof CENTERS): number {
  return Math.round(centers.reduce((s, c) => s + healthScore(c), 0) / centers.length);
}

export default function AdminDashboard() {
  const time = useClock();
  const session = useAdminSession();
  const appDB = useAppDB();
  const { requests, notifications } = useStockRequestStore();
  const unreadAdmin = notifications.filter(n => n.for === 'admin' && !n.read).length;
  const pendingReqs = requests.filter(r => r.status === 'pending_approval').length;
  const aiPending   = AI_ACTIONS.filter(a => !a.approved && !a.rejected).length;

  // Live stats from appDB (start at 0, grow as users enter real data)
  const stats       = appDB.districtStats;
  const score       = Math.max(0, Math.min(100, 100 - (
    (stats.totalBedsFree === 0 && stats.totalBedsTotal > 0 ? 30 : 0) +
    (stats.totalDoctorsOnDuty === 0 ? 20 : 0) +
    (pendingReqs > 5 ? 15 : pendingReqs > 0 ? 5 : 0)
  )));

  const hour     = time.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Use CENTERS for facility list (static PHC config, not patient data)
  const totalPatients = stats.totalPatientsToday;
  const activeDoctors = stats.totalDoctorsOnDuty;
  const freeBeds      = stats.totalBedsFree;
  const criticalCount = CENTERS.filter(c => c.status === 'critical').length;
  const avgWait       = Math.round(CENTERS.reduce((s, c) => s + c.waitMins, 0) / CENTERS.length);

  const KPIs = [
    { label: 'Total PHCs/CHCs', value: String(CENTERS.length),  icon: Building2,   color: 'blue',   trend: null },
    { label: 'Patients Today',  value: String(totalPatients),   icon: Users,       color: 'green',  trend: null },
    { label: 'Active Doctors',  value: String(activeDoctors),   icon: Stethoscope, color: 'cyan',   trend: null },
    { label: 'Free Beds',       value: String(freeBeds),        icon: BedDouble,   color: freeBeds < 10 ? 'red' : 'emerald', trend: null },
    { label: 'Stock Alerts',    value: String(requests.filter(r=>r.status==='pending_approval').length + 3), icon: Package, color: 'orange', trend: 'urgent' },
    { label: 'Avg Wait Time',   value: `${avgWait}m`,           icon: Clock,       color: 'purple', trend: avgWait > 60 ? '+high' : '-ok' },
    { label: 'AI Actions',      value: String(aiPending + pendingReqs), icon: Zap, color: 'yellow', trend: aiPending > 0 ? 'pending' : null },
    { label: 'District Score',  value: `${score}`,              icon: Shield,      color: score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red', trend: null },
  ];

  const colorMap: Record<string, { card: string; icon: string }> = {
    blue:    { card: 'bg-blue-50 border-blue-100',    icon: 'text-blue-600'    },
    green:   { card: 'bg-green-50 border-green-100',  icon: 'text-green-600'   },
    cyan:    { card: 'bg-cyan-50 border-cyan-100',    icon: 'text-cyan-600'    },
    emerald: { card: 'bg-emerald-50 border-emerald-100', icon: 'text-emerald-600' },
    red:     { card: 'bg-red-50 border-red-100',      icon: 'text-red-600'     },
    orange:  { card: 'bg-orange-50 border-orange-100', icon: 'text-orange-600' },
    purple:  { card: 'bg-purple-50 border-purple-100', icon: 'text-purple-600' },
    yellow:  { card: 'bg-yellow-50 border-yellow-100', icon: 'text-yellow-600' },
  };

  const morningBrief = [
    criticalCount > 0 ? `${criticalCount} PHC(s) require immediate attention.` : null,
    pendingReqs > 0 ? `${pendingReqs} medicine request(s) awaiting your approval.` : null,
    aiPending > 0 ? `${aiPending} AI recommendation(s) pending review.` : null,
    freeBeds < 10 ? 'Bed availability critically low district-wide.' : null,
    'Dengue symptom trend increased by 21% this week.',
  ].filter(Boolean) as string[];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white px-4 pt-5 pb-6 rounded-b-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-indigo-200 text-[11px] font-semibold">
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <h1 className="text-base font-black mt-0.5">{greeting},</h1>
            <p className="text-indigo-200 text-xs">{session?.role ?? 'District Administrator'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/ai">
              <div className="relative p-2 bg-white/10 rounded-xl">
                <Bell className="w-4 h-4 text-white" />
                {(unreadAdmin + pendingReqs) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                    {unreadAdmin + pendingReqs}
                  </span>
                )}
              </div>
            </Link>
            <button onClick={() => { adminSessionActions.logout(); toast.success('Logged out.'); }}
              className="p-2 bg-white/10 rounded-xl">
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        {/* District badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-indigo-100 text-[10px] font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />
            {session?.district ?? 'District'} · LIVE
          </span>
          <span className="text-[10px] text-indigo-300">{CENTERS.length} Health Centres Active</span>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          {KPIs.map((k, i) => {
            const Icon = k.icon;
            const c = colorMap[k.color] ?? colorMap.blue;
            return (
              <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-xl border p-3 ${c.card}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${c.icon}`} />
                  {k.trend && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      k.trend.startsWith('+') ? 'bg-green-100 text-green-700' :
                      k.trend === 'urgent' || k.trend === 'pending' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{k.trend}</span>
                  )}
                </div>
                <p className="text-xl font-black text-gray-900 leading-none">{k.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{k.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* AI Morning Brief */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-start gap-2.5 mb-3">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold">🤖 AI Morning Brief</p>
              <p className="text-[11px] text-indigo-200 mt-0.5">Today's District Intelligence Summary</p>
            </div>
          </div>
          <div className="space-y-2">
            {morningBrief.map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/10 rounded-lg px-2.5 py-2">
                <span className="text-indigo-300 text-[10px] mt-0.5 shrink-0">•</span>
                <p className="text-[11px] text-indigo-100">{item}</p>
              </div>
            ))}
          </div>
          <Link href="/admin/ai">
            <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-white text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors">
              View AI Recommendations <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        {/* PHC Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-800">PHC Health Score</p>
            <Link href="/admin/map"><span className="text-[11px] text-indigo-600 font-semibold">View Map →</span></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {[...CENTERS].sort((a, b) => healthScore(a) - healthScore(b)).map(c => {
              const hs = healthScore(c);
              const color = hs >= 70 ? 'bg-green-500' : hs >= 45 ? 'bg-yellow-400' : 'bg-red-500';
              const badge = hs >= 70 ? 'bg-green-50 text-green-700' : hs >= 45 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700';
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{c.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${hs}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono w-6">{hs}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                    {hs >= 70 ? 'Healthy' : hs >= 45 ? 'Warning' : 'Critical'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-xs font-bold text-gray-800">Active Alerts</p>
            <span className="ml-auto text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
              {AI_ACTIONS.filter(a => a.severity === 'critical').length} Critical
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {AI_ACTIONS.slice(0, 3).map(a => (
              <div key={a.id} className={`px-4 py-3 border-l-4 ${
                a.severity === 'critical' ? 'border-red-500' : a.severity === 'warning' ? 'border-orange-400' : 'border-blue-400'
              }`}>
                <p className="text-xs font-bold text-gray-800">{a.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{a.phcName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{a.message}</p>
                <Link href="/admin/ai">
                  <span className="text-[10px] text-indigo-600 font-semibold mt-1 inline-block">Review →</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
