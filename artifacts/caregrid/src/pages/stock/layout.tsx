import { Link, Route, Switch, useLocation } from 'wouter';
import { LayoutDashboard, Package, ArrowLeftRight, User } from 'lucide-react';
import StockDashboard from './dashboard';
import StockInventory from './inventory';
import StockTransfers from './transfers';
import StockProfile from './profile';
import StaffLogin from '@/lib/StaffLogin';
import { useStaffSession } from '@/lib/staffAuth';

const NAV_TABS = [
  { label: 'Dashboard',  icon: LayoutDashboard,  href: '/stock' },
  { label: 'Inventory',  icon: Package,           href: '/stock/inventory' },
  { label: 'Transfers',  icon: ArrowLeftRight,    href: '/stock/transfers' },
  { label: 'Profile',    icon: User,              href: '/stock/profile' },
];

function StockWorkspace() {
  const [location] = useLocation();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-[480px] mx-auto w-full flex flex-col min-h-screen relative">
        <main className="flex-1 overflow-y-auto pb-20">
          <Switch>
            <Route path="/stock"             component={StockDashboard}  />
            <Route path="/stock/inventory"   component={StockInventory}  />
            <Route path="/stock/transfers"   component={StockTransfers}  />
            <Route path="/stock/profile"     component={StockProfile}    />
          </Switch>
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 pb-safe">
          <div className="max-w-[480px] mx-auto flex">
            {NAV_TABS.map(({ label, icon: Icon, href }) => {
              const isActive = location === href || (href !== '/stock' && location.startsWith(href));
              return (
                <Link key={href} href={href} className="flex-1">
                  <div className={`flex flex-col items-center gap-0.5 py-2 px-1 transition-all ${
                    isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                    <div className={`w-9 h-7 flex items-center justify-center rounded-full transition-all ${isActive ? 'bg-emerald-100' : ''}`}>
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

export default function StockLayout() {
  const session = useStaffSession('stock');
  if (!session) {
    return (
      <StaffLogin
        role="stock"
        accentColor="from-emerald-600 to-emerald-800"
        accentLight="emerald"
        icon={<Package className="w-7 h-7 text-white" />}
        title="Stock Handler Portal"
        subtitle="CareGrid AI · Medicine Inventory Management"
      />
    );
  }
  return <StockWorkspace />;
}
