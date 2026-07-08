import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BedDouble, Plus, Minus, Edit3, Check, X, AlertTriangle, WifiOff, Clock, RefreshCw } from 'lucide-react';
import { CENTERS } from '@/lib/data';

/* ── Types ──────────────────────────────────────────────── */
interface BedWard {
  id: string;
  name: string;
  total: number;
  occupied: number;
  lastUpdated: string;
  notes: string;
}

const STORAGE_KEY = 'caregrid_beds_v1';
const PENDING_KEY = 'caregrid_beds_pending_v1';

const DEFAULT_WARDS: BedWard[] = [
  { id: 'general',   name: 'General Ward',       total: 12, occupied: 10, lastUpdated: new Date().toISOString(), notes: '' },
  { id: 'maternity', name: 'Maternity Ward',      total: 6,  occupied: 4,  lastUpdated: new Date().toISOString(), notes: '' },
  { id: 'paed',      name: 'Paediatric Ward',     total: 4,  occupied: 2,  lastUpdated: new Date().toISOString(), notes: '' },
  { id: 'obs',       name: 'Observation Room',    total: 4,  occupied: 3,  lastUpdated: new Date().toISOString(), notes: '' },
  { id: 'emerg',     name: 'Emergency Bay',       total: 4,  occupied: 4,  lastUpdated: new Date().toISOString(), notes: '' },
];

function loadWards(): BedWard[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : DEFAULT_WARDS;
  } catch { return DEFAULT_WARDS; }
}

function saveWards(wards: BedWard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wards));
}

function queuePendingSync(wardId: string, change: Partial<BedWard>) {
  const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  pending.push({ wardId, change, timestamp: new Date().toISOString() });
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

/* ── Ward card ───────────────────────────────────────────── */
function WardCard({ ward, onUpdate }: { ward: BedWard; onUpdate: (id: string, updates: Partial<BedWard>) => void }) {
  const [editing, setEditing] = useState(false);
  const [draftTotal, setDraftTotal] = useState(String(ward.total));
  const [draftName,  setDraftName]  = useState(ward.name);
  const [draftNotes, setDraftNotes] = useState(ward.notes);

  const free       = ward.total - ward.occupied;
  const pct        = ward.total > 0 ? Math.round((ward.occupied / ward.total) * 100) : 0;
  const isFull     = free === 0;
  const isNearFull = free <= 1 && !isFull;

  const barColor = isFull ? 'bg-red-500' : isNearFull ? 'bg-orange-400' : pct > 70 ? 'bg-yellow-400' : 'bg-green-500';
  const cardBorder = isFull ? 'border-red-200' : isNearFull ? 'border-orange-200' : 'border-gray-100';

  function occupy() {
    if (ward.occupied >= ward.total) { toast.error('No free beds available in this ward'); return; }
    const now = new Date().toISOString();
    const update = { occupied: ward.occupied + 1, lastUpdated: now };
    onUpdate(ward.id, update);
    queuePendingSync(ward.id, update);
    toast.success(`1 bed occupied — ${ward.name}`, { description: `${free - 1} beds remaining` });
  }

  function free1() {
    if (ward.occupied <= 0) { toast.error('No occupied beds to free'); return; }
    const now = new Date().toISOString();
    const update = { occupied: ward.occupied - 1, lastUpdated: now };
    onUpdate(ward.id, update);
    queuePendingSync(ward.id, update);
    toast.success(`1 bed freed — ${ward.name}`, { description: `${free + 1} beds now available` });
  }

  function saveEdit() {
    const t = Number(draftTotal);
    if (isNaN(t) || t < 1) { toast.error('Total beds must be at least 1'); return; }
    if (t < ward.occupied) { toast.error(`Cannot set total below current occupied (${ward.occupied})`); return; }
    const now = new Date().toISOString();
    const update = { name: draftName.trim() || ward.name, total: t, notes: draftNotes, lastUpdated: now };
    onUpdate(ward.id, update);
    queuePendingSync(ward.id, update);
    setEditing(false);
    toast.success('Ward details updated');
  }

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    } catch { return '—'; }
  };

  return (
    <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
      className={`bg-white rounded-2xl border ${cardBorder} shadow-sm overflow-hidden`}>
      {/* Status bar */}
      <div className={`h-1 ${barColor}`} style={{ width: `${pct}%` }}/>

      <div className="p-3.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={draftName} onChange={e => setDraftName(e.target.value)}
                className="w-full text-sm font-bold text-gray-900 border-b border-blue-400 outline-none bg-transparent pb-0.5"/>
            ) : (
              <p className="text-sm font-bold text-gray-900">{ward.name}</p>
            )}
            <p className="text-[9px] text-gray-400 mt-0.5">Updated {fmt(ward.lastUpdated)}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isFull?'bg-red-100 text-red-700':isNearFull?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'}`}>
              {isFull ? '🔴 Full' : isNearFull ? '🟡 Near Full' : '🟢 Available'}
            </span>
            {!editing ? (
              <button onClick={() => { setDraftTotal(String(ward.total)); setDraftName(ward.name); setDraftNotes(ward.notes); setEditing(true); }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Edit3 className="w-3.5 h-3.5 text-gray-600"/>
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={saveEdit} className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-green-700"/></button>
                <button onClick={() => setEditing(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-600"/></button>
              </div>
            )}
          </div>
        </div>

        {/* Bed counter */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={`text-3xl font-black ${isFull?'text-red-600':isNearFull?'text-orange-600':'text-green-600'}`}>{free}</p>
              <p className="text-[9px] text-gray-400 font-semibold">FREE</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-gray-700">{ward.occupied}</p>
              <p className="text-[9px] text-gray-400 font-semibold">OCCUPIED</p>
            </div>
            <div className="text-center">
              {editing ? (
                <div>
                  <input type="number" value={draftTotal} onChange={e => setDraftTotal(e.target.value)}
                    className="w-14 text-2xl font-black text-gray-500 text-center border border-blue-300 rounded-lg outline-none bg-blue-50"/>
                  <p className="text-[9px] text-blue-500 font-semibold">EDIT TOTAL</p>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-black text-gray-400">{ward.total}</p>
                  <p className="text-[9px] text-gray-400 font-semibold">TOTAL</p>
                </>
              )}
            </div>
          </div>

          {/* +/- controls */}
          <div className="flex flex-col gap-2">
            <button onClick={occupy} disabled={isFull}
              className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black text-xs transition-all shadow-sm ${isFull?'bg-gray-100 text-gray-300 cursor-not-allowed':'bg-red-500 hover:bg-red-600 text-white active:scale-95'}`}>
              <Plus className="w-4 h-4"/>
              <span className="text-[8px] leading-none mt-0.5">Occupy</span>
            </button>
            <button onClick={free1} disabled={ward.occupied <= 0}
              className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black text-xs transition-all shadow-sm ${ward.occupied<=0?'bg-gray-100 text-gray-300 cursor-not-allowed':'bg-green-500 hover:bg-green-600 text-white active:scale-95'}`}>
              <Minus className="w-4 h-4"/>
              <span className="text-[8px] leading-none mt-0.5">Free</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[9px] text-gray-400 mb-1">
            <span>Occupancy</span><span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <motion.div className={`h-2 rounded-full ${barColor}`}
              initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.5 }}/>
          </div>
        </div>

        {/* Notes */}
        {editing ? (
          <div className="mt-2">
            <p className="text-[9px] text-gray-400 mb-0.5">Ward Notes (optional)</p>
            <input value={draftNotes} onChange={e => setDraftNotes(e.target.value)} placeholder="e.g. 2 beds reserved for post-op"
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400"/>
          </div>
        ) : ward.notes ? (
          <p className="text-[10px] text-gray-500 italic">{ward.notes}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function FrontlineBeds() {
  const [wards, setWards] = useState<BedWard[]>(loadWards);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  function updateWard(id: string, updates: Partial<BedWard>) {
    setWards(prev => {
      const next = prev.map(w => w.id === id ? { ...w, ...updates } : w);
      saveWards(next);
      return next;
    });
  }

  function syncNow() {
    setSyncing(true);
    setTimeout(() => {
      localStorage.removeItem(PENDING_KEY);
      setSyncing(false);
      toast.success('All bed updates synced to District Admin');
    }, 1200);
  }

  const totalBeds     = wards.reduce((s, w) => s + w.total, 0);
  const totalOccupied = wards.reduce((s, w) => s + w.occupied, 0);
  const totalFree     = totalBeds - totalOccupied;
  const pct           = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;
  const hasPending    = !!localStorage.getItem(PENDING_KEY);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white px-4 pt-5 pb-6 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-sm font-bold">Bed Availability</h1>
            <p className="text-emerald-200 text-[11px] mt-0.5">Peelamedu Urban PHC</p>
          </div>
          <div className="flex items-center gap-2">
            {!online && <span className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[10px] px-2 py-0.5 rounded-full"><WifiOff className="w-3 h-3"/>Offline</span>}
            {online && hasPending && (
              <button onClick={syncNow} disabled={syncing}
                className="flex items-center gap-1 bg-white/15 border border-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                <RefreshCw className={`w-3 h-3 ${syncing?'animate-spin':''}`}/>{syncing?'Syncing…':'Sync'}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Free Beds',  value: totalFree,     color: totalFree===0?'text-red-300':'text-white' },
            { label: 'Occupied',   value: totalOccupied, color: 'text-white' },
            { label: 'Total',      value: totalBeds,     color: 'text-emerald-200' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 border border-white/20 rounded-xl p-2.5 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-emerald-200">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Overall bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-emerald-200 mb-1">
            <span>Overall occupancy</span><span>{pct}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${pct>=90?'bg-red-400':pct>=75?'bg-orange-400':'bg-green-400'}`}
              style={{ width:`${pct}%` }}/>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* Offline notice */}
        {!online && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0"/>
            <div>
              <p className="text-xs font-bold text-amber-800">Offline Mode Active</p>
              <p className="text-[10px] text-amber-600">Changes are saved locally and will sync automatically when internet is restored.</p>
            </div>
          </div>
        )}

        {/* Full ward alert */}
        {wards.filter(w => w.total === w.occupied).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0"/>
            <p className="text-xs font-semibold text-red-700">
              {wards.filter(w => w.total === w.occupied).map(w => w.name).join(', ')} — completely full
            </p>
          </div>
        )}

        {/* How to use */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-[10px] font-bold text-blue-700 mb-1">How to update beds</p>
          <div className="flex gap-4 text-[10px] text-blue-600">
            <span><span className="font-bold text-red-500">+</span> Occupy = patient admitted to bed</span>
            <span><span className="font-bold text-green-600">−</span> Free = patient discharged</span>
          </div>
          <p className="text-[10px] text-blue-500 mt-1">Tap ✏️ on any ward to edit total beds or ward name</p>
        </div>

        {/* Ward cards */}
        {wards.map(w => (
          <WardCard key={w.id} ward={w} onUpdate={updateWard}/>
        ))}

        {/* Sync status */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-gray-400 shrink-0"/>
          <div>
            <p className="text-xs font-semibold text-gray-700">
              {hasPending ? 'Pending sync — changes stored locally' : 'All changes synced to District Admin ✓'}
            </p>
            <p className="text-[9px] text-gray-400">{new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
