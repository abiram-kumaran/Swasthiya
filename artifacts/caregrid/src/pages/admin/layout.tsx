import { useState, useEffect } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  LayoutDashboard, BarChart3, Zap, FileText, Building2,
  Shield, Bell, RefreshCw, LogOut, ChevronRight, User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AI_ACTIONS } from '@/lib/data';
import AdminOverview from './overview';
import AdminAnalytics from './analytics';
import AdminAICommand from './ai-command';
import AdminReports from './reports';

const NAV_ITEMS = [
  { label: 'Overview',   icon: LayoutDashboard, href: '/admin' },
  { label: 'Analytics',  icon: BarChart3,        href: '/admin/analytics' },
  { label: 'AI Command', icon: Zap,              href: '/admin/ai', aiAlert: true },
  { label: 'Reports',    icon: FileText,         href: '/admin/reports' },
  { label: 'Centers',    icon: Building2,        href: '/admin/centers' },
];

const BREADCRUMB_MAP: Record<string, string[]> = {
  '/admin':            ['District Admin', 'Overview'],
  '/admin/analytics':  ['District Admin', 'Analytics'],
  '/admin/ai':         ['District Admin', 'AI Command'],
  '/admin/reports':    ['District Admin', 'Reports'],
  '/admin/centers':    ['District Admin', 'Centers'],
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-xs text-gray-500 font-mono tabular-nums">
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function AdminLayout() {
  const [location] = useLocation();
  const pendingCount = AI_ACTIONS.filter(a => !a.approved && !a.rejected).length;
  const crumbs = BREADCRUMB_MAP[location] ?? ['District Admin'];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-[#0f1e2e] flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">CareGrid AI</p>
            <p className="text-blue-300 text-[10px] mt-0.5">Healthcare Platform</p>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium border border-blue-500/30">
            District Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, href, aiAlert }) => {
            const isActive = location === href || (href !== '/admin' && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className={`
                    relative flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all
                    ${isActive
                      ? 'bg-blue-500/20 border-l-2 border-blue-400 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-l-2 border-transparent'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-medium">{label}</span>
                  {aiAlert && pendingCount > 0 && (
                    <span className="ml-auto flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      <span className="text-[10px] font-bold text-red-400">{pendingCount}</span>
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom user */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-medium truncate">District Officer</p>
              <p className="text-gray-500 text-[10px] truncate">Erode District</p>
            </div>
            <button className="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ml-56 flex flex-col flex-1 min-w-0 h-screen">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 fixed left-56 right-0 top-0 z-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                <span className={`text-xs ${i === crumbs.length - 1 ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
              District: Erode
            </span>
            <LiveClock />
            <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
              <RefreshCw className="w-3 h-3" />
              Sync Data
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="mt-14 flex-1 overflow-auto">
          <Switch>
            <Route path="/admin" component={AdminOverview} />
            <Route path="/admin/analytics" component={AdminAnalytics} />
            <Route path="/admin/ai" component={AdminAICommand} />
            <Route path="/admin/reports" component={AdminReports} />
            <Route>
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Page not found
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}
