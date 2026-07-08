/**
 * Swasthiya Setu AppDB — Single shared reactive database.
 * All portals read and write here. Persisted in localStorage.
 * On a real deployment this would be a backend API (Postgres via Drizzle).
 *
 * Cross-portal data flows are handled automatically via this store:
 *  Patient → Staff queue, Doctor queue, Admin footfall
 *  Staff → Beds visible to Patient/Admin, Doctor list visible to Patient
 *  Doctor → Consultation count → Admin, Patient history
 *  Stock → Medicine availability → Patient, Doctor, Admin
 *  Admin → Stock requests, Doctor deployments
 */
import { useSyncExternalStore } from 'react';

/* ── Types ───────────────────────────────────────────────── */
export interface UserAccount {
  id: string;
  role: 'staff' | 'stock' | 'doctor' | 'patient';
  name: string;
  username: string;          // emp ID / NMC ID / phone
  passwordHash: string;      // simple hash for demo (never plain-text)
  facility: string;
  facilityCode: string;
  district: string;
  department: string;
  designation: string;
  phone: string;
  createdAt: string;
}

export interface PatientEntry {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  phone: string;
  village: string;
  conditions: string[];
  tokenNumber: number;
  priority: 'normal' | 'senior' | 'pregnant' | 'child' | 'emergency';
  status: 'waiting' | 'called' | 'consulting' | 'done' | 'skipped';
  registeredAt: string;
  calledAt: string | null;
  facilityCode: string;
  registeredBy: string;   // staff empId
}

export interface BedWard {
  id: string;
  name: string;
  total: number;
  occupied: number;
  facilityCode: string;
  lastUpdated: string;
}

export interface DoctorStatus {
  empId: string;
  name: string;
  specialty: string;
  facilityCode: string;
  onDuty: boolean;
  startTime: string | null;
  consultationCount: number;
  updatedAt: string;
}

export interface ConsultationRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorEmpId: string;
  doctorName: string;
  facilityCode: string;
  diagnosis: string[];
  prescription: string;
  labRequests: string[];
  referral: string | null;
  consultedAt: string;
}

export interface PrescribedMedicine {
  medicineName: string;
  quantity: number;
  consultationId: string;
  facilityCode: string;
  prescribedAt: string;
}

export interface DistrictStats {
  totalPatientsToday: number;
  totalWaiting: number;
  totalBedsFree: number;
  totalBedsTotal: number;
  totalDoctorsOnDuty: number;
  totalConsultations: number;
  emergencyCases: number;
  labRequestsToday: number;
  referralsToday: number;
  lastUpdated: string;
}

export interface AppState {
  accounts: UserAccount[];
  patients: PatientEntry[];
  beds: BedWard[];
  doctorStatuses: DoctorStatus[];
  consultations: ConsultationRecord[];
  prescribedMedicines: PrescribedMedicine[];
  districtStats: DistrictStats;
  nextTokenNumber: number;
}

/* ── Simple hash (demo only, not cryptographic) ──────────── */
function simpleHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export function hashPassword(pwd: string) { return simpleHash(pwd); }
export function checkPassword(pwd: string, hash: string) { return simpleHash(pwd) === hash; }

/* ── Empty initial state ─────────────────────────────────── */
const EMPTY_STATS: DistrictStats = {
  totalPatientsToday: 0, totalWaiting: 0,
  totalBedsFree: 0, totalBedsTotal: 0,
  totalDoctorsOnDuty: 0, totalConsultations: 0,
  emergencyCases: 0, labRequestsToday: 0, referralsToday: 0,
  lastUpdated: new Date().toISOString(),
};

const DB_KEY = 'swasthiyasetu_appdb_v1';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    accounts: [], patients: [], beds: [], doctorStatuses: [],
    consultations: [], prescribedMedicines: [],
    districtStats: EMPTY_STATS, nextTokenNumber: 1,
  };
}

function persist(s: AppState) { localStorage.setItem(DB_KEY, JSON.stringify(s)); }

/* ── Pub-sub ─────────────────────────────────────────────── */
type Listener = () => void;
const listeners = new Set<Listener>();
let db: AppState = loadState();

function notify() { listeners.forEach(l => l()); }
function recompute() {
  const today = new Date().toISOString().split('T')[0];
  const patientsToday = db.patients.filter(p => p.registeredAt.startsWith(today));
  const totalBedsFree = db.beds.reduce((s, b) => s + (b.total - b.occupied), 0);
  const totalBedsTotal = db.beds.reduce((s, b) => s + b.total, 0);
  db = {
    ...db,
    districtStats: {
      totalPatientsToday: patientsToday.length,
      totalWaiting: patientsToday.filter(p => p.status === 'waiting').length,
      totalBedsFree,
      totalBedsTotal,
      totalDoctorsOnDuty: db.doctorStatuses.filter(d => d.onDuty).length,
      totalConsultations: db.consultations.filter(c => c.consultedAt.startsWith(today)).length,
      emergencyCases: patientsToday.filter(p => p.priority === 'emergency').length,
      labRequestsToday: db.consultations.filter(c => c.consultedAt.startsWith(today)).reduce((s, c) => s + c.labRequests.length, 0),
      referralsToday: db.consultations.filter(c => c.consultedAt.startsWith(today) && c.referral).length,
      lastUpdated: new Date().toISOString(),
    },
  };
  persist(db);
  notify();
}

function update(fn: (s: AppState) => AppState) {
  db = fn(db);
  recompute();
}

/* ── DB Actions ──────────────────────────────────────────── */
export const db_actions = {

  /* Auth — signup (one-time per username) */
  signup(args: { role: UserAccount['role']; username: string; password: string; name: string; facility: string; facilityCode: string; district: string; department: string; designation: string; phone: string; }): 'ok' | 'exists' {
    const exists = db.accounts.find(a => a.username.toLowerCase() === args.username.toLowerCase() && a.role === args.role);
    if (exists) return 'exists';
    const account: UserAccount = {
      id: `u-${Date.now()}`, ...args,
      passwordHash: hashPassword(args.password),
      createdAt: new Date().toISOString(),
    };
    update(s => ({ ...s, accounts: [...s.accounts, account] }));
    return 'ok';
  },

  /* Auth — login */
  login(username: string, password: string, role: UserAccount['role']): UserAccount | null {
    const acc = db.accounts.find(a => a.username.toLowerCase() === username.toLowerCase() && a.role === role);
    if (!acc) return null;
    if (!checkPassword(password, acc.passwordHash)) return null;
    return acc;
  },

  findAccount(username: string, role: UserAccount['role']): UserAccount | null {
    return db.accounts.find(a => a.username.toLowerCase() === username.toLowerCase() && a.role === role) ?? null;
  },

  /* Patients — register (Clinic Staff action) */
  registerPatient(p: Omit<PatientEntry, 'id' | 'tokenNumber' | 'status' | 'registeredAt' | 'calledAt'>): PatientEntry {
    const token = db.nextTokenNumber;
    const entry: PatientEntry = {
      ...p, id: `pt-${Date.now()}`,
      tokenNumber: token, status: 'waiting',
      registeredAt: new Date().toISOString(), calledAt: null,
    };
    update(s => ({ ...s, patients: [...s.patients, entry], nextTokenNumber: s.nextTokenNumber + 1 }));
    return entry;
  },

  updatePatientStatus(id: string, status: PatientEntry['status']) {
    update(s => ({
      ...s,
      patients: s.patients.map(p => p.id === id ? { ...p, status, calledAt: status === 'called' ? new Date().toISOString() : p.calledAt } : p),
    }));
  },

  /* Beds — upsert a ward (Clinic Staff action) */
  upsertBedWard(ward: Omit<BedWard, 'lastUpdated'>) {
    const now = new Date().toISOString();
    update(s => {
      const existing = s.beds.find(b => b.id === ward.id);
      if (existing) {
        return { ...s, beds: s.beds.map(b => b.id === ward.id ? { ...ward, lastUpdated: now } : b) };
      }
      return { ...s, beds: [...s.beds, { ...ward, lastUpdated: now }] };
    });
  },

  occupyBed(wardId: string) {
    const now = new Date().toISOString();
    update(s => ({
      ...s,
      beds: s.beds.map(b => b.id === wardId && b.occupied < b.total
        ? { ...b, occupied: b.occupied + 1, lastUpdated: now } : b),
    }));
  },

  freeBed(wardId: string) {
    const now = new Date().toISOString();
    update(s => ({
      ...s,
      beds: s.beds.map(b => b.id === wardId && b.occupied > 0
        ? { ...b, occupied: b.occupied - 1, lastUpdated: now } : b),
    }));
  },

  /* Doctor status (Doctor portal action) */
  setDoctorOnDuty(empId: string, name: string, specialty: string, facilityCode: string, onDuty: boolean) {
    const now = new Date().toISOString();
    update(s => {
      const existing = s.doctorStatuses.find(d => d.empId === empId);
      const entry: DoctorStatus = existing
        ? { ...existing, onDuty, startTime: onDuty ? now : existing.startTime, updatedAt: now }
        : { empId, name, specialty, facilityCode, onDuty, startTime: onDuty ? now : null, consultationCount: 0, updatedAt: now };
      return { ...s, doctorStatuses: s.doctorStatuses.filter(d => d.empId !== empId).concat(entry) };
    });
  },

  /* Consultations (Doctor portal action) */
  addConsultation(c: Omit<ConsultationRecord, 'id' | 'consultedAt'>) {
    const record: ConsultationRecord = { ...c, id: `con-${Date.now()}`, consultedAt: new Date().toISOString() };
    update(s => {
      const statuses = s.doctorStatuses.map(d =>
        d.empId === c.doctorEmpId ? { ...d, consultationCount: d.consultationCount + 1 } : d
      );
      // Track prescribed medicines for stock demand
      const newPrescriptions = c.prescription.split('\n').filter(Boolean).map(line => ({
        medicineName: line.split(' ')[0] ?? line,
        quantity: 1,
        consultationId: record.id,
        facilityCode: c.facilityCode,
        prescribedAt: record.consultedAt,
      }));
      return {
        ...s,
        consultations: [...s.consultations, record],
        doctorStatuses: statuses,
        prescribedMedicines: [...s.prescribedMedicines, ...newPrescriptions],
      };
    });
  },
};

/* ── Hook ────────────────────────────────────────────────── */
export function useAppDB(): AppState {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => db,
  );
}

export function getDB(): AppState { return db; }
