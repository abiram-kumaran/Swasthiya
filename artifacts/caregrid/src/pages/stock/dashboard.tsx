import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  Package, AlertTriangle, TrendingDown, Calendar,
  ClipboardList, ArrowRight, Zap, User,
} from 'lucide-react';
import { useInventoryStore, type StockMedicine } from './inventoryStore';
export default function StockDashboard() {
  const { medicines } = useInventoryStore();
  const meds: StockMedicine[] = medicines;

  const criticalCount  = meds.filter((m) => m.status === 'critical').length;
  const lowCount       = meds.filter((m) => m.status === 'low').length;
  const expiringCount  = meds.filter((m) => {
    const diff = (new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 30;
  }).length;
  const totalMeds        = meds.length;
  const pendingTransfers = 2;
  const todayUpdates     = 12;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const criticalMeds = meds.filter((m) => m.status === 'critical' || m.status === 'low');

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 pt-5 pb-6 rounded-b-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-base font-bold">Stock Handler Portal</h1>
            <p className="text-emerald-100 text-[11px] mt-0.5">PHC Alpha Inventory Management</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <User className="w-4 h-4 text-white" />
            </div>
            <p className="text-[10px] text-emerald-100">Kumar S.</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-100 text-[11px]">
            <Calendar className="w-3.5 h-3.5" />
            {today}
          </div>
          <span className="flex items-center gap-1 bg-green-500/20 border border-green-400/30 text-green-200 text-[10px] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 blink" />
            On Duty
          </span>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { label: 'Total Medicines', value: totalMeds,     icon: Package,       color: 'blue'   },
            { label: 'Low Stock',       value: lowCount,      icon: TrendingDown,  color: 'orange' },
            { label: 'Critical Stock',  value: criticalCount, icon: AlertTriangle, color: 'red'    },
            { label: 'Expiring Soon',   value: expiringCount, icon: Calendar,      color: 'amber'  },
          ] as const).map((s, i) => {
            const Icon = s.icon;
            const colorMap: Record<string, string> = {
              blue:   'bg-blue-50   text-blue-700   border-blue-100',
              orange: 'bg-orange-50 text-orange-700 border-orange-100',
              red:    'bg-red-50    text-red-700    border-red-100',
              amber:  'bg-amber-50  text-amber-700  border-amber-100',
            };
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-xl p-3 ${colorMap[s.color]} border`}
              >
                <Icon className="w-4 h-4 mb-1.5 opacity-70" />
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[10px] mt-0.5 opacity-80">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Today summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
              <p className="text-[10px] font-semibold text-gray-600 uppercase">Pending Transfers</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingTransfers}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Need approval</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-3.5 h-3.5 text-green-600" />
              <p className="text-[10px] font-semibold text-gray-600 uppercase">Today's Updates</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{todayUpdates}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Stock entries</p>
          </div>
        </div>

        {/* AI Alert panel */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-3.5 text-white shadow-md">
          <div className="flex items-start gap-2.5 mb-3">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[11px] font-bold mb-0.5">🤖 AI Inventory Alert</p>
              <p className="text-[11px] leading-relaxed text-purple-100">
                {criticalMeds.length > 0
                  ? 'Critical stock alerts detected. Immediate action required to prevent stockout.'
                  : 'All inventory levels are currently healthy. No urgent alerts.'}
              </p>
            </div>
          </div>
          {criticalMeds.length > 0 ? (
            <div className="space-y-2">
              {criticalMeds.slice(0, 2).map((med) => (
                <div key={med.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{med.name}</p>
                      <p className="text-[10px] text-purple-200 mt-0.5">
                        ⚠️ {med.daysLeft === 0 ? 'Stock-out today!' : `${med.daysLeft} days remaining`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-white">
                      {med.quantity} {med.unit}
                    </span>
                  </div>
                  {med.predictedStockout && (
                    <p className="text-[10px] text-purple-200 mb-2">
                      AI Prediction: Stock-out on{' '}
                      <strong className="text-white">{med.predictedStockout}</strong>
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-purple-200">
                      Recommended:{' '}
                      <strong className="text-white">{med.aiRecommendedOrder} units</strong>
                    </span>
                    <Link href="/stock/transfers">
                      <button className="bg-white text-purple-700 font-bold px-2.5 py-1 rounded-md text-[10px] hover:bg-purple-50 transition-colors">
                        Request Transfer
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-2.5 border border-white/20 text-[11px] text-purple-100 text-center">
              ✅ All medicines stocked above minimum levels.
            </div>
          )}
        </div>

        {/* Quick Actions — 2 buttons only */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <p className="text-xs font-bold text-gray-800 mb-2.5">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/stock/inventory">
              <button className="w-full py-2.5 rounded-lg border text-xs font-semibold transition-colors bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
                View Low Stock
              </button>
            </Link>
            <Link href="/stock/transfers">
              <button className="w-full py-2.5 rounded-lg border text-xs font-semibold transition-colors bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                Pending Transfers
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
