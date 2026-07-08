import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Package, Check, X, ChevronDown, ChevronUp,
  AlertTriangle, Clock, Zap, Bell,
} from 'lucide-react';
import {
  useStockRequestStore, stockRequestActions,
  type StockRequest, type RequestStatus,
} from '../stock/stockRequestStore';

/* ── Helpers ──────────────────────────────────────────────── */
function priorityBadge(p: StockRequest['priority']) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border border-red-200',
    high:     'bg-orange-100 text-orange-700 border border-orange-200',
    medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
    low:      'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return map[p] ?? map.low;
}

function statusBadge(s: RequestStatus) {
  if (s === 'pending_approval')   return 'bg-yellow-100 text-yellow-700';
  if (s === 'approved' || s === 'partially_approved') return 'bg-blue-100 text-blue-700';
  if (s === 'being_sent')         return 'bg-blue-100 text-blue-700';
  if (s === 'received')           return 'bg-green-100 text-green-700';
  if (s === 'rejected')           return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

function statusLabel(s: RequestStatus) {
  const map: Record<RequestStatus, string> = {
    pending_approval:   'Pending Approval',
    approved:           'Approved',
    partially_approved: 'Partially Approved',
    being_sent:         'Being Sent',
    delivered:          'Delivered',
    received:           'Received',
    rejected:           'Rejected',
  };
  return map[s] ?? s;
}

function fmtDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
}

type FilterTab = 'all' | 'pending_approval' | 'approved' | 'rejected' | 'completed';

/* ── Decision Modal ──────────────────────────────────────── */
function DecisionModal({ req, onClose }: { req: StockRequest; onClose: () => void }) {
  const [mode, setMode] = useState<'approve' | 'partial' | 'reject' | null>(null);
  const [partialQty, setPartialQty] = useState(String(req.requestedQty));
  const [adminRemarks, setAdminRemarks] = useState('');

  function submit() {
    if (!mode) { toast.error('Select a decision'); return; }
    if (mode === 'partial' && (!Number(partialQty) || Number(partialQty) <= 0)) {
      toast.error('Enter valid approved quantity'); return;
    }
    if (mode === 'approve') {
      stockRequestActions.adminDecide(req.id, 'approved', req.requestedQty, adminRemarks);
      toast.success('Request Approved', { description: 'Stock dispatch initiated.' });
    } else if (mode === 'partial') {
      stockRequestActions.adminDecide(req.id, 'partially_approved', Number(partialQty), adminRemarks);
      toast.success('Partially Approved', { description: `${partialQty} units approved.` });
    } else {
      stockRequestActions.adminDecide(req.id, 'rejected', 0, adminRemarks);
      toast.error('Request Rejected');
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">Review Request</p>
          <button onClick={onClose} className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-bold text-gray-900">{req.medicineName}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{req.phcName} · {req.requestedBy}</p>
            <div className="flex gap-3 mt-2">
              <div><p className="text-[9px] text-gray-400">Requested</p><p className="text-xs font-bold text-gray-800">{req.requestedQty} units</p></div>
              <div><p className="text-[9px] text-gray-400">Current Stock</p><p className="text-xs font-bold text-gray-800">{req.currentStock} units</p></div>
              <div><p className="text-[9px] text-gray-400">Min Threshold</p><p className="text-xs font-bold text-gray-800">{req.minThreshold} units</p></div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className={`rounded-xl p-3 border ${
            req.aiAction === 'approve' ? 'bg-green-50 border-green-200' :
            req.aiAction === 'partial' ? 'bg-yellow-50 border-yellow-200' :
                                         'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className={`w-3.5 h-3.5 ${req.aiAction === 'approve' ? 'text-green-600' : req.aiAction === 'partial' ? 'text-yellow-600' : 'text-red-600'}`} />
              <p className={`text-[10px] font-bold ${req.aiAction === 'approve' ? 'text-green-700' : req.aiAction === 'partial' ? 'text-yellow-700' : 'text-red-700'}`}>
                AI Recommendation: {req.aiAction === 'approve' ? 'Approve' : req.aiAction === 'partial' ? 'Partially Approve' : 'Reject'}
              </p>
            </div>
            <p className="text-[10px] text-gray-600 leading-relaxed">{req.aiRecommendation}</p>
          </div>

          {/* Decision buttons */}
          <p className="text-[10px] font-bold text-gray-600 uppercase">Your Decision</p>
          <div className="flex gap-2">
            {(['approve', 'partial', 'reject'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all ${
                  mode === m
                    ? m === 'approve' ? 'bg-green-600 text-white border-green-600'
                    : m === 'partial' ? 'bg-yellow-500 text-white border-yellow-500'
                    :                   'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                {m === 'approve' ? '✓ Approve' : m === 'partial' ? '~ Partial' : '✕ Reject'}
              </button>
            ))}
          </div>

          {/* Partial qty input */}
          {mode === 'partial' && (
            <div>
              <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Approved Quantity</p>
              <input type="number" value={partialQty} onChange={e => setPartialQty(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-400"
              />
            </div>
          )}

          {/* Admin remarks */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Remarks (optional)</p>
            <textarea value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)}
              placeholder="Add a note for the stock handler..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <button onClick={submit} disabled={!mode}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors">
            Confirm Decision
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Request Card ─────────────────────────────────────────── */
function AdminRequestCard({ req }: { req: StockRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const isPending = req.status === 'pending_approval';

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isPending ? 'border-yellow-200' : 'border-gray-100'}`}
      >
        {/* Top bar */}
        {isPending && <div className="h-0.5 w-full bg-yellow-400" />}

        <button className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(v => !v)}>
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold text-gray-900">{req.medicineName}</p>
              <span className="text-[9px] font-mono text-gray-400">{req.id}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {req.phcName} · {req.requestedQty} units · {fmtDate(req.requestedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${priorityBadge(req.priority)}`}>{req.priority}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(req.status)}`}>{statusLabel(req.status)}</span>
            </div>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100 px-3.5 pb-4">
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div><p className="text-[9px] text-gray-400">Requested Qty</p><p className="font-bold text-gray-800">{req.requestedQty} units</p></div>
                <div><p className="text-[9px] text-gray-400">Current Stock</p><p className="font-bold text-gray-800">{req.currentStock} units</p></div>
                <div><p className="text-[9px] text-gray-400">Min Threshold</p><p className="font-bold text-gray-800">{req.minThreshold} units</p></div>
                <div><p className="text-[9px] text-gray-400">Requested By</p><p className="font-semibold text-gray-700 text-[10px] leading-tight">{req.requestedBy}</p></div>
                {req.approvedQty !== null && req.status !== 'rejected' && (
                  <div className="col-span-2"><p className="text-[9px] text-gray-400">Approved Qty</p><p className="font-bold text-blue-700">{req.approvedQty} units</p></div>
                )}
                {req.approvedAt && (
                  <div className="col-span-2"><p className="text-[9px] text-gray-400">Approved At</p><p className="font-semibold text-gray-700">{fmtDate(req.approvedAt)}</p></div>
                )}
                {req.remarks && (
                  <div className="col-span-2"><p className="text-[9px] text-gray-400">Remarks</p><p className="font-medium text-gray-600">{req.remarks}</p></div>
                )}
                {req.adminRemarks && (
                  <div className="col-span-2"><p className="text-[9px] text-gray-400">Admin Remarks</p><p className="font-medium text-gray-600">{req.adminRemarks}</p></div>
                )}
              </div>

              {/* AI Recommendation */}
              <div className={`mt-3 rounded-xl p-3 border ${
                req.aiAction === 'approve' ? 'bg-green-50 border-green-200' :
                req.aiAction === 'partial' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className={`w-3 h-3 ${req.aiAction === 'approve' ? 'text-green-600' : req.aiAction === 'partial' ? 'text-yellow-600' : 'text-red-500'}`} />
                  <p className={`text-[9px] font-bold uppercase ${req.aiAction === 'approve' ? 'text-green-700' : req.aiAction === 'partial' ? 'text-yellow-700' : 'text-red-700'}`}>
                    AI: {req.aiAction === 'approve' ? 'Recommend Approve' : req.aiAction === 'partial' ? 'Recommend Partial' : 'Recommend Reject'}
                  </p>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">{req.aiRecommendation}</p>
              </div>

              {/* Action button */}
              {isPending && (
                <button onClick={() => setShowDecision(true)}
                  className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Check className="w-3.5 h-3.5" /> Review & Decide
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showDecision && <DecisionModal req={req} onClose={() => setShowDecision(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function AdminStockRequests() {
  const { requests, notifications } = useStockRequestStore();
  const adminNotifs = notifications.filter(n => n.for === 'admin' && !n.read);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showNotifs, setShowNotifs] = useState(false);

  const filtered = requests.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending_approval') return r.status === 'pending_approval';
    if (activeFilter === 'approved') return r.status === 'approved' || r.status === 'partially_approved' || r.status === 'being_sent';
    if (activeFilter === 'rejected') return r.status === 'rejected';
    if (activeFilter === 'completed') return r.status === 'received';
    return true;
  });

  const pendingCount  = requests.filter(r => r.status === 'pending_approval').length;
  const criticalCount = requests.filter(r => r.status === 'pending_approval' && r.priority === 'critical').length;

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all',              label: `All (${requests.length})` },
    { key: 'pending_approval', label: `Pending (${pendingCount})` },
    { key: 'approved',         label: 'Approved' },
    { key: 'rejected',         label: 'Rejected' },
    { key: 'completed',        label: 'Completed' },
  ];

  function dismissNotifs() {
    stockRequestActions.markRead('admin');
    setShowNotifs(false);
  }

  return (
    <div className="p-5 space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Medicine Stock Requests</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {requests.length === 0
              ? 'No requests received yet.'
              : `${requests.length} total · ${pendingCount} awaiting your approval`}
          </p>
        </div>
        <button onClick={() => setShowNotifs(v => !v)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-600" />
          {adminNotifs.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {adminNotifs.length}
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-800">Notifications</p>
              <button onClick={dismissNotifs} className="text-[10px] text-blue-600 font-semibold">Mark all read</button>
            </div>
            {adminNotifs.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">No new notifications</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {adminNotifs.map(n => (
                  <div key={n.id} className="px-4 py-2.5">
                    <p className="text-xs text-gray-700 font-medium">{n.message}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{fmtDate(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-xs text-red-700 font-semibold">
            {criticalCount} critical priority request{criticalCount > 1 ? 's' : ''} require immediate attention.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {filterTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
              activeFilter === tab.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center mb-3">
            <Package className="w-7 h-7 text-blue-300" />
          </div>
          <p className="font-bold text-gray-700">No stock requests yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            When Stock Handlers request medicine replenishment, requests will appear here for your review.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No requests match this filter.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => <AdminRequestCard key={req.id} req={req} />)}
        </div>
      )}
    </div>
  );
}
