import { useState } from 'react';
import { Building, Phone, Mail, User, Stethoscope, Calendar, Bell, Globe, Eye, LogOut, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorProfile() {
  const [available, setAvailable] = useState(true);

  const profile = {
    name: 'Dr. Arumugam R.',
    role: 'Medical Officer (MBBS)',
    regId: 'TN-MC-34521',
    empId: 'CG-PHC01-MO01',
    email: 'arumugam.r@caregrid.gov.in',
    phone: '+91 98012 34567',
    facility: 'Peelamedu Urban PHC',
    district: 'Coimbatore District',
    shift: '09:00 AM – 05:00 PM',
    specialty: 'General Medicine',
    experience: '9 years',
    attendance: '96%',
    patientsToday: 38,
  };

  return (
    <div className="pb-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white px-4 pt-5 pb-6 rounded-b-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center font-black text-xl text-white mb-3 shadow-md">
          AR
        </div>
        <h2 className="text-base font-bold tracking-tight text-center">{profile.name}</h2>
        <p className="text-cyan-100 text-xs text-center">{profile.role}</p>
        <span className="text-[10px] text-cyan-200 mt-1">{profile.specialty} · {profile.experience} experience</span>
        <button
          onClick={() => { setAvailable(v => !v); toast.success(available ? 'Status set to Unavailable' : 'Status set to Available'); }}
          className={`mt-3 flex items-center gap-1.5 border text-[10px] px-3 py-0.5 rounded-full font-bold transition-all ${
            available
              ? 'bg-green-500/20 border-green-400/30 text-green-200'
              : 'bg-red-500/20 border-red-400/30 text-red-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-green-300 blink' : 'bg-red-300'}`} />
          {available ? 'Available for Consultation' : 'Unavailable'}
        </button>
      </div>

      <div className="px-4 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Today\'s Patients', value: profile.patientsToday, color: 'blue' },
            { label: 'Attendance', value: profile.attendance, color: 'green' },
            { label: 'Experience', value: profile.experience, color: 'cyan' },
          ].map(s => {
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-50 text-blue-700 border-blue-100',
              green: 'bg-green-50 text-green-700 border-green-100',
              cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
            };
            return (
              <div key={s.label} className={`rounded-xl p-2.5 border text-center ${colorMap[s.color]}`}>
                <p className="text-base font-bold">{s.value}</p>
                <p className="text-[9px] mt-0.5 opacity-80">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Facility & Schedule */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building className="w-4 h-4 text-cyan-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Facility & Schedule</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-400 text-[9px] uppercase">Facility</p>
              <p className="font-bold text-gray-700 mt-0.5">{profile.facility}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[9px] uppercase">District</p>
              <p className="font-semibold text-gray-700 mt-0.5">{profile.district}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[9px] uppercase">Shift</p>
              <p className="font-semibold text-gray-700 mt-0.5">{profile.shift}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[9px] uppercase">Specialty</p>
              <p className="font-semibold text-gray-700 mt-0.5">{profile.specialty}</p>
            </div>
          </div>
        </div>

        {/* Identity & Credentials */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Award className="w-4 h-4 text-cyan-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Credentials & Contact</p>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Employee ID</span>
              <span className="font-mono bg-gray-50 px-2 py-0.5 border border-gray-200 rounded text-gray-700 font-bold">{profile.empId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Medical Reg. No.</span>
              <span className="font-bold text-gray-700">{profile.regId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Mobile</span>
              <span className="font-semibold text-gray-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> {profile.phone}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Email</span>
              <span className="font-semibold text-gray-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {profile.email}
              </span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 shadow-sm overflow-hidden">
          {[
            { icon: Bell, label: 'Notifications', value: 'All Alerts' },
            { icon: Globe, label: 'Language', value: 'English / தமிழ்' },
            { icon: Eye, label: 'Accessibility', value: 'Standard' },
            { icon: Calendar, label: 'Schedule', value: 'Mon – Sat' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-700">{label}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { window.location.href = '/'; }}
          className="w-full py-3 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout from Portal
        </button>
      </div>
    </div>
  );
}
