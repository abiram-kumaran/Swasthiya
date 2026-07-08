import { Link, Route, Switch, useLocation } from 'wouter';
import { Package, Navigation, AlertTriangle, User } from 'lucide-react';
import DriverDispatch from './dispatch';

const TABS = [
  { label: 'Deliveries', icon: Package,       href: '/driver' },
  { label: 'Navigate',   icon: Navigation,    href: '/driver/navigate' },
  { label: 'Emergency',  icon: AlertTriangle, href: '/driver/emergency' },
  { label: 'Profile',    icon: User,          href: '/driver/profile' },
];

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      {label} coming soon
    </div>
  );
}

export default function DriverLayout() {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col">
      <div className="max-w-[480px] mx-auto w-full flex flex-col min-h-screen relative">
        <main className="flex-1 overflow-y-auto pb-20">
          <Switch>
            <Route path="/driver"           component={DriverDispatch} />
            <Route path="/driver/navigate">  <Placeholder label="Navigate" /></Route>
            <Route path="/driver/emergency"> <Placeholder label="Emergency" /></Route>
            <Route path="/driver/profile">   <Placeholder label="Profile" /></Route>
          </Switch>
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0d1526] border-t border-white/10 pb-safe">
          <div className="max-w-[480px] mx-auto flex">
            {TABS.map(({ label, icon: Icon, href }) => {
              const isActive = location === href || (href !== '/driver' && location.startsWith(href));
              return (
                <Link key={href} href={href} className="flex-1">
                  <div className={`flex flex-col items-center gap-0.5 py-2.5 px-1 transition-all ${
                    isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                    <div className={`w-9 h-7 flex items-center justify-center rounded-full ${isActive ? 'bg-blue-500/20' : ''}`}>
                      <Icon className="w-4 h-4" />
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
