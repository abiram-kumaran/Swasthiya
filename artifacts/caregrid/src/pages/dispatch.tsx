import React, { useEffect, useState } from 'react';
import { useListDispatch, useUpdateDispatch } from '@workspace/api-client-react';
import {
  Package, CheckCircle2, Truck, Navigation2, ArrowRight,
  MapPin, Clock, Phone, Shield, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { toast } from 'sonner';

/* ─── Route progress track ────────────────────────────────── */
function RouteTrack({
  fromName, toName, status,
}: { fromName: string; toName: string; status: string }) {
  const isPending    = status === 'pending';
  const isInTransit  = status === 'in_transit';
  const isCompleted  = status === 'completed';

  const pct = isCompleted ? 100 : isInTransit ? 55 : 0;

  return (
    <div className="py-4 px-1">
      {/* Labels */}
      <div className="flex justify-between mb-3">
        <div>
          <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Pickup</p>
          <p className="text-sm font-bold text-white truncate max-w-[120px]">{fromName}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Delivery</p>
          <p className="text-sm font-bold text-white truncate max-w-[120px]">{toName}</p>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-8 flex items-center">
        {/* Background rail */}
        <div className="absolute inset-x-3 h-1 bg-white/15 rounded-full" />
        {/* Progress fill */}
        <motion.div
          className="absolute left-3 h-1 bg-blue-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `calc(${pct}% - 24px)` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Origin dot */}
        <div className={`absolute left-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center z-10 ${
          pct > 0 ? 'bg-blue-400' : 'bg-white/20'
        }`}>
          <MapPin className="w-2.5 h-2.5 text-white" />
        </div>

        {/* Truck marker */}
        {isInTransit && (
          <motion.div
            className="absolute w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-20 shadow-[0_0_16px_rgba(96,165,250,0.6)]"
            style={{ left: `calc(${pct}% - 16px)` }}
          >
            <Truck className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Destination dot */}
        <div className={`absolute right-0 w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center ${
          isCompleted ? 'bg-emerald-400 border-emerald-300' : 'bg-white/10 border-white/30'
        }`}>
          <MapPin className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* Status label */}
      <div className="flex justify-center mt-2">
        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
          isInTransit  ? 'bg-blue-400/20 text-blue-300'   :
          isCompleted  ? 'bg-emerald-400/20 text-emerald-300' :
          'bg-white/10 text-white/50'
        }`}>
          {status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

/* ─── Route Card ──────────────────────────────────────────── */
function RouteCard({ route, onUpdate, isPending }: {
  route: {
    id: number; fromCenterName: string; toCenterName: string;
    payload: string; status: string; estimatedMinutes?: number | null;
    driverName?: string | null; createdAt: string;
  };
  onUpdate: (id: number, next: 'in_transit' | 'completed') => void;
  isPending: boolean;
}) {
  const isPend     = route.status === 'pending';
  const isTransit  = route.status === 'in_transit';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -16 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      layout
      className="rounded-3xl overflow-hidden shadow-2xl"
      style={{ background: 'linear-gradient(145deg, #1a2744 0%, #0f1d38 100%)' }}
    >
      {/* Top strip */}
      <div className={`h-1.5 ${isPend ? 'bg-blue-500' : isTransit ? 'bg-amber-400' : 'bg-emerald-400'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mb-0.5">Payload</p>
              <p className="font-black text-white text-base leading-tight">{route.payload}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
            isPend    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' :
            isTransit ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                        'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
          }`}>
            {route.status.replace('_', ' ')}
          </div>
        </div>

        {/* Route track */}
        <RouteTrack
          fromName={route.fromCenterName}
          toName={route.toCenterName}
          status={route.status}
        />

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4 mb-5 text-gray-400">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>~{route.estimatedMinutes ?? 35} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Optimised Route</span>
          </div>
        </div>

        {/* Action button */}
        {(isPend || isTransit) && (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              onClick={() => onUpdate(route.id, isPend ? 'in_transit' : 'completed')}
              disabled={isPending}
              className={`w-full h-16 text-base font-black rounded-2xl shadow-xl transition-all ${
                isPend
                  ? 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/30 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30 text-white'
              }`}
            >
              {isPend ? (
                <>
                  <Truck className="w-5 h-5 mr-2" />
                  Confirm Pickup
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirm Delivery
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Emergency call */}
        <button className="w-full mt-3 flex items-center justify-center gap-2 text-gray-500 text-xs font-semibold py-2">
          <Phone className="w-3.5 h-3.5" /> Contact Dispatch Control
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Dispatch Page ──────────────────────────────────── */
export default function Dispatch() {
  // Apply dark mode for driver app
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const { data: routes, refetch } = useListDispatch(undefined, {
    query: { queryKey: ['dispatch-routes'], refetchInterval: 5000 },
  });
  const updateDispatch = useUpdateDispatch();

  const [completedIds, setCompletedIds] = useState<number[]>([]);

  const handleUpdate = (id: number, nextStatus: 'in_transit' | 'completed') => {
    updateDispatch.mutate({ id, data: { status: nextStatus } }, {
      onSuccess: () => {
        if (nextStatus === 'completed') {
          setCompletedIds(prev => [...prev, id]);
          toast.success('Delivery confirmed! Inventory updated.', {
            description: 'Firestore records synced.',
            duration: 4000,
          });
        } else {
          toast.info('En route! Navigation started.', { duration: 3000 });
        }
        refetch();
      },
    });
  };

  const activeRoutes = routes?.filter(r =>
    r.status !== 'cancelled' && !completedIds.includes(r.id)
  ) ?? [];

  return (
    <div className="max-w-[480px] mx-auto min-h-[100dvh] bg-[#080d1a] flex flex-col font-sans pb-8">

      {/* Header */}
      <header className="px-5 pt-12 pb-5 flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, #0d1526 0%, transparent 100%)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Logistics Driver</h1>
              <p className="text-xs text-gray-400 font-medium">CareGrid Critical Network</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 blink" />
              ONLINE
            </div>
            <span className="text-[10px] text-gray-500 font-semibold">Driver: Ravi Kumar</span>
          </div>
        </div>
      </header>

      {/* Stats row */}
      <div className="px-5 mb-5 flex gap-3">
        {[
          { label: 'Active Missions', value: activeRoutes.filter(r => r.status !== 'completed').length, color: 'blue' },
          { label: 'Completed Today', value: completedIds.length, color: 'emerald' },
        ].map(s => (
          <div key={s.label}
            className="flex-1 rounded-2xl p-3 border"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p className={`text-2xl font-black ${s.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Routes */}
      <main className="flex-1 px-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            Active Routes ({activeRoutes.length})
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold">
            <Navigation2 className="w-3 h-3" />
            AI-Optimised
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {activeRoutes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">All Clear!</p>
                <p className="text-gray-400 text-sm mt-1">No active missions. Standing by.</p>
              </div>
              <Link href="/dashboard">
                <button className="mt-2 px-5 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-bold">
                  Return to Command
                </button>
              </Link>
            </motion.div>
          ) : (
            activeRoutes.map(route => (
              <RouteCard
                key={route.id}
                route={route as any}
                onUpdate={handleUpdate}
                isPending={updateDispatch.isPending}
              />
            ))
          )}
        </AnimatePresence>
      </main>

      {/* Footer branding */}
      <div className="text-center pt-6 pb-2">
        <div className="flex items-center justify-center gap-1.5 text-gray-600">
          <Shield className="w-3 h-3" />
          <span className="text-[10px] font-semibold">CareGrid AI · Secure Dispatch Network</span>
        </div>
      </div>
    </div>
  );
}
