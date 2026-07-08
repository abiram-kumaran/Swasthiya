/**
 * Staff Auth Store — shared by Clinic Staff and Stock Handler.
 *
 * TWO flows:
 *  First-time setup  → Emp ID → Aadhaar last-4 (one-time) → OTP → Facility confirm
 *  Returning login   → Emp ID → OTP  (Aadhaar already verified, skipped)
 *
 * "Verified" status is persisted per empId so Aadhaar is never asked again.
 */
import { useSyncExternalStore } from 'react';

export type StaffRole = 'staff' | 'stock';

export interface StaffSession {
  role: StaffRole;
  empId: string;
  name: string;
  phone: string;
  facility: string;
  facilityCode: string;
  district: string;
  department: string;
  designation: string;
  loginAt: string;
  sessionToken: string;
}

export interface StaffRecord {
  empId: string;
  name: string;
  aadhaarLast4: string;   // stored server-side; last 4 only, never the full number
  phone: string;
  facility: string;
  facilityCode: string;
  district: string;
  department: string;
  designation: string;
  role: StaffRole;
}

/* ── Pre-registered staff ────────────────────────────────── */
export const STAFF_REGISTRY: StaffRecord[] = [
  { empId:'CG-PHC01-N04',  name:'Vijaya Lakshmi R.', aadhaarLast4:'4821', phone:'+91 98765 43210', facility:'Peelamedu Urban PHC',   facilityCode:'PHC-01', district:'Coimbatore', department:'Outpatient & Triage',   designation:'Senior Nurse Practitioner', role:'staff' },
  { empId:'CG-PHC02-N01',  name:'Meena Devi K.',     aadhaarLast4:'7734', phone:'+91 94432 11223', facility:'Singanallur Urban PHC', facilityCode:'PHC-02', district:'Coimbatore', department:'OPD & Emergency',       designation:'Nurse',                     role:'staff' },
  { empId:'CG-CHC01-S02',  name:'Priya Anand',       aadhaarLast4:'2219', phone:'+91 97654 33441', facility:'Peelamedu CHC',         facilityCode:'CHC-01', district:'Coimbatore', department:'General Ward',           designation:'Staff Nurse',               role:'staff' },
  { empId:'CG-PHC01-SH02', name:'Kumar Selvam R.',   aadhaarLast4:'9943', phone:'+91 94567 89012', facility:'Peelamedu Urban PHC',   facilityCode:'PHC-01', district:'Coimbatore', department:'Pharmacy & Inventory',  designation:'Stock Handler',             role:'stock' },
  { empId:'CG-PHC02-SH01', name:'Rajan Murugan',     aadhaarLast4:'5512', phone:'+91 98112 67890', facility:'Singanallur Urban PHC', facilityCode:'PHC-02', district:'Coimbatore', department:'Pharmacy & Inventory',  designation:'Stock Handler',             role:'stock' },
];

/* ── Aadhaar-verified tracking (one per device per empId) ── */
const AADHAAR_KEY = 'caregrid_aadhaar_verified_v1';

function loadVerified(): Set<string> {
  try {
    const s = localStorage.getItem(AADHAAR_KEY);
    return s ? new Set(JSON.parse(s)) : new Set();
  } catch { return new Set(); }
}

function saveVerified(set: Set<string>) {
  localStorage.setItem(AADHAAR_KEY, JSON.stringify([...set]));
}

let _verified = loadVerified();

/* ── Pub-sub ─────────────────────────────────────────────── */
type L = () => void;
const listeners: Record<StaffRole, Set<L>> = { staff: new Set(), stock: new Set() };
const KEYS: Record<StaffRole, string> = { staff: 'caregrid_staff_v1', stock: 'caregrid_stock_auth_v1' };

function load(role: StaffRole): StaffSession | null {
  try { const s = localStorage.getItem(KEYS[role]); return s ? JSON.parse(s) : null; } catch { return null; }
}

let sessions: Record<StaffRole, StaffSession | null> = {
  staff: load('staff'),
  stock: load('stock'),
};

function notify(role: StaffRole) { listeners[role].forEach(l => l()); }
function subscribe(role: StaffRole, cb: L) { listeners[role].add(cb); return () => listeners[role].delete(cb); }
function getSnap(role: StaffRole) { return sessions[role]; }

export function useStaffSession(role: StaffRole) {
  return useSyncExternalStore(
    cb => subscribe(role, cb),
    () => getSnap(role),
  );
}

export const staffAuthActions = {
  /** Check if this device has already verified Aadhaar for this empId */
  isAadhaarVerified(empId: string): boolean {
    return _verified.has(empId.toUpperCase());
  },

  /** Validate employee ID against registry */
  validateEmpId(empId: string, role: StaffRole): StaffRecord | null {
    return STAFF_REGISTRY.find(s => s.empId.toUpperCase() === empId.toUpperCase() && s.role === role) ?? null;
  },

  /** One-time Aadhaar verification — marks this device as verified for this empId */
  verifyAndMarkAadhaar(empId: string, aadhaarLast4: string): boolean {
    const rec = STAFF_REGISTRY.find(s => s.empId.toUpperCase() === empId.toUpperCase());
    if (!rec || rec.aadhaarLast4 !== aadhaarLast4.trim()) return false;
    _verified.add(empId.toUpperCase());
    saveVerified(_verified);
    return true;
  },

  /** Create a session (called after OTP verified) */
  createSession(empId: string, role: StaffRole): boolean {
    const rec = STAFF_REGISTRY.find(s => s.empId.toUpperCase() === empId.toUpperCase() && s.role === role);
    if (!rec) return false;
    const session: StaffSession = {
      role, empId: rec.empId, name: rec.name, phone: rec.phone,
      facility: rec.facility, facilityCode: rec.facilityCode,
      district: rec.district, department: rec.department,
      designation: rec.designation,
      loginAt: new Date().toISOString(),
      sessionToken: `${role}-${Date.now().toString(36)}`,
    };
    sessions[role] = session;
    localStorage.setItem(KEYS[role], JSON.stringify(session));
    notify(role);
    return true;
  },

  /** Create session from AppDB account (used by StaffLogin component) */
  createSessionFromAccount(acc: import('./appDB').UserAccount) {
    const role = acc.role as StaffRole;
    const session: StaffSession = {
      role,
      empId: acc.username,
      name: acc.name,
      phone: acc.phone,
      facility: acc.facility,
      facilityCode: acc.facilityCode,
      district: acc.district,
      department: acc.department,
      designation: acc.designation,
      loginAt: new Date().toISOString(),
      sessionToken: `${role}-${Date.now().toString(36)}`,
    };
    sessions[role] = session;
    localStorage.setItem(KEYS[role], JSON.stringify(session));
    notify(role);
  },

  logout(role: StaffRole) {
    sessions[role] = null;
    localStorage.removeItem(KEYS[role]);
    notify(role);
  },
};
