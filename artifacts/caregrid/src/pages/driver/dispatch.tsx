import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Package, MapPin, Clock, ArrowRight, CheckCircle,
  Truck, AlertTriangle, Navigation, Gauge,
} from 'lucide-react';
import { DISPATCH_ROUTES, type DispatchRoute } from '@/lib/data';

type RouteStatus = DispatchRoute['status'];

const BORDER_COLOR: Record<DispatchRoute['priority'], string> = {
  emergency: 'border-t-red-500',
  urgent: 'border-t-amber-400',
  normal: 'border-t-blue-500',
};

const STATUS_STYLE: Record<RouteStatus, { badge: string; label: string }> = {
  pending:    { badge: 'bg-blue-900/40 text-blue-300 border border-blue-500/30',   label: 'Pending'    },
  in_transit: { badge: 'bg-amber-900/40 text-amber-300 border border-amber-500/30', label: 'In Transit' },
  delivered:  { badge: 'bg-green-900/40 text-green-300 border border-green-500/30', label: 'Delivered'  },
  cancelled:  { badge: 'bg-red-900/40 text-red-300 border border-red-500/30',       label: 'Cancelled'  },
};

const PRIORITY_BADGE: Record<DispatchRoute['priority'], string> = {
  emergency: 'bg-red-500/20 text-red-400 border border-red-500/30',
  urgent:    'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  normal:    'bg-gray-700/50 text-gray-300 border border-gray-500/30',
};

/* Animated truck progress bar */
function RouteProgress({ status }: { status: RouteStatus }) {
  const pct = status === 'pending' ? 0 : status === 'in_transit' ? 55 : 100;
  return (
    <div className="mt-3 relative">
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            status === 'delivered' ? 'bg-green-500' :
            status === 'in_transit' ? 'bg-amber-400' : 'bg-blue-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </div>
      <motion.div
        className="absolute -top-2.5"
        animate={{ left: `${Math.max(0, pct - 4)}%` }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        <Truck className="w-4 h-4 text-blue-400" />
      </motion.div>
    </div>
  );
}

export default function DriverDispatch() {
  const [routes, setRoutes] = useState(DISPATCH_ROUTES);

  function confirmPickup(id: string) {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, status: 'in_transit' as RouteStatus } : r));
    toast.success('Pickup confirmed!', { description: 'Route status updated to In Transit.' });
  }

  function confirmDelivery(id: string) {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, status: 'delivered' as RouteStatus } : r));
    toast.success('Delivery confirmed!', { description: 'Shipment marked as delivered. 🎉', duration: 4000 });
  }

  const activeCount = routes.filter(r => r.status === 'pending' || r.status === 'in_transit').length;
  const deliveredToday = routes.filter(r => r.status === 'delivered').length;

  return (
    <div className="px-4 pt-5 pb-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-white font-bold text-base">Dispatch</h1>
        <p className="text-gray-400 text-[11px] mt-0.5">Driver: Ravi Kumar · PHC Route</p>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Active',          value: activeCount,    icon: Truck,      color: 'blue'  },
          { label: 'Delivered Today', value: deliveredToday, icon: CheckCircle, color: 'green' },
          { label: 'Dist. Today',     value: '47 km',        icon: Gauge,      color: 'amber' },
        ].map(stat => {
          const Icon = stat.icon;
          const colorCls: Record<string, string> = {
            blue: 'bg-blue-500/10 text-blue-400', green: 'bg-green-500/10 text-green-400', amber: 'bg-amber-500/10 text-amber-400',
          };
          return (
            <div key={stat.label} className="glass rounded-xl p-3 text-center">
              <div className={`w-7 h-7 rounded-lg ${colorCls[stat.color]} flex items-center justify-center mx-auto mb-1.5`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-white font-bold text-sm">{stat.value}</p>
              <p className="text-gray-400 text-[9px] mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Route Cards */}
      <AnimatePresence mode="popLayout">
        {routes.map((route, i) => (
          <motion.div
            key={route.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className={`bg-[#0d1526] border border-white/8 rounded-2xl overflow-hidden border-t-4 ${BORDER_COLOR[route.priority]}`}
          >
            <div className="p-4">
              {/* Top Row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold text-sm">{route.payload}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${PRIORITY_BADGE[route.priority]}`}>
                      {route.priority}
                    </span>
                  </div>
                  <p className="text-blue-300 text-xs mt-0.5 font-semibold">
                    {route.payloadQty.toLocaleString()} units
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[route.status].badge}`}>
                  {STATUS_STYLE[route.status].label}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-300 text-xs font-medium">{route.fromCenter}</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <motion.div
                    animate={route.status === 'in_transit' ? { x: [0, 6, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </motion.div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${route.status === 'delivered' ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-gray-300 text-xs font-medium">{route.toCenter}</span>
                </div>
              </div>

              {/* Progress track */}
              {route.status !== 'delivered' && <RouteProgress status={route.status} />}

              {/* Meta */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                  <Clock className="w-3 h-3" />
                  ETA: <span className="text-gray-300 font-medium ml-0.5">{route.eta}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                  <Navigation className="w-3 h-3" />
                  {route.createdAt}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mt-3 space-y-2">
                {route.status === 'pending' && (
                  <button
                    onClick={() => confirmPickup(route.id)}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Confirm Pickup
                  </button>
                )}
                {route.status === 'in_transit' && (
                  <button
                    onClick={() => confirmDelivery(route.id)}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm Delivery
                  </button>
                )}
                {route.status === 'delivered' && (
                  <div className="w-full h-12 bg-green-900/20 border border-green-500/30 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-bold">Delivered ✓</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {routes.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-xs">
          No active dispatch routes.
        </div>
      )}
    </div>
  );
}
