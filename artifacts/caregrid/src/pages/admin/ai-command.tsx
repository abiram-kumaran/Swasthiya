import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Zap, AlertTriangle, Info, Package, User, Activity,
  Users, CheckCircle, X, Check, RefreshCw, ArrowRight,
} from 'lucide-react';
import { AI_ACTIONS, CENTERS, type AIAction } from '@/lib/data';

/* ── Icon helpers ────────────────────────────────────────── */
function SeverityIcon({ severity }: { severity: AIAction['severity'] }) {
  if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  return <Info className="w-4 h-4 text-blue-400" />;
}

function TypeIcon({ type }: { type: AIAction['type'] }) {
  const cls = 'w-3.5 h-3.5';
  if (type === 'medicine') return <Package className={cls} />;
  if (type === 'doctor') return <User className={cls} />;
  if (type === 'disease') return <Activity className={cls} />;
  if (type === 'footfall') return <Users className={cls} />;
  return <Zap className={cls} />;
}

const BORDER_COLOR: Record<AIAction['severity'], string> = {
  critical: 'border-t-red-500',
  warning: 'border-t-orange-400',
  info: 'border-t-blue-400',
};

const SEVERITY_BADGE: Record<AIAction['severity'], string> = {
  critical: 'bg-red-100 text-red-700',
  warning: 'bg-orange-100 text-orange-700',
  info: 'bg-blue-100 text-blue-700',
};

/* ── Resource Map SVG ─────────────────────────────────────── */
const MAP_POSITIONS: Record<string, { x: number; y: number }> = {
  'PHC-Alpha':   { x: 80,  y: 180 },
  'PHC-Beta':    { x: 220, y: 80  },
  'PHC-North':   { x: 300, y: 200 },
  'CHC-Central': { x: 180, y: 160 },
  'PHC-East':    { x: 320, y: 300 },
};

function ResourceMap({ approvedIds }: { approvedIds: Set<string> }) {
  const approvedActions = AI_ACTIONS.filter(a => approvedIds.has(a.id));

  return (
    <div className="bg-[#0f1929] rounded-xl border border-[#1e3050] p-4 mt-6">
      <h3 className="font-bold text-xs text-white mb-3">Resource Redistribution Map</h3>
      {approvedActions.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">Approve actions to see redistribution routes.</p>
      ) : (
        <svg width="100%" height={320} viewBox="0 0 420 340" className="overflow-visible">
          {/* Center nodes */}
          {Object.entries(MAP_POSITIONS).map(([name, pos]) => (
            <g key={name}>
              <circle cx={pos.x} cy={pos.y} r={22} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={1.5} />
              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={8} fontWeight={600}>
                {name.replace('PHC-', '').replace('CHC-', '')}
              </text>
              <text x={pos.x} y={pos.y + 32} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                {name}
              </text>
            </g>
          ))}

          {/* Arrows for approved actions */}
          {approvedActions.map((action, i) => {
            const fromMeta = action.meta?.fromCenter as string | undefined;
            const from = fromMeta ? MAP_POSITIONS[fromMeta] : null;
            const to = MAP_POSITIONS[action.phcName];
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / len; const ny = dy / len;
            const x1 = from.x + nx * 24; const y1 = from.y + ny * 24;
            const x2 = to.x - nx * 24;   const y2 = to.y - ny * 24;

            return (
              <g key={action.id}>
                <defs>
                  <marker id={`arrow-${i}`} markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#22c55e" />
                  </marker>
                </defs>
                <motion.line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#22c55e" strokeWidth={2.5} strokeDasharray="5 3"
                  markerEnd={`url(#arrow-${i})`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  textAnchor="middle"
                  fill="#22c55e"
                  fontSize={8}
                  fontWeight={600}
                >
                  {action.meta?.medicine ? String(action.meta.medicine).split(' ')[0] : action.type}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function AdminAICommand() {
  const [processedIds, setProcessedIds] = useState<Map<string, 'approved' | 'rejected'>>(new Map());

  function handleApprove(id: string) {
    setProcessedIds(prev => new Map(prev).set(id, 'approved'));
    toast.success('Action approved. Dispatch notified.', {
      description: 'Field team has been alerted for immediate action.',
    });
  }

  function handleReject(id: string) {
    setProcessedIds(prev => new Map(prev).set(id, 'rejected'));
    toast.error('Action rejected.', {
      description: 'Action has been dismissed.',
    });
  }

  const pendingActions = AI_ACTIONS.filter(a => !processedIds.has(a.id));
  const approvedIds = new Set(
    [...processedIds.entries()].filter(([, v]) => v === 'approved').map(([k]) => k)
  );
  const allDone = pendingActions.length === 0;

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">🧠 AI Command Center</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200">
                Gemini 1.5 Pro
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                Auto-refreshing every 60s
              </span>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors">
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Intro Banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
        <p className="text-xs font-medium leading-relaxed">
          AI is continuously monitoring{' '}
          <strong>{CENTERS.length} health centres</strong>,{' '}
          <strong>8 medicines</strong>,{' '}
          <strong>4 doctors</strong> and{' '}
          <strong>5 dispatch routes</strong>.{' '}
          {pendingActions.length > 0
            ? <><strong>{pendingActions.length} actions</strong> require your approval.</>
            : <strong>All actions processed. System is healthy.</strong>
          }
        </p>
      </div>

      {/* Action Cards */}
      <AnimatePresence mode="popLayout">
        {pendingActions.map(action => (
          <motion.div
            key={action.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: processedIds.get(action.id) === 'approved' ? -80 : 80, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden border-t-4 ${BORDER_COLOR[action.severity]}`}
          >
            {/* Card Header */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <SeverityIcon severity={action.severity} />
                  <TypeIcon type={action.type} />
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded border border-blue-100">
                    {action.phcName}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize ${SEVERITY_BADGE[action.severity]}`}>
                    {action.severity}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{action.createdAt}</span>
              </div>

              <h3 className="font-semibold text-sm text-gray-900 mb-1">{action.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{action.message}</p>

              {/* AI Recommendation */}
              <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-3">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-1">🤖 AI Recommendation</p>
                <p className="text-xs text-blue-800 leading-relaxed">{action.recommendation}</p>
              </div>

              {/* Meta chips */}
              {action.meta && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Object.entries(action.meta).map(([key, val]) => (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                      <span className="text-gray-400 capitalize">{key}:</span>
                      <span className="font-semibold">{String(val)}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleApprove(action.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(action.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  ✗ Reject
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-sm font-bold text-gray-900">All caught up!</h2>
            <p className="text-xs text-gray-500 mt-1">AI is monitoring for new issues.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resource Map */}
      {approvedIds.size > 0 && <ResourceMap approvedIds={approvedIds} />}
    </div>
  );
}
