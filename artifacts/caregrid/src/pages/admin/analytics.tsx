import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MEDICINE_CONSUMPTION, FOOTFALL_WEEKLY, BED_OCCUPANCY, CENTERS } from '@/lib/data';
import { useStockRequestStore } from '../stock/stockRequestStore';
import { useInventoryStore } from '../stock/inventoryStore';

const DATE_RANGES = ['7D', '30D', '3M', '1Y'] as const;
type Range = typeof DATE_RANGES[number];

const DISEASES = ['Fever', 'Malaria', 'Dengue', 'Diarrhea', 'Hypertension'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP: Record<string, number[]> = {
  Fever: [28,31,24,35,42,38,22], Malaria: [8,12,9,14,11,9,6],
  Dengue: [4,7,6,9,14,12,3], Diarrhea: [15,18,14,20,22,19,10],
  Hypertension: [11,13,12,14,15,13,9],
};

function HeatCell({ value }: { value: number }) {
  const alpha = 0.1 + Math.min(value / 45, 1) * 0.85;
  const dark = alpha > 0.55;
  return (
    <div className="rounded flex items-center justify-center text-[9px] font-semibold"
      style={{ background: `rgba(99,102,241,${alpha})`, color: dark ? 'white' : '#4f46e5', width: 32, height: 26 }}>
      {value}
    </div>
  );
}

function statusBadge(risk: number) {
  if (risk >= 70) return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">Critical</span>;
  if (risk >= 40) return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-700">Warning</span>;
  return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">Healthy</span>;
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>('7D');
  const { requests } = useStockRequestStore();
  const { medicines } = useInventoryStore();

  const totalReqs    = requests.length;
  const approvedReqs = requests.filter(r => r.status !== 'pending_approval' && r.status !== 'rejected').length;
  const totalMeds    = medicines.length;
  const criticalMeds = medicines.filter(m => m.status === 'critical').length;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <h1 className="text-sm font-bold">Analytics & Intelligence</h1>
        <p className="text-indigo-200 text-[11px] mt-0.5">District-wide health metrics</p>
        <div className="flex items-center gap-1 mt-3 bg-white/10 rounded-xl p-1 self-start inline-flex">
          {DATE_RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r ? 'bg-white text-indigo-700' : 'text-indigo-200 hover:text-white'
              }`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-4">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Consultations', value: '3,964', sub: 'This week', up: true  },
            { label: 'Medicine Units Out',  value: '2,910', sub: 'This week', up: true  },
            { label: 'Avg Bed Occupancy',   value: '75.6%', sub: 'All centres', up: false },
            { label: 'Stock Requests',      value: `${totalReqs} (${approvedReqs} approved)`, sub: 'Via app', up: null },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide">{m.label}</p>
              <p className="text-lg font-black text-gray-900 mt-1 leading-none">{m.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {m.up === true && <TrendingUp className="w-3 h-3 text-green-500"/>}
                {m.up === false && <TrendingDown className="w-3 h-3 text-red-500"/>}
                <p className="text-[9px] text-gray-400">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Real inventory from store */}
        {medicines.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm">
            <p className="text-xs font-bold text-gray-800 mb-2">Live Inventory Status ({totalMeds} medicines)</p>
            <div className="flex items-center gap-3">
              {[
                { label: 'Critical', value: criticalMeds, color: 'text-red-600 bg-red-50' },
                { label: 'Low', value: medicines.filter(m=>m.status==='low').length, color: 'text-orange-600 bg-orange-50' },
                { label: 'OK', value: medicines.filter(m=>m.status==='ok').length, color: 'text-green-600 bg-green-50' },
                { label: 'Surplus', value: medicines.filter(m=>m.status==='surplus').length, color: 'text-blue-600 bg-blue-50' },
              ].map(s => (
                <div key={s.label} className={`flex-1 rounded-xl p-2 text-center ${s.color}`}>
                  <p className="text-base font-black">{s.value}</p>
                  <p className="text-[9px] font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footfall Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-800">Patient Footfall — This Week</p>
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3"/> +6.2%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={FOOTFALL_WEEKLY} margin={{top:4,right:8,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="day" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:'1px solid #e5e7eb'}}/>
              <Line type="monotone" dataKey="patients" stroke="#6366f1" strokeWidth={2.5}
                dot={{r:4,fill:'#6366f1',strokeWidth:0}} activeDot={{r:6}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Medicine consumption */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm">
          <p className="text-xs font-bold text-gray-800 mb-3">Medicine Usage vs Reorder</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MEDICINE_CONSUMPTION} layout="vertical" margin={{top:0,right:8,left:50,bottom:0}}>
              <XAxis type="number" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:'#6b7280'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:'1px solid #e5e7eb'}}/>
              <Bar dataKey="used" name="Used" fill="#6366f1" radius={[0,4,4,0]}/>
              <Bar dataKey="reordered" name="Reordered" fill="#22c55e" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PHC performance table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <p className="text-xs font-bold text-gray-800 px-4 py-3 border-b border-gray-50">PHC Performance</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[480px]">
              <thead>
                <tr className="bg-gray-50">
                  {['Centre','Patients','Doctors','Beds','Stock','Score','Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[9px] font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...CENTERS].sort((a,b)=>b.riskScore-a.riskScore).map(c => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-semibold text-gray-800 max-w-[100px] truncate">{c.name}</td>
                    <td className="px-3 py-2 text-gray-600">{c.footfallToday}</td>
                    <td className="px-3 py-2">
                      <span className={c.doctors/c.doctorsTotal < 0.5 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                        {Math.round(c.doctors/c.doctorsTotal*100)}%
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={c.beds === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>{c.beds}/{c.bedsTotal}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={c.medicines < 30 ? 'text-red-600 font-semibold' : 'text-gray-600'}>{c.medicines}%</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <div className="w-10 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${c.riskScore>=70?'bg-red-500':c.riskScore>=40?'bg-orange-400':'bg-green-500'}`}
                            style={{width:`${c.riskScore}%`}}/>
                        </div>
                        <span className="text-[9px] font-bold text-gray-600">{c.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{statusBadge(c.riskScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disease Heatmap */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm">
          <p className="text-xs font-bold text-gray-800 mb-3">Disease Surveillance — 7-Day</p>
          <div className="overflow-x-auto">
            <table className="border-separate" style={{borderSpacing:3}}>
              <thead>
                <tr>
                  <th className="text-[9px] text-gray-400 text-right pr-2 pb-1 w-20">Disease</th>
                  {DAYS.map(d => <th key={d} className="text-[9px] text-gray-400 text-center pb-1">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {DISEASES.map(d => (
                  <tr key={d}>
                    <td className="text-[9px] text-gray-600 font-medium text-right pr-2 whitespace-nowrap">{d}</td>
                    {HEATMAP[d].map((v,i) => <td key={i} className="p-0"><HeatCell value={v}/></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[9px] text-gray-400">Low</span>
            {[0.1,0.3,0.5,0.7,0.9].map(v => (
              <div key={v} className="w-4 h-3 rounded" style={{background:`rgba(99,102,241,${v})`}}/>
            ))}
            <span className="text-[9px] text-gray-400">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
