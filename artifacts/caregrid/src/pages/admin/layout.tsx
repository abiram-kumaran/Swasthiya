import { useState, useEffect } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  LayoutDashboard, Map, Package, Zap, BarChart3,
  Fingerprint, Shield, Chrome, AlertCircle, LogOut,
  CheckCircle, X, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAdminSession, adminSessionActions } from '@/lib/adminStore';
import AdminDashboard from './dashboard';
import AdminMapPage from './map-page';
import AdminStockRequests from './stock-requests';
import AdminAICommand from './ai-command';
import AdminAnalytics from './analytics';

/* ── Allowed gov domains ─────────────────────────────────── */
const GOV_DOMAINS = ['.gov.in', '@nhm.gov.in', '@health.gov.in', '@nic.in', '@districts.tn.gov.in'];

/* ── Zero-Trust Login ────────────────────────────────────── */
type LoginStep = 'sso' | 'biometric' | 'denied';

function AdminLogin() {
  const [step, setStep] = useState<LoginStep>('sso');
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState('');

  /* Simulate Google SSO */
  function handleGoogleSSO() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulate: prompt for email to demo auth
      const email = window.prompt(
        'Enter your government email address\n(e.g. officer@coimbatore.tn.gov.in)',
        'officer@coimbatore.tn.gov.in'
      );
      if (!email) return;
      const allowed = GOV_DOMAINS.some(d => email.toLowerCase().includes(d.replace('@', '').split('.').slice(0).join('.')));
      const isGov = email.toLowerCase().match(/\.(gov\.in|nic\.in)$/);
      if (!isGov && !email.toLowerCase().includes('gov.in')) {
        setDenied(email);
        setStep('denied');
        return;
      }
      const name = email.split('@')[0].split('.').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const result = adminSessionActions.login(email, name);
      if (result === 'unauthorized') { setDenied(email); setStep('denied'); }
      else setStep('biometric');
    }, 1200);
  }

  /* Simulate WebAuthn biometric */
  function handleBiometric() {
    setLoading(true);
    // Try WebAuthn if available
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          if (available) {
            // Simulate passkey challenge
            setTimeout(() => {
              adminSessionActions.verifyBiometric();
              setLoading(false);
              toast.success('Biometric verified. Welcome, District Administrator.');
            }, 1500);
          } else {
            // Fallback: simulated PIN/confirm
            setTimeout(() => {
              adminSessionActions.verifyBiometric();
              setLoading(false);
              toast.success('Identity verified. Welcome, District Administrator.');
            }, 1500);
          }
        });
    } else {
      setTimeout(() => {
        adminSessionActions.verifyBiometric();
        setLoading(false);
      }, 1500);
    }
  }

  if (step === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Access Denied</h2>
          <p className="text-red-300 text-sm font-semibold mb-1">Unauthorized Government Account</p>
          <p className="text-slate-400 text-xs mb-1 break-all">{denied}</p>
          <p className="text-slate-500 text-[11px] mb-6">
            Only accounts with verified government email domains are permitted to access this portal.
          </p>
          <button onClick={() => { setStep('sso'); setDenied(''); }}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Try Different Account
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)' }}>
      {/* GOI header */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-black text-base tracking-tight">CareGrid AI</p>
            <p className="text-blue-300 text-[11px]">District Command Center</p>
          </div>
        </div>
        <div className="text-center mb-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Government of India · National Health Mission
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <AnimatePresence mode="wait">

          {/* SSO Step */}
          {step === 'sso' && (
            <motion.div key="sso" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-white font-black text-2xl mb-2">District Admin Portal</h1>
                <p className="text-slate-400 text-sm">Zero-Trust Government Access</p>
              </div>

              {/* Security badges */}
              <div className="grid grid-cols-3 gap-2 mb-8">
                {[
                  { icon: '🛡️', label: 'Zero Trust' },
                  { icon: '🔑', label: 'WebAuthn' },
                  { icon: '🏛️', label: 'Gov Verified' },
                ].map(b => (
                  <div key={b.label} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-lg mb-0.5">{b.icon}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{b.label}</p>
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleGoogleSSO} disabled={loading}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 rounded-2xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-white/10 mb-4">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
                    className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                ) : (
                  <Chrome className="w-5 h-5 text-blue-600" />
                )}
                {loading ? 'Authenticating…' : 'Continue with Government Google Account'}
              </motion.button>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <p className="text-[10px] text-yellow-300 text-center font-medium">
                  ⚠️ Only @health.gov.in, @nhm.gov.in and district government accounts are authorized.
                </p>
              </div>
            </motion.div>
          )}

          {/* Biometric Step */}
          {step === 'biometric' && (
            <motion.div key="biometric" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm mx-auto text-center">
              <div className="w-20 h-20 rounded-2xl bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-green-400 text-sm font-semibold mb-1">Government Account Verified</p>
              <h2 className="text-white font-black text-xl mb-2">Verify Your Identity</h2>
              <p className="text-slate-400 text-sm mb-8">
                Complete biometric verification to access the Command Center
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {['Face ID', 'Touch ID', 'Fingerprint', 'Security Key'].map(m => (
                  <div key={m} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400">{m}</p>
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleBiometric} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-3">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
                    className="w-5 h-5 border-2 border-blue-300 border-t-white rounded-full" />
                ) : (
                  <Fingerprint className="w-5 h-5" />
                )}
                {loading ? 'Verifying identity…' : 'Verify with Biometrics'}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="text-center pb-8">
        <p className="text-slate-600 text-[10px]">NHM · Govt. of India · Secure Government Portal</p>
      </div>
    </div>
  );
}

/* ── Bottom navigation ───────────────────────────────────── */
const NAV_TABS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin'             },
  { label: 'Map',       icon: Map,             href: '/admin/map'         },
  { label: 'Medicine',  icon: Package,         href: '/admin/stock-requests' },
  { label: 'AI',        icon: Zap,             href: '/admin/ai'          },
  { label: 'Analytics', icon: BarChart3,       href: '/admin/analytics'   },
];

/* ── Main layout (authenticated) ────────────────────────── */
function AdminCommandCenter() {
  const [location] = useLocation();
  const session = useAdminSession();

  // Auto-logout after 30 min inactivity
  useEffect(() => {
    const handle = () => adminSessionActions.touch();
    document.addEventListener('touchstart', handle);
    document.addEventListener('click', handle);
    const timer = setInterval(() => {
      const s = session;
      if (s) {
        const idle = Date.now() - new Date(s.lastActivity).getTime();
        if (idle > 30 * 60 * 1000) {
          adminSessionActions.logout();
          toast.error('Session expired due to inactivity.');
        }
      }
    }, 60000);
    return () => {
      document.removeEventListener('touchstart', handle);
      document.removeEventListener('click', handle);
      clearInterval(timer);
    };
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-[480px] mx-auto w-full flex flex-col min-h-screen relative">
        <main className="flex-1 overflow-y-auto pb-20">
          <Switch>
            <Route path="/admin"               component={AdminDashboard}     />
            <Route path="/admin/map"           component={AdminMapPage}       />
            <Route path="/admin/stock-requests" component={AdminStockRequests} />
            <Route path="/admin/ai"            component={AdminAICommand}     />
            <Route path="/admin/analytics"     component={AdminAnalytics}     />
          </Switch>
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
          <div className="max-w-[480px] mx-auto flex">
            {NAV_TABS.map(({ label, icon: Icon, href }) => {
              const isActive = location === href || (href !== '/admin' && location.startsWith(href));
              return (
                <Link key={href} href={href} className="flex-1">
                  <div className={`flex flex-col items-center gap-0.5 py-2 px-1 transition-all ${
                    isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                    <div className={`w-9 h-7 flex items-center justify-center rounded-full transition-all ${
                      isActive ? 'bg-indigo-100' : ''
                    }`}>
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

/* ── Root layout export ──────────────────────────────────── */
export default function AdminLayout() {
  const session = useAdminSession();

  if (!session || !session.biometricVerified) {
    return <AdminLogin />;
  }

  return <AdminCommandCenter />;
}
