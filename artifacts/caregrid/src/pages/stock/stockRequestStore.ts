/**
 * Stock-request store.
 * Uses useSyncExternalStore with a direct state reference (no selector transforms)
 * to avoid React 19 tearing / infinite re-render issues.
 */
import { useSyncExternalStore } from 'react';

export type RequestStatus =
  | 'pending_approval'
  | 'approved'
  | 'being_sent'
  | 'delivered'
  | 'received'
  | 'rejected'
  | 'partially_approved';

export interface StockRequest {
  id: string;
  medicineName: string;
  medicineId: string;
  requestedQty: number;
  approvedQty: number | null;
  currentStock: number;
  minThreshold: number;
  phcName: string;
  requestedBy: string;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  expectedDelivery: string | null;
  status: RequestStatus;
  remarks: string;
  adminRemarks: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  aiRecommendation: string;
  aiAction: 'approve' | 'partial' | 'reject';
}

export interface StockNotification {
  id: string;
  for: 'stock' | 'admin';
  message: string;
  createdAt: string;
  read: boolean;
}

export interface StockRequestState {
  requests: StockRequest[];
  notifications: StockNotification[];
}

type Listener = () => void;
const listeners = new Set<Listener>();
let state: StockRequestState = { requests: [], notifications: [] };

function notify() {
  listeners.forEach(l => l());
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): StockRequestState {
  return state;
}

/* ── AI helpers ─────────────────────────────────────────── */
function aiRec(
  name: string, qty: number, stock: number, threshold: number
): { text: string; action: StockRequest['aiAction'] } {
  const gap = threshold - stock;
  if (stock === 0)
    return { action: 'approve', text: `Approve. ${name} is completely out of stock. Immediate replenishment required to avoid treatment disruption.` };
  if (gap >= qty * 0.8)
    return { action: 'approve', text: 'Approve. Current stock is significantly below minimum threshold. Demand forecasting predicts continued usage over the next week.' };
  if (gap > 0 && gap < qty)
    return { action: 'partial', text: `Partially Approve. Stock is low but not critical. Recommend approving ${Math.ceil(gap * 1.2)} units to reach threshold with a buffer while conserving district supply.` };
  if (stock >= threshold)
    return { action: 'reject', text: `Reject. Current stock (${stock}) already meets the minimum threshold (${threshold}). No immediate replenishment needed based on current usage patterns.` };
  return { action: 'approve', text: 'Approve. Stock levels are below safe threshold and historical usage suggests demand will continue.' };
}

function calcPriority(stock: number, threshold: number): StockRequest['priority'] {
  if (stock === 0) return 'critical';
  const pct = threshold > 0 ? stock / threshold : 1;
  if (pct < 0.3) return 'critical';
  if (pct < 0.6) return 'high';
  if (pct < 1.0) return 'medium';
  return 'low';
}

/* ── Actions ─────────────────────────────────────────────── */
export const stockRequestActions = {
  submitRequest(args: {
    medicineId: string;
    medicineName: string;
    requestedQty: number;
    currentStock: number;
    minThreshold: number;
    remarks: string;
  }): string {
    const { action, text } = aiRec(args.medicineName, args.requestedQty, args.currentStock, args.minThreshold);
    const id = `REQ-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const req: StockRequest = {
      id,
      medicineName: args.medicineName,
      medicineId: args.medicineId,
      requestedQty: args.requestedQty,
      approvedQty: null,
      currentStock: args.currentStock,
      minThreshold: args.minThreshold,
      phcName: 'Peelamedu Urban PHC',
      requestedBy: 'Kumar S. (Stock Handler)',
      requestedAt: now,
      approvedAt: null,
      completedAt: null,
      expectedDelivery: null,
      status: 'pending_approval',
      remarks: args.remarks,
      adminRemarks: '',
      priority: calcPriority(args.currentStock, args.minThreshold),
      aiRecommendation: text,
      aiAction: action,
    };

    state = {
      requests: [req, ...state.requests],
      notifications: [
        {
          id: `n-${Date.now()}`,
          for: 'admin',
          message: `New stock request: ${args.medicineName} — ${args.requestedQty} units from Peelamedu Urban PHC`,
          createdAt: now,
          read: false,
        },
        {
          id: `n-${Date.now() + 1}`,
          for: 'stock',
          message: `Request ${id} submitted. Awaiting District Admin approval.`,
          createdAt: now,
          read: false,
        },
        ...state.notifications,
      ],
    };
    notify();
    return id;
  },

  adminDecide(
    id: string,
    decision: 'approved' | 'partially_approved' | 'rejected',
    approvedQty?: number,
    adminRemarks?: string,
  ) {
    const now = new Date().toISOString();
    const req = state.requests.find(r => r.id === id);
    const qty = decision === 'partially_approved'
      ? (approvedQty ?? req?.requestedQty ?? 0)
      : (req?.requestedQty ?? 0);

    state = {
      ...state,
      requests: state.requests.map(r =>
        r.id !== id ? r : {
          ...r,
          status: decision,
          approvedQty: decision === 'rejected' ? 0 : qty,
          approvedAt: now,
          expectedDelivery: decision !== 'rejected'
            ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            : null,
          adminRemarks: adminRemarks ?? '',
        }
      ),
      notifications: [
        {
          id: `n-${Date.now()}`,
          for: 'stock',
          message: `Your request for ${req?.medicineName ?? 'medicine'} has been ${decision.replace(/_/g, ' ')}.`,
          createdAt: now,
          read: false,
        },
        ...state.notifications,
      ],
    };
    notify();

    if (decision !== 'rejected') {
      setTimeout(() => {
        stockRequestActions._advance(id, 'being_sent', 'Stock is being packed and dispatched from district pharmacy.');
      }, 3000);
    }
  },

  _advance(id: string, status: RequestStatus, msg: string) {
    const now = new Date().toISOString();
    state = {
      ...state,
      requests: state.requests.map(r => r.id !== id ? r : { ...r, status }),
      notifications: [
        { id: `n-${Date.now()}`, for: 'stock', message: msg, createdAt: now, read: false },
        ...state.notifications,
      ],
    };
    notify();

    if (status === 'being_sent') {
      setTimeout(() => {
        stockRequestActions._advance(
          id,
          'delivered',
          'Your medicine shipment has arrived! Tap "Receive Delivery" to confirm.',
        );
      }, 6000);
    }
  },

  receiveDelivery(id: string) {
    const req = state.requests.find(r => r.id === id);
    if (!req || req.status !== 'delivered') return;
    const now = new Date().toISOString();
    const qty = req.approvedQty ?? req.requestedQty;

    // Lazy import to avoid circular dependency at module init time
    import('./inventoryStore').then(m => {
      m.inventoryActions.receiveStock(req.medicineId, qty);
    });

    state = {
      ...state,
      requests: state.requests.map(r =>
        r.id !== id ? r : { ...r, status: 'received', completedAt: now }
      ),
      notifications: [
        {
          id: `n-${Date.now()}`,
          for: 'stock',
          message: `Medicine stock received. Inventory updated for ${req.medicineName}.`,
          createdAt: now,
          read: false,
        },
        ...state.notifications,
      ],
    };
    notify();
  },

  markRead(forRole: 'stock' | 'admin') {
    state = {
      ...state,
      notifications: state.notifications.map(n =>
        n.for === forRole ? { ...n, read: true } : n
      ),
    };
    notify();
  },
};

/* ── Hook — returns the whole state object, no selector ─── */
export function useStockRequestStore(): StockRequestState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
