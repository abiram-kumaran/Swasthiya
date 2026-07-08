import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CENTERS, FOOTFALL_WEEKLY, MEDICINES } from '@/lib/data';

const W = Dimensions.get('window').width - 52;
const MAX_V = Math.max(...FOOTFALL_WEEKLY.map(d => d.v));

export default function AdminAnalytics() {
  const [range, setRange] = useState('7D');

  return (
    <ScrollView style={{ flex:1, backgroundColor:COLORS.bg }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:14, paddingTop:60 }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <Text style={{ fontSize:17, fontWeight:'900', color:COLORS.text }}>Analytics &amp; Insights</Text>
        <View style={{ flexDirection:'row', backgroundColor:'#e2e8f0', borderRadius:10, padding:3, gap:2 }}>
          {['7D','30D','3M'].map(r => (
            <TouchableOpacity key={r} onPress={() => setRange(r)} style={[{ paddingHorizontal:10, paddingVertical:5, borderRadius:8 }, range===r && { backgroundColor:'#fff' }]}>
              <Text style={[{ fontSize:11, color:COLORS.textSub, fontWeight:'600' }, range===r && { color:COLORS.primary, fontWeight:'700' }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* KPI Metrics */}
      <View style={{ flexDirection:'row', gap:8, marginBottom:16 }}>
        {[
          { label:'Consultations', value:'3,964', color:COLORS.primary },
          { label:'Units Dispensed', value:'2,910', color:COLORS.green },
          { label:'Avg Bed Occ.', value:'75.6%', color:COLORS.orange },
          { label:'Top Disease', value:'Fever', color:'#7c3aed' },
        ].map(m => (
          <View key={m.label} style={[styles.metricCard, { borderTopColor:m.color, borderTopWidth:3 }]}>
            <Text style={[styles.metricValue, { color:m.color }]}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Footfall Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Patient Footfall — This Week</Text>
        <View style={styles.barChart}>
          {FOOTFALL_WEEKLY.map(d => {
            const h = (d.v / MAX_V) * 120;
            return (
              <View key={d.day} style={styles.barCol}>
                <Text style={styles.barValue}>{d.v}</Text>
                <View style={[styles.bar, { height: h, backgroundColor: COLORS.primary }]} />
                <Text style={styles.barLabel}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* PHC Performance Table */}
      <View style={styles.tableCard}>
        <Text style={styles.chartTitle}>PHC Performance Rankings</Text>
        <View style={styles.tableHeader}>
          {['#','Centre','Wait','Beds%','Risk'].map(h => (
            <Text key={h} style={[styles.thText, h==='Centre' && { flex:2 }]}>{h}</Text>
          ))}
        </View>
        {[...CENTERS].sort((a,b) => b.riskScore - a.riskScore).map((c,i) => {
          const bedPct = Math.round(((c.bedsTotal - c.beds) / c.bedsTotal) * 100);
          return (
            <View key={c.id} style={styles.tableRow}>
              <Text style={styles.tdRank}>{i+1}</Text>
              <View style={{ flex:2 }}>
                <Text style={styles.tdName}>{c.name}</Text>
                <Text style={styles.tdType}>{c.type}</Text>
              </View>
              <Text style={styles.td}>{c.waitMins}m</Text>
              <Text style={[styles.td, { color: bedPct>=90?COLORS.red:bedPct>=70?COLORS.orange:COLORS.green }]}>{bedPct}%</Text>
              <View style={[styles.riskBadge, { backgroundColor: c.riskScore>=70?COLORS.red+'15':c.riskScore>=40?COLORS.orange+'15':COLORS.green+'15' }]}>
                <Text style={[styles.riskText, { color:c.riskScore>=70?COLORS.red:c.riskScore>=40?COLORS.orange:COLORS.green }]}>{c.riskScore}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Medicine Usage */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Medicine Stock Status</Text>
        {MEDICINES.map(m => {
          const pct = Math.min((m.quantity / 500) * 100, 100);
          const barColor = m.status==='critical'?COLORS.red:m.status==='low'?COLORS.orange:m.status==='surplus'?'#3b82f6':COLORS.green;
          return (
            <View key={m.id} style={{ marginBottom:10 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                <Text style={{ fontSize:11, fontWeight:'700', color:COLORS.text }}>{m.name}</Text>
                <Text style={[{ fontSize:10, fontWeight:'700' }, { color:barColor }]}>{m.status.toUpperCase()}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width:`${pct}%` as any, backgroundColor:barColor }]} />
              </View>
              <Text style={{ fontSize:9, color:COLORS.textSub, marginTop:2 }}>{m.quantity} {m.unit} · {m.daysLeft}d left</Text>
            </View>
          );
        })}
      </View>

      <View style={{ height:20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  metricCard: { flex:1, backgroundColor:'#fff', borderRadius:12, padding:10, borderWidth:1, borderColor:COLORS.border },
  metricValue: { fontSize:16, fontWeight:'900' },
  metricLabel: { fontSize:9, color:COLORS.textSub, marginTop:2, lineHeight:13 },
  chartCard: { backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:14, borderWidth:1, borderColor:COLORS.border },
  chartTitle: { fontSize:12, fontWeight:'800', color:COLORS.text, marginBottom:14 },
  barChart: { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', height:160 },
  barCol: { alignItems:'center', flex:1 },
  bar: { width:28, borderRadius:6, marginBottom:4 },
  barValue: { fontSize:8, color:COLORS.textSub, marginBottom:3 },
  barLabel: { fontSize:9, color:COLORS.textSub },
  tableCard: { backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:14, borderWidth:1, borderColor:COLORS.border },
  tableHeader: { flexDirection:'row', alignItems:'center', paddingBottom:8, borderBottomWidth:1, borderBottomColor:COLORS.border, marginBottom:4 },
  thText: { flex:1, fontSize:9, fontWeight:'700', color:COLORS.textSub, textTransform:'uppercase' },
  tableRow: { flexDirection:'row', alignItems:'center', paddingVertical:8, borderTopWidth:1, borderTopColor:'#f8fafc' },
  tdRank: { flex:1, fontSize:11, fontWeight:'800', color:COLORS.textSub },
  tdName: { fontSize:11, fontWeight:'700', color:COLORS.text },
  tdType: { fontSize:9, color:COLORS.textSub },
  td: { flex:1, fontSize:11, color:COLORS.text },
  riskBadge: { flex:1, borderRadius:100, paddingHorizontal:6, paddingVertical:3, alignItems:'center' },
  riskText: { fontSize:11, fontWeight:'900' },
  progressBg: { height:6, backgroundColor:COLORS.border, borderRadius:3, overflow:'hidden' },
  progressFill: { height:6, borderRadius:3 },
});
