import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  MEDICINE_CONSUMPTION, FOOTFALL_WEEKLY, BED_OCCUPANCY, CENTERS,
} from '@/lib/data';
import { TrendingUp } from 'lucide-react';

const DATE_RANGES = ['7D', '30D', '3M', '1Y'] as const;
type DateRange = typeof DATE_RANGES[number];

const DISEASES = ['Fever', 'Malaria', 'Dengue', 'Diarrhea', 'Hypertension'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* Fake disease heatmap data: higher = more cases */
const DISEASE_HEATMAP: Record<string, number[]> = {
  Fever:        [28, 31, 24, 35, 42, 38, 22],
  Malaria:      [8,  12, 9,  14, 11, 9,  6 ],
  Dengue:       [4,  7,  6,  9,  14, 12, 3 ],
  Diarrhea:     [15, 18, 14, 20, 22, 19, 10],
  Hypertension: [11, 13, 12, 14, 15, 13, 9 ],
};

const MAX_HEAT = 45;

function HeatCell({ value }: { value: number }) {
  const intensity = Math.min(value / MAX_HEAT, 1);
  const alpha = 0.1 + intensity * 0.85;
  return (
    <div
      className="rounded flex items-center justify-center text-[9px] font-semibold"
      style={{
        backgroundColor: `rgba(59, 130, 246, ${alpha})`,
        color: intensity > 0.55 ? 'white' : '#1d4ed8',
        width: 34, height: 28,
      }}
    >
      {value}
    </div>
  );
}

function statusBadge(riskScore: number) {
  if (riskScore >= 70) return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">Critical</span>;
  if (riskScore >= 40) return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-700">Warning</span>;
  return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">Healthy</span>;
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<DateRange>('7D');

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Analytics &amp; Insights</h1>
          <p className="text-xs text-gray-500 mt-0.5">District-wide health metrics and trends</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {DATE_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                range === r ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4-col metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Consultations',   value: '3,964',  sub: 'This week' },
          { label: 'Medicine Units Dispensed', value: '2,910', sub: 'This week' },
          { label: 'Avg Bed Occupancy',     value: '75.6%',  sub: 'Across all centers' },
          { label: 'Top Disease',           value: 'Fever',  sub: '42 cases today' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
          >
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{m.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{m.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Section 1 — Patient Trends */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-xs text-gray-800">Patient Footfall Trend</h2>
          <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" /> Week over Week +6.2%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={FOOTFALL_WEEKLY} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Line
              type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2.5}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Section 2 — Medicine Consumption */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h2 className="font-bold text-xs text-gray-800 mb-3">Top 5 Medicine Usage vs Reorder</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={MEDICINE_CONSUMPTION}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 40, bottom: 0 }}
          >
            <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="used"      name="Used"      fill="#3b82f6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="reordered" name="Reordered" fill="#22c55e" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section 3 — PHC Performance Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <h2 className="font-bold text-xs text-gray-800">PHC Performance Overview</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              {['Rank', 'Center', 'Footfall', 'Doctor %', 'Bed %', 'Stock %', 'Risk Score', 'Status'].map(col => (
                <th key={col} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...CENTERS].sort((a, b) => b.riskScore - a.riskScore).map((center, idx) => (
              <tr key={center.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-3 py-2 font-bold text-gray-400">#{idx + 1}</td>
                <td className="px-3 py-2 font-semibold text-gray-800">{center.name}</td>
                <td className="px-3 py-2 text-gray-700">{center.footfallToday}</td>
                <td className="px-3 py-2">
                  <span className={center.doctors / center.doctorsTotal < 0.5 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {Math.round((center.doctors / center.doctorsTotal) * 100)}%
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={center.beds / center.bedsTotal > 0.9 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {center.bedsTotal > 0 ? Math.round(((center.bedsTotal - center.beds) / center.bedsTotal) * 100) : 100}%
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={center.medicines < 30 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {center.medicines}%
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${center.riskScore >= 70 ? 'bg-red-500' : center.riskScore >= 40 ? 'bg-orange-400' : 'bg-green-500'}`}
                        style={{ width: `${center.riskScore}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-700">{center.riskScore}</span>
                  </div>
                </td>
                <td className="px-3 py-2">{statusBadge(center.riskScore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 4 — Disease Surveillance Heatmap */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h2 className="font-bold text-xs text-gray-800 mb-3">Disease Surveillance — 7-Day Heatmap</h2>
        <div className="overflow-x-auto">
          <table className="border-separate" style={{ borderSpacing: 4 }}>
            <thead>
              <tr>
                <th className="text-[10px] text-gray-400 font-medium text-right pr-2 pb-1 w-24">Disease</th>
                {DAYS_SHORT.map(d => (
                  <th key={d} className="text-[10px] text-gray-400 font-medium text-center pb-1">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISEASES.map(disease => (
                <tr key={disease}>
                  <td className="text-[10px] text-gray-700 font-medium text-right pr-2 whitespace-nowrap">{disease}</td>
                  {DISEASE_HEATMAP[disease].map((val, di) => (
                    <td key={di} className="p-0">
                      <HeatCell value={val} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-gray-400">Low</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
            <div key={v} className="w-5 h-3 rounded" style={{ background: `rgba(59,130,246,${v})` }} />
          ))}
          <span className="text-[10px] text-gray-400">High</span>
        </div>
      </div>
    </div>
  );
}
