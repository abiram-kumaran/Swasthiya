import { Link, Route, Switch, useLocation } from 'wouter';
import {
  LayoutDashboard, Users, BedDouble, User,
  Building, Phone, Mail, Award, LogOut, WifiOff,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import FrontlineDashboard from './dashboard';
import FrontlinePatients from './patients';
import FrontlineBeds from './beds';
import StaffLogin from '@/lib/StaffLogin';
import { useStaffSession } from '@/lib/staffAuth';

const NAV_TABS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/staff'          },
  { label: 'Queue',     icon: Users,           href: '/staff/patients' },
  { label: 'Beds',      icon: BedDouble,       href: '/staff/beds'     },
  { label: 'Profile',   icon: User,            href: '/staff/profile'  },
];

function FrontlineProfile() {
  const staffData = {
    name: 'Nurse Vijaya Lakshmi', role: 'Senior Nurse Practitioner',
    empId: 'CG-PHC01-N04', email: 'vijaya.lakshmi@swasthiyasetu.gov.in',
    phone: '+91 98765 43210', facility: 'Peelamedu Urban PHC',
    department: 'Outpatient & Emergency Triage', shift: '09:00 AM - 05:00 PM',
    checkedInAt: '08:52 AM', rnId: 'RN-78324-IN', cprExpiry: 'Dec 2027',
  };

  return (
    <div className="pb-4 space-y-4">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-5 pb-6 rounded-b-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center font-black text-xl text-white mb-3 shadow-md">VL</div>
        <h2 className="text-base font-bold tracking-tight text-center">{staffData.name}</h2>
        <p className="text-blue-100 text-xs text-center">{staffData.role}</p>
        <span className="mt-3 flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 text-green-300 text-[10px] px-3 py-0.5 rounded-full font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />Active Duty
        </span>
      </div>
      <div className="px-4 space-y-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building className="w-4 h-4 text-blue-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Facility & Shift</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Facility', staffData.facility],['Department', staffData.department],['Shift', staffData.shift],['Checked In', staffData.checkedInAt]].map(([k,v]) => (
              <div key={k}>
                <p className="text-gray-400 text-[9px] uppercase">{k}</p>
                <p className="font-semibold text-gray-700 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <User className="w-4 h-4 text-blue-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Identity & Contact</p>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Employee ID</span>
              <span className="font-mono bg-gray-50 px-2 py-0.5 border border-gray-200 rounded text-gray-700 font-bold">{staffData.empId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Mobile</span>
              <span className="font-semibold text-gray-700 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400"/> {staffData.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Email</span>
              <span className="font-semibold text-gray-700 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400"/> {staffData.email}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Award className="w-4 h-4 text-blue-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Credentials</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">RN ID</span><span className="font-semibold text-gray-700">{staffData.rnId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">CPR Cert</span><span className="font-semibold text-gray-700">Valid till {staffData.cprExpiry}</span></div>
          </div>
        </div>
        <button onClick={() => { window.location.href = '/'; }}
          className="w-full py-3 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors">
          <LogOut className="w-4 h-4"/> Logout from Portal
        </button>
      </div>
    </div>
  );
}

/* ── Offline banner ───────────────────────────────────────── */
function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (online) return null;
  return (
    <div className="bg-amber-500 px-4 py-2 flex items-center gap-2">
      <WifiOff className="w-3.5 h-3.5 text-white shrink-0"/>
      <p className="text-white text-[11px] font-semibold">Offline Mode — Changes saved locally. Will sync when connected.</p>
    </div>
  );
}

export default function FrontlineLayout() {
  const session = useStaffSession('staff');
  const [location] = useLocation();

  if (!session) {
    return (
      <StaffLogin
        role="staff"
        accentColor="from-blue-600 to-blue-800"
        accentLight="blue"
        icon={<Users className="w-7 h-7 text-white" />}
        title="Clinic Staff Portal"
        subtitle="Swasthiya Setu · Patient Queue & Bed Management"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-[480px] mx-auto w-full flex flex-col min-h-screen relative">
        <OfflineBanner />
        <main className="flex-1 overflow-y-auto pb-20">
          <Switch>
            <Route path="/staff"           component={FrontlineDashboard} />
            <Route path="/staff/patients"  component={FrontlinePatients}  />
            <Route path="/staff/beds"      component={FrontlineBeds}      />
            <Route path="/staff/profile"   component={FrontlineProfile}   />
          </Switch>
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 pb-safe">
          <div className="max-w-[480px] mx-auto flex">
            {NAV_TABS.map(({ label, icon: Icon, href }) => {
              const isActive = location === href || (href !== '/staff' && location.startsWith(href));
              return (
                <Link key={href} href={href} className="flex-1">
                  <div className={`flex flex-col items-center gap-0.5 py-2 px-1 transition-all ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-9 h-7 flex items-center justify-center rounded-full transition-all ${isActive ? 'bg-blue-100' : ''}`}>
                      <Icon className="w-4 h-4"/>
                    </div>
                    <span className="text-[10px] font-medium">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
