/**
 * Admin session store — localStorage persisted.
 * Simulates Zero-Trust Gov auth state.
 */
import { useSyncExternalStore } from 'react';

export interface AdminSession {
  email: string;
  name: string;
  district: string;
  role: string;
  loginAt: string;
  biometricVerified: boolean;
  lastActivity: string;
  sessionToken: string;
}

const STORAGE_KEY = 'swasthiyasetu_admin_session_v1';

// pub-sub
type Listener = () => void;
const listeners = new Set<Listener>();
let _session: AdminSession | null = (() => {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
})();

function notify() { listeners.forEach(l => l()); }
function subscribe(cb: Listener) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return _session; }

export function useAdminSession() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export const adminSessionActions = {
  login(email: string, name: string): 'ok' | 'unauthorized' {
    const allowed = ['.gov.in', '@nhm.gov.in', '@health.gov.in', '@nic.in'];
    const isAllowed = allowed.some(d => email.toLowerCase().endsWith(d));
    if (!isAllowed) return 'unauthorized';
    const session: AdminSession = {
      email, name,
      district: 'Coimbatore District',
      role: 'District Health Officer',
      loginAt: new Date().toISOString(),
      biometricVerified: false,
      lastActivity: new Date().toISOString(),
      sessionToken: `tok-${Date.now().toString(36)}`,
    };
    _session = session;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    notify();
    return 'ok';
  },
  verifyBiometric() {
    if (!_session) return;
    _session = { ..._session, biometricVerified: true, lastActivity: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_session));
    notify();
  },
  logout() {
    _session = null;
    localStorage.removeItem(STORAGE_KEY);
    notify();
  },
  touch() {
    if (!_session) return;
    _session = { ..._session, lastActivity: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_session));
    notify();
  },
};
