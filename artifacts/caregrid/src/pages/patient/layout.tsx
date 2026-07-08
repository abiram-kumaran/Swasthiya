import { Route, Switch, useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Home, MapPin, MessageCircle, User } from 'lucide-react';
import PatientHome from './home';
import PatientMap from './map';
import PatientChat from './chat';
import PatientProfile from './profile';
import PatientAppointment from './appointment';

const TABS = [
  { href:'/patient/home',    icon:<Home className="w-5 h-5" />,          label:'Home'    },
  { href:'/patient/map',     icon:<MapPin className="w-5 h-5" />,        label:'Map'     },
  { href:'/patient/chat',    icon:<MessageCircle className="w-5 h-5" />, label:'AI Chat' },
  { href:'/patient/profile', icon:<User className="w-5 h-5" />,          label:'Profile' },
];

import { useTranslation } from '@/lib/translations';

export default function PatientLayout() {
  const [location] = useLocation();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] relative flex flex-col min-h-screen shadow-2xl bg-gray-50">
        <div className="flex-1 overflow-y-auto pb-[68px]">
          <Switch>
            <Route path="/patient/home"    component={PatientHome}    />
            <Route path="/patient/map"     component={PatientMap}     />
            <Route path="/patient/chat"    component={PatientChat}    />
            <Route path="/patient/profile" component={PatientProfile} />
            <Route path="/patient/appointment" component={PatientAppointment} />
            <Route path="/patient">{() => { window.location.replace('/patient/home'); return null; }}</Route>
          </Switch>
        </div>
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white border-t border-gray-100 shadow-lg pb-safe">
          <div className="flex items-center justify-around py-1">
            {TABS.map(tTab => {
              const active = location === tTab.href || location.startsWith(tTab.href + '/');
              const label = tTab.href === '/patient/home' ? t('home', 'Home') :
                            tTab.href === '/patient/map' ? t('map', 'Map') :
                            tTab.href === '/patient/chat' ? t('aiChat', 'AI Chat') :
                            t('profile', 'Profile');
              return (
                <Link key={tTab.href} href={tTab.href}>
                  <motion.div whileTap={{ scale:.9 }}
                    className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl cursor-pointer transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    <div className={`w-9 h-6 flex items-center justify-center rounded-lg transition-colors ${active ? 'bg-blue-50' : ''}`}>
                      {tTab.icon}
                    </div>
                    <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
