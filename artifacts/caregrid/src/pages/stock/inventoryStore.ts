/**
 * Shared in-memory store for the Stock Handler portal.
 * Uses a simple pub-sub so all pages (dashboard, inventory) stay in sync.
 * No external libraries needed — just React useSyncExternalStore.
 */
import { useSyncExternalStore } from 'react';

export interface StockMedicine {
  id: string;
  name: string;
  category: string;
  strength: string;       // e.g. "500mg", "250ml"
  quantity: number;
  unit: string;           // tabs / caps / packs / vials / bottles
  dailyBurnRate: number;
  daysLeft: number;
  status: 'ok' | 'low' | 'critical' | 'surplus';
  expiryDate: string;     // ISO date string
  reorderLevel: number;
  batchNumber: string;
  storageLocation: string;
  manufacturer: string;
  predictedStockout: string | null;
  aiRecommendedOrder: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

let state: { medicines: StockMedicine[] } = {
  medicines: [], // starts empty — staff must add their own stock
};

function notify() {
  listeners.forEach(l => l());
}

export const inventoryActions = {
  addMedicine(med: Omit<StockMedicine, 'id' | 'status' | 'daysLeft' | 'predictedStockout' | 'aiRecommendedOrder'>) {
    const daysLeft = med.dailyBurnRate > 0 ? Math.floor(med.quantity / med.dailyBurnRate) : 999;
    const status: StockMedicine['status'] =
      med.quantity <= 0 ? 'critical' :
      med.quantity < med.reorderLevel * 0.3 ? 'critical' :
      med.quantity < med.reorderLevel ? 'low' :
      med.quantity > med.reorderLevel * 3 ? 'surplus' : 'ok';
    const predictedStockout = daysLeft === 0 ? 'Today' : daysLeft <= 3 ? `In ${daysLeft} day(s)` : null;
    const aiRecommendedOrder = status === 'critical' || status === 'low' ? Math.max(med.reorderLevel - med.quantity, 50) : 0;

    const newMed: StockMedicine = {
      ...med,
      id: `m-${Date.now()}`,
      status,
      daysLeft,
      predictedStockout,
      aiRecommendedOrder,
    };
    state = { medicines: [...state.medicines, newMed] };
    notify();
  },

  updateMedicine(id: string, updates: Partial<StockMedicine>) {
    state = {
      medicines: state.medicines.map(m => {
        if (m.id !== id) return m;
        const merged = { ...m, ...updates };
        // Recalculate derived fields if quantity or burnRate changed
        const daysLeft = merged.dailyBurnRate > 0 ? Math.floor(merged.quantity / merged.dailyBurnRate) : 999;
        const status: StockMedicine['status'] =
          merged.quantity <= 0 ? 'critical' :
          merged.quantity < merged.reorderLevel * 0.3 ? 'critical' :
          merged.quantity < merged.reorderLevel ? 'low' :
          merged.quantity > merged.reorderLevel * 3 ? 'surplus' : 'ok';
        const predictedStockout = daysLeft === 0 ? 'Today' : daysLeft <= 3 ? `In ${daysLeft} day(s)` : null;
        const aiRecommendedOrder = status === 'critical' || status === 'low' ? Math.max(merged.reorderLevel - merged.quantity, 50) : 0;
        return { ...merged, daysLeft, status, predictedStockout, aiRecommendedOrder };
      }),
    };
    notify();
  },

  receiveStock(id: string, qty: number) {
    const med = state.medicines.find(m => m.id === id);
    if (!med) return;
    inventoryActions.updateMedicine(id, { quantity: med.quantity + qty });
  },

  issueStock(id: string, qty: number) {
    const med = state.medicines.find(m => m.id === id);
    if (!med) return;
    inventoryActions.updateMedicine(id, { quantity: Math.max(0, med.quantity - qty) });
  },

  removeMedicine(id: string) {
    state = { medicines: state.medicines.filter(m => m.id !== id) };
    notify();
  },
};

export interface InventoryState {
  medicines: StockMedicine[];
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): InventoryState {
  return state;
}

export function useInventoryStore(): InventoryState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
