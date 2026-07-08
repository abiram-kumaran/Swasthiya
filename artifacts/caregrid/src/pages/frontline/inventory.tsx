import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, ScanLine, Plus, Camera, Package, ArrowRight,
  AlertTriangle, TrendingDown, Calendar, Zap,
} from 'lucide-react';
import { MEDICINES } from '@/lib/data';

type StatusFilter = 'all' | 'critical' | 'low' | 'ok' | 'surplus';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'critical', label: 'Critical' },
  { key: 'low',      label: 'Low'      },
  { key: 'ok',       label: 'OK'       },
  { key: 'surplus',  label: 'Surplus'  },
];

const STATUS_COLOR: Record<string, { bar: string; badge: string; card: string }> = {
  critical: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',     card: 'border-red-200' },
  low:      { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', card: 'border-orange-200' },
  ok:       { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700',  card: 'border-gray-100' },
  surplus:  { bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',    card: 'border-gray-100' },
};

function daysColor(days: number) {
  if (days <= 0)  return 'text-red-600 font-bold';
  if (days <= 7)  return 'text-red-500 font-semibold';
  if (days <= 14) return 'text-orange-500 font-semibold';
  return 'text-green-600';
}

function expiryColor(dateStr: string) {
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 30) return 'text-red-600 font-semibold';
  return 'text-gray-400';
}

export default function FrontlineInventory() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const centerMeds = MEDICINES.filter(m => m.centerId === 'phc-01');
  const filtered = centerMeds.filter(m => {
    const matchTab = activeTab === 'all' || m.status === activeTab;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const aiMed = centerMeds.find(m => m.status === 'critical');

  function handleScan() {
    toast.success('Detected: Paracetamol 500mg × 100', {
      description: 'Barcode scan successful (simulated). Item added to queue.',
      icon: '📷',
    });
  }

  function handleIssue(name: string) {
    toast.info(`Issuing ${name}`, { description: 'Dispensing record saved.' });
  }

  function handleRequest(name: string) {
    toast.success(`Transfer request sent for ${name}`, { description: 'Request forwarded to CHC-Central.' });
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="gradient-gov text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <h1 className="text-sm font-bold mb-3">Medicine Inventory</h1>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-300" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/15 border border-white/20 text-white placeholder:text-blue-300 text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-white/50"
            />
          </div>
          <button
            onClick={handleScan}
            className="flex items-center gap-1.5 px-3 bg-white/15 border border-white/20 rounded-lg text-white text-xs font-medium"
          >
            <ScanLine className="w-3.5 h-3.5" />
            Scan
          </button>
          <button
            onClick={() => toast.info('Add Stock form', { description: 'Opening stock form (simulated).' })}
            className="flex items-center gap-1.5 px-3 bg-white/15 border border-white/20 rounded-lg text-white text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* AI Forecast Banner */}
        {aiMed && (
          <div className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 p-3 text-white">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] font-bold mb-0.5">🤖 AI Forecast</p>
                <p className="text-[11px] leading-relaxed text-purple-100">
                  {aiMed.name} will stock out in{' '}
                  <strong className="text-white">{aiMed.daysLeft === 0 ? '0' : aiMed.daysLeft} days</strong>.
                  Recommended order: <strong className="text-white">{aiMed.aiRecommendedOrder} units</strong>.
                  CHC-Central has <strong className="text-white">5,000 surplus</strong>.
                </p>
                <button
                  onClick={() => handleRequest(aiMed.name)}
                  className="mt-2 flex items-center gap-1 bg-white text-purple-700 text-[10px] font-bold px-3 py-1 rounded-lg"
                >
                  Request Transfer <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const count = tab.key === 'all' ? centerMeds.length : centerMeds.filter(m => m.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] font-bold px-1 rounded-full ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Medicine List */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 text-gray-400 text-xs"
            >
              No medicines found
            </motion.div>
          ) : (
            filtered.map((med, i) => {
              const sc = STATUS_COLOR[med.status];
              const pct = Math.min((med.quantity / med.reorderLevel) * 100, 100);
              return (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-xl border p-3 shadow-sm ${sc.card}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[12px] font-bold text-gray-900">{med.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{med.category}</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mt-1 leading-none">
                        {med.quantity}
                        <span className="text-xs font-normal text-gray-400 ml-1">{med.unit}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${sc.badge}`}>
                      {med.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                      <span>Stock level</span>
                      <span>{Math.round(pct)}% of reorder level</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${sc.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="grid grid-cols-3 gap-2 mb-2.5">
                    <div>
                      <p className="text-[9px] text-gray-400">Days left</p>
                      <p className={`text-xs ${daysColor(med.daysLeft)}`}>
                        {med.daysLeft === 0 ? '0 (today!)' : `${med.daysLeft}d`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400">Burn rate</p>
                      <p className="text-xs text-gray-700">{med.dailyBurnRate}/day</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400">Expiry</p>
                      <p className={`text-xs ${expiryColor(med.expiryDate)}`}>
                        {new Date(med.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* AI stockout */}
                  {med.predictedStockout && (
                    <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1 mb-2">
                      <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                      <p className="text-[10px] text-red-600 font-medium">
                        AI predicts stockout: <strong>{med.predictedStockout}</strong>
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleIssue(med.name)}
                      className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Issue
                    </button>
                    <button
                      onClick={() => handleRequest(med.name)}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Request More
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Floating Scan Button */}
      <button
        onClick={handleScan}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg text-white transition-colors z-20"
        title="Scan barcode"
      >
        <Camera className="w-6 h-6" />
      </button>
    </div>
  );
}
