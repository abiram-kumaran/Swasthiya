import { Building, Phone, Mail, User, Package, Wifi, Bell, LogOut, Globe, Eye } from 'lucide-react';

export default function StockProfile() {
  const profile = {
    name: 'Kumar Selvam',
    role: 'Stock Handler',
    empId: 'CG-PHC01-SH02',
    email: 'kumar.selvam@swasthiyasetu.gov.in',
    phone: '+91 94567 89012',
    facility: 'Peelamedu Urban PHC',
    district: 'Coimbatore District',
    shift: '08:00 AM – 04:00 PM',
    lastSync: '2 minutes ago',
    offlineMode: false,
  };

  return (
    <div className="pb-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 pt-5 pb-6 rounded-b-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center font-black text-xl text-white mb-3 shadow-md">
          KS
        </div>
        <h2 className="text-base font-bold tracking-tight">{profile.name}</h2>
        <p className="text-emerald-100 text-xs">{profile.role}</p>
        <span className="mt-3 flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 text-green-200 text-[10px] px-3 py-0.5 rounded-full font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300 blink" />
          On Duty
        </span>
      </div>

      <div className="px-4 space-y-3">
        {/* Facility & Shift */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Assigned PHC</p>
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
          </div>
        </div>

        {/* Identity & Contact */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <User className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Identity & Contact</p>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Employee ID</span>
              <span className="font-mono bg-gray-50 px-2 py-0.5 border border-gray-200 rounded text-gray-700 font-bold">{profile.empId}</span>
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

        {/* Responsibilities */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Responsibilities</p>
          </div>
          <div className="space-y-1.5">
            {[
              'Receiving & recording medicines',
              'Updating stock quantities',
              'Issuing medicines to pharmacy',
              'Recording damaged medicines',
              'Monitoring expiry dates',
              'Transferring to nearby PHCs',
              'Performing stock audits',
            ].map(r => (
              <div key={r} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-gray-600">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Offline Sync Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Sync Status</p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-gray-700">Last Sync</p>
              <p className="text-gray-400 text-[10px] mt-0.5">{profile.lastSync}</p>
            </div>
            <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 blink" />
              Online · Synced
            </span>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 shadow-sm overflow-hidden">
          {[
            { icon: Bell, label: 'Notifications', value: 'Enabled' },
            { icon: Globe, label: 'Language', value: 'English / தமிழ்' },
            { icon: Eye, label: 'Accessibility', value: 'Standard' },
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
