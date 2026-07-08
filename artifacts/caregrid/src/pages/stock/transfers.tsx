import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Clock, Circle, Package, Bell, Filter,
  ChevronDown, ChevronUp, Truck, Check, X,
} from 'lucide-react';
import {
  useStockRequestStore,
  stockRequestActions,
  type StockRequest,
  type RequestStatus,
} from './stockRequestStore';

/* ── helpers ────────────────────────────────────────────── */
const STAGES: Array<{ key: RequestStatus; label: string }> = [
  { key: 'pending_approval', label: 'Pending Admin Approval'    },
  { key: 'approved',         label: 'Approved by District Admin'},
  { key: 'being_sent',       label: 'Stock Being Sent'          },
  { key: 'delivered',        label: 'Delivered'                 },
  { key: 'received',         label: 'Received'                  },
];

const STATUS_IDX: Partial<Record<RequestStatus, number>> = {
  pending_approval: 0, approved: 1, partially_approved: 1,
  being_sent: 2, delivered: 3, received: 4,
};

function sBadge(s: RequestStatus) {
  if (s === 'pending_approval')                          return 'bg-yellow-100 text-yellow-700';
  if (s === 'approved' || s === 'partially_approved')   return 'bg-blue-100 text-blue-700';
  if (s === 'being_sent')                               return 'bg-blue-100 text-blue-700';
  if (s === 'delivered' || s === 'received')            return 'bg-green-100 text-green-700';
  if (s === 'rejected')                                 return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

function sLabel(s: RequestStatus) {
  const m: Record<RequestStatus, string> = {
    pending_approval: 'Pending Approval', approved: 'Approved',
    partially_approved: 'Partially Approved', being_sent: 'Being Sent',
    delivered: 'Delivered', received: 'Received', rejected: 'Rejected',
  };
  return m[s] ?? s;
}

function fmt(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';
}

/* ── Timeline ───────────────────────────────────────────── */
function Timeline({ status }: { status: RequestStatus }) {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
          <X className="w-2.5 h-2.5 text-white" />
        </div>
        <p className="text-xs font-semibold text-red-700">Request Rejected by District Admin</p>
      </div>
    );
  }
  const cur = STATUS_IDX[status] ?? 0;
  return (
    <div className="mt-3">
      {STAGES.map((stage, i) => {
        const done    = i < cur;
        const current = i === cur;
        return (
          <div key={stage.key} className="flex items-start gap-2.5">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 border-2 ${
                done    ? 'bg-green-500 border-green-500' :
                current ? 'bg-blue-500 border-blue-500 ring-2 ring-blue-200' :
                          'bg-white border-gray-200'
              }`}>
                {done    && <Check className="w-2.5 h-2.5 text-white" />}
                {current && <Clock className="w-2.5 h-2.5 text-white animate-pulse" />}
                {!done && !current && <Circle className="w-2 h-2 text-gray-300" />}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-0.5 h-5 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
            <p className={`text-[11px] pt-0.5 ${
              done ? 'text-green-700 font-medium' : current ? 'text-blue-700 font-bold' : 'text-gray-400'
            }`}>
              {done ? '✔ ' : current ? '⏳ ' : '○ '}{stage.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Request card ───────────────────────────────────────── */
function RequestCard({ req }: { req: StockRequest }) {
  const [open, setOpen] = useState(false);

  function handleReceive() {
    stockRequestActions.receiveDelivery(req.id);
    toast.success('Medicine stock received successfully.', {
      description: `Inventory updated for ${req.medicineName}.`,
    });
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-gray-900">{req.medicineName}</p>
            <span className="text-[9px] font-mono text-gray-400">{req.id}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {req.requestedQty} units · {fmt(req.requestedAt)}
          </p>
          {req.approvedQty !== null && req.status !== 'rejected' && (
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
              Approved: {req.approvedQty} units
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sBadge(req.status)}`}>
            {sLabel(req.status)}
          </span>
          {open
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-gray-100 px-3.5 pb-3.5"
          >
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div><p className="text-[9px] text-gray-400">Requested</p><p className="font-semibold text-gray-700">{req.requestedQty} units</p></div>
              <div><p className="text-[9px] text-gray-400">Current Stock</p><p className="font-semibold text-gray-700">{req.currentStock} units</p></div>
              <div><p className="text-[9px] text-gray-400">Min Threshold</p><p className="font-semibold text-gray-700">{req.minThreshold} units</p></div>
              <div>
                <p className="text-[9px] text-gray-400">Priority</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                  req.priority === 'critical' ? 'bg-red-100 text-red-700' :
                  req.priority === 'high'     ? 'bg-orange-100 text-orange-700' :
                  req.priority === 'medium'   ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                }`}>{req.priority}</span>
              </div>
              {req.expectedDelivery && (
                <div className="col-span-2">
                  <p className="text-[9px] text-gray-400">Expected Delivery</p>
                  <p className="font-semibold text-blue-600">{fmt(req.expectedDelivery)}</p>
                </div>
              )}
              {req.remarks ? (
                <div className="col-span-2">
                  <p className="text-[9px] text-gray-400">Your Remarks</p>
                  <p className="font-medium text-gray-600">{req.remarks}</p>
                </div>
              ) : null}
              {req.adminRemarks ? (
                <div className="col-span-2">
                  <p className="text-[9px] text-gray-400">Admin Remarks</p>
                  <p className="font-medium text-gray-600">{req.adminRemarks}</p>
                </div>
              ) : null}
            </div>

            <Timeline status={req.status} />

            {req.status === 'delivered' && (
              <button
                onClick={handleReceive}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Truck className="w-4 h-4" /> Receive Delivery
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
type FilterKey = 'all' | 'pending_approval' | 'approved' | 'being_sent' | 'delivered' | 'received' | 'rejected';

const FILTER_TABS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all',             label: 'All'       },
  { key: 'pending_approval',label: 'Pending'   },
  { key: 'approved',        label: 'Approved'  },
  { key: 'being_sent',      label: 'In Transit'},
  { key: 'delivered',       label: 'Delivered' },
  { key: 'received',        label: 'Received'  },
  { key: 'rejected',        label: 'Rejected'  },
];

export default function StockTransfers() {
  const { requests, notifications } = useStockRequestStore();
  const unreadNotifs  = notifications.filter(n => n.for === 'stock' && !n.read);
  const [filter, setFilter]       = useState<FilterKey>('all');
  const [showNotifs, setShowNotifs] = useState(false);

  const filtered = requests.filter(r => {
    if (filter === 'all')     return true;
    if (filter === 'approved') return r.status === 'approved' || r.status === 'partially_approved';
    return r.status === filter;
  });

  const pendingCt   = requests.filter(r => r.status === 'pending_approval').length;
  const activeCt    = requests.filter(r => ['approved','partially_approved','being_sent'].includes(r.status)).length;
  const deliveredCt = requests.filter(r => r.status === 'delivered').length;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-bold">Stock Requests</h1>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
          >
            <Bell className="w-4 h-4 text-white" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unreadNotifs.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-2">
          {[
            { label: 'Pending',    value: pendingCt   },
            { label: 'In Transit', value: activeCt    },
            { label: 'Delivered',  value: deliveredCt },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-center">
              <p className="text-base font-bold text-white">{s.value}</p>
              <p className="text-[9px] text-emerald-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications dropdown */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mx-4 mt-3 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-800">Notifications</p>
              <button
                onClick={() => { stockRequestActions.markRead('stock'); setShowNotifs(false); }}
                className="text-[10px] text-blue-600 font-semibold"
              >
                Mark all read
              </button>
            </div>
            {unreadNotifs.length === 0
              ? <p className="text-center text-xs text-gray-400 py-4">No new notifications</p>
              : (
                <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                  {unreadNotifs.map(n => (
                    <div key={n.id} className="px-3 py-2.5">
                      <p className="text-[11px] text-gray-700 font-medium">{n.message}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{fmt(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-3 space-y-3">
        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-1.5" />
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                filter === tab.key
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-200 flex items-center justify-center mb-3">
              <Package className="w-7 h-7 text-emerald-300" />
            </div>
            <p className="font-bold text-gray-700 text-sm">No requests yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
              Use the Receive button on any medicine in the Inventory page to request stock.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-xs">No requests match this filter.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(req => <RequestCard key={req.id} req={req} />)}
          </div>
        )}
      </div>
    </div>
  );
}
