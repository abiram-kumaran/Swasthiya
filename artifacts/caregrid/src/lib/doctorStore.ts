/**
 * Doctor session & attendance store — localStorage persisted.
 * Simulates NMC-verified doctor session with biometric auth.
 */
import { useSyncExternalStore } from 'react';

export interface DoctorSession {
  nmcId: string;
  name: string;
  phone: string;
  specialty: string;
  empId: string;
  regId: string;
  phcId: string;
  phcName: string;
  district: string;
  biometricVerified: boolean;
  trustedDevice: boolean;
  loginAt: string;
  lastActivity: string;
  sessionToken: string;
}

export interface AttendanceRecord {
  date: string;
  startTime: string | null;
  endTime: string | null;
  dutyHours: number;
  patientsConsulted: number;
  referrals: number;
  labRequests: number;
  gpsVerified: boolean;
  wifiVerified: boolean;
  faceVerified: boolean;
  status: 'on_duty' | 'off_duty' | 'not_started';
}

interface DoctorState {
  session: DoctorSession | null;
  attendance: AttendanceRecord | null;
  consultationCount: number;
  referralCount: number;
  labCount: number;
}

const KEY = 'swasthiyasetu_doctor_v1';
type L = () => void;
const ls = new Set<L>();

let state: DoctorState = (() => {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : { session: null, attendance: null, consultationCount: 0, referralCount: 0, labCount: 0 }; }
  catch { return { session: null, attendance: null, consultationCount: 0, referralCount: 0, labCount: 0 }; }
})();

function notify() { ls.forEach(l => l()); }
function save()   { localStorage.setItem(KEY, JSON.stringify(state)); }
function sub(cb: L) { ls.add(cb); return () => ls.delete(cb); }
function snap() { return state; }

// Pre-registered doctors (simulates backend registry)
export const REGISTERED_DOCTORS: Record<string, { name: string; phone: string; specialty: string; empId: string; phcId: string; phcName: string }> = {
  'TN-MC-34521': { name: 'Dr. Arumugam R.', phone: '+91 98012 34567', specialty: 'General Medicine', empId: 'CG-PHC01-MO01', phcId: 'phc-01', phcName: 'Peelamedu Urban PHC' },
  'TN-MC-22341': { name: 'Dr. Sundari P.',  phone: '+91 98012 11111', specialty: 'Paediatrics',      empId: 'CG-PHC01-MO02', phcId: 'phc-01', phcName: 'Peelamedu Urban PHC' },
  'TN-MC-55678': { name: 'Dr. Rajan K.',    phone: '+91 98012 22222', specialty: 'General Medicine', empId: 'CG-PHC02-MO01', phcId: 'phc-02', phcName: 'Singanallur Urban PHC' },
};

export const doctorActions = {
  validateNMC(nmcId: string): 'valid' | 'not_found' | 'inactive' {
    return REGISTERED_DOCTORS[nmcId.toUpperCase()] ? 'valid' : 'not_found';
  },

  createSession(nmcId: string): boolean {
    const doc = REGISTERED_DOCTORS[nmcId.toUpperCase()];
    if (!doc) return false;
    const session: DoctorSession = {
      nmcId: nmcId.toUpperCase(),
      name: doc.name,
      phone: doc.phone,
      specialty: doc.specialty,
      empId: doc.empId,
      regId: nmcId.toUpperCase(),
      phcId: doc.phcId,
      phcName: doc.phcName,
      district: 'Coimbatore District',
      biometricVerified: false,
      trustedDevice: false,
      loginAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      sessionToken: `dr-${Date.now().toString(36)}`,
    };
    state = { ...state, session };
    save(); notify();
    return true;
  },

  verifyBiometric() {
    if (!state.session) return;
    state = { ...state, session: { ...state.session, biometricVerified: true, trustedDevice: true } };
    save(); notify();
  },

  startDuty() {
    const now = new Date();
    const att: AttendanceRecord = {
      date: now.toISOString().split('T')[0],
      startTime: now.toTimeString().slice(0, 5),
      endTime: null, dutyHours: 0, patientsConsulted: 0,
      referrals: 0, labRequests: 0,
      gpsVerified: true, wifiVerified: true, faceVerified: true,
      status: 'on_duty',
    };
    state = { ...state, attendance: att };
    save(); notify();
    // Push to appDB so Clinic Staff and Admin see doctor online
    if (state.session) {
      import('./appDB').then(m => {
        m.db_actions.setDoctorOnDuty(
          state.session!.empId, state.session!.name,
          state.session!.specialty, state.session!.phcId, true
        );
      });
    }
  },

  endDuty() {
    if (!state.attendance) return;
    const now = new Date();
    const start = state.attendance.startTime ?? '09:00';
    const [sh, sm] = start.split(':').map(Number);
    const hours = (now.getHours() - sh) + (now.getMinutes() - sm) / 60;
    state = {
      ...state,
      attendance: {
        ...state.attendance,
        endTime: now.toTimeString().slice(0, 5),
        dutyHours: Math.max(0, Math.round(hours * 10) / 10),
        patientsConsulted: state.consultationCount,
        referrals: state.referralCount,
        labRequests: state.labCount,
        status: 'off_duty',
      },
    };
    save(); notify();
    // Update appDB — doctor now offline
    if (state.session) {
      import('./appDB').then(m => {
        m.db_actions.setDoctorOnDuty(
          state.session!.empId, state.session!.name,
          state.session!.specialty, state.session!.phcId, false
        );
      });
    }
  },

  addConsultation() {
    state = { ...state, consultationCount: state.consultationCount + 1 };
    save(); notify();
  },

  addReferral() {
    state = { ...state, referralCount: state.referralCount + 1 };
    save(); notify();
  },

  addLabRequest() {
    state = { ...state, labCount: state.labCount + 1 };
    save(); notify();
  },

  logout() {
    state = { session: null, attendance: null, consultationCount: 0, referralCount: 0, labCount: 0 };
    localStorage.removeItem(KEY);
    notify();
  },
};

export function useDoctorStore() {
  return useSyncExternalStore(sub, snap);
}
