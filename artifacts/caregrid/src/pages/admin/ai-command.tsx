import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Zap, Check, X, AlertTriangle, Package, User, Activity, Users, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { AI_ACTIONS, CENTERS, type AIAction } from '@/lib/data';

const BORDER: Record<AIAction['severity'], string> = {
  critical: 'border-t-red-500', warning: 'border-t-orange-400', info: 'border-t-blue-400',
};
const SEV_BADGE: Record<AIAction['severity'], string> = {
  critical: 'bg-red-100 text-red-700', warning: 'bg-orange-100 text-orange-700', info: 'bg-blue-100 text-blue-700',
};

function TypeIcon({ type }: { type: AIAction['type'] }) {
  const c = 'w-3.5 h-3.5';
  if (type === 'medicine') return <Package className={c}/>;
  if (type === 'doctor')   return <User className={c}/>;
  if (type === 'disease')  return <Activity className={c}/>;
  if (type === 'footfall') return <Users className={c}/>;
  return <Zap className={c}/>;
}

export default function AdminAICommand() {
  const [processed, setProcessed] = useState<Map<string, 'approved'|'rejected'>>(new Map());
  const pending = AI_ACTIONS.filter(a => !processed.has(a.id));
  const approvedIds = new Set([...processed.entries()].filter(([,v])=>v==='approved').map(([k])=>k));

  function approve(id: string) {
    setProcessed(p => new Map(p).set(id, 'approved'));
    toast.success('Action approved. Field team notified.');
  }
  function reject(id: string) {
    setProcessed(p => new Map(p).set(id, 'rejected'));
    toast.error('Action dismissed.');
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/30 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h1 className="text-sm font-bold">AI Command Centre</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] bg-purple-500/30 text-purple-200 font-semibold px-2 py-0.5 rounded-full">Gemini 1.5 Pro</span>
                <span className="flex items-center gap-1 text-[9px] text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink"/>Live
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => toast.info('Refreshing AI feed…')}
            className="p-2 bg-white/10 rounded-xl">
            <RefreshCw className="w-4 h-4 text-white"/>
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* Status banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-3.5 text-white">
          <p className="text-[11px] font-medium leading-relaxed">
            AI monitoring <strong>{CENTERS.length} centres</strong>, <strong>8 medicines</strong>, <strong>4 doctors</strong> in real time.{' '}
            {pending.length > 0
              ? <><strong>{pending.length} action{pending.length > 1 ? 's' : ''}</strong> need your approval.</>
              : <strong>All actions processed. System healthy. ✓</strong>}
          </p>
        </div>

        {/* Action cards */}
        <AnimatePresence mode="popLayout">
          {pending.map(action => (
            <motion.div key={action.id} layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: processed.get(action.id) === 'approved' ? -80 : 80, scale: 0.95 }}
              transition={{ duration: 0.28 }}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 ${BORDER[action.severity]}`}
            >
              <div className="p-3.5">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {action.severity === 'critical'
                    ? <AlertTriangle className="w-4 h-4 text-red-500"/>
                    : action.severity === 'warning'
                    ? <AlertTriangle className="w-4 h-4 text-orange-400"/>
                    : <Info className="w-4 h-4 text-blue-400"/>}
                  <TypeIcon type={action.type} />
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-100">
                    {action.phcName}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${SEV_BADGE[action.severity]}`}>
                    {action.severity}
                  </span>
                  <span className="ml-auto text-[9px] text-gray-400">{action.createdAt}</span>
                </div>

                <h3 className="text-sm font-bold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{action.message}</p>

                {/* AI reason */}
                <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl px-3 py-2 mb-3">
                  <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-wide mb-0.5">🤖 AI Recommendation</p>
                  <p className="text-xs text-indigo-800 leading-relaxed">{action.recommendation}</p>
                </div>

                {/* Meta */}
                {action.meta && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Object.entries(action.meta).map(([k, v]) => (
                      <span key={k} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        <span className="text-gray-400 capitalize">{k}:</span> <span className="font-semibold">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => approve(action.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors">
                    <Check className="w-3.5 h-3.5"/> Approve
                  </button>
                  <button onClick={() => reject(action.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors">
                    <X className="w-3.5 h-3.5"/> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Done state */}
        <AnimatePresence>
          {pending.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-16 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle className="w-8 h-8 text-green-600"/>
              </div>
              <p className="font-bold text-gray-800 text-sm">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">AI is continuously monitoring for new issues.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
