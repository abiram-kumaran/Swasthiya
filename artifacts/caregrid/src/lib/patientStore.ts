/**
 * Patient profile store — persisted in localStorage.
 * Single source of truth for the logged-in patient's data.
 */

export interface PatientProfile {
  phone: string;
  name: string;
  abhaId: string;
  dob: string;           // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  weight: string;
  height: string;
  village: string;
  district: string;
  pincode: string;
  conditions: string[];
  allergies: string[];
  currentMedications: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  language: string;
  notifications: boolean;
  registeredAt: string;
}

const STORAGE_KEY = 'caregrid_patient_v1';

export function getPatient(): PatientProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePatient(data: PatientProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('patientUpdated'));
}

export function updatePatient(partial: Partial<PatientProfile>): void {
  const existing = getPatient();
  if (!existing) return;
  savePatient({ ...existing, ...partial });
}

export function clearPatient(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('patientUpdated'));
}

export function isRegistered(): boolean {
  return getPatient() !== null;
}

/** Derive initials from name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
}

/** Derive age from DOB */
export function getAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
