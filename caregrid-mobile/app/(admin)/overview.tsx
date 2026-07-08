import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CENTERS, KPIS, AI_ACTIONS } from '@/lib/data';

const W = Dimensions.get('window').width;

const CROWD_COLOR: Record<string, string> = {
  critical: COLORS.red, warning: COLORS.orange, healthy: COLORS.green,
};

const KPI_LIST = [
  { label:'Patients Today',      value: KPIS.patientsToday, icon:'people',       color:'#3b82f6' },
  { label:'Avg Wait (min)',       value: KPIS.avgWaitMins,   icon:'time',          color:COLORS.orange },
  { label:'Doctor Attendance',   value: `${KPIS.doctorAttendance}%`, icon:'medical', color:COLORS.green },
  { label:'Stock-Outs',          value: KPIS.stockOuts,     icon:'cube',          color:COLORS.red },
  { label:'Pending AI Actions',  value: KPIS.pendingAiActions, icon:'flash',      color:'#7c3aed' },
  { label:'Critical Centres',    value: KPIS.criticalCenters, icon:'warning',     color:COLORS.red },
];

export default function AdminOverview() {
  const [selectedCenter, setSelectedCenter] = useState<typeof CENTERS[0] | null>(null);

  return (
    <View style={{ flex:1, backgroundColor:COLORS.bg }}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={{ flex:1 }}>
          <Text style={styles.headerTitle}>District Command</Text>
          <Text style={styles.headerSub}>Erode District · Tamil Nadu · NHM</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:20 }}>
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          {KPI_LIST.map(k => (
            <View key={k.label} style={[styles.kpiCard, { borderTopColor:k.color, borderTopWidth:3 }]}>
              <Ionicons name={k.icon as any} size={18} color={k.color} style={{ marginBottom:6 }} />
              <Text style={[styles.kpiValue, { color:k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* District Map (SVG-style visual) */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>District Health Map</Text>
            <View style={styles.liveBadge2}><View style={styles.liveDot} /><Text style={styles.liveText}>Live</Text></View>
          </View>
          <View style={styles.mapArea}>
            {/* Road connections visual */}
            <View style={styles.mapBg}>
              {CENTERS.map((c, i) => {
                // Simple spread layout
                const positions = [
                  { top:'40%', left:'20%' },
                  { top:'20%', left:'55%' },
                  { top:'55%', left:'70%' },
                  { top:'65%', left:'42%' },
                  { top:'75%', left:'72%' },
                ];
                const pos = positions[i] ?? { top:'50%', left:'50%' };
                const color = CROWD_COLOR[c.status];
                const isSelected = selectedCenter?.id === c.id;

                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCenter(isSelected ? null : c)}
                    style={[styles.pin, { top:pos.top as any, left:pos.left as any }]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.pinOuter, { borderColor:color+'60' }, c.status==='critical' && styles.pinPulse]}>
                      <View style={[styles.pinInner, { backgroundColor:color }]} />
                    </View>
                    <Text style={[styles.pinLabel, { color }]}>{c.name.replace('PHC-','').replace('CHC-','')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tooltip */}
            {selectedCenter && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipName}>{selectedCenter.name}</Text>
                <Text style={styles.tooltipRow}>⏱ {selectedCenter.waitMins} min · 🛏 {selectedCenter.beds}/{selectedCenter.bedsTotal} beds</Text>
                <Text style={styles.tooltipRow}>👨‍⚕️ {selectedCenter.doctors}/{selectedCenter.doctorsTotal} doctors · {selectedCenter.crowd} crowd</Text>
              </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
              {[['Critical',COLORS.red],['Warning',COLORS.orange],['Healthy',COLORS.green]].map(([l,c]) => (
                <View key={l} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                  <View style={{ width:7, height:7, borderRadius:4, backgroundColor:c as string }} />
                  <Text style={{ color:'#94a3b8', fontSize:9 }}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Centre Status List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centre Status</Text>
          {CENTERS.map(c => (
            <View key={c.id} style={styles.centerRow}>
              <View style={[styles.statusDot, { backgroundColor:CROWD_COLOR[c.status] }]} />
              <View style={{ flex:1 }}>
                <Text style={styles.centerName}>{c.name} <Text style={styles.centerType}>{c.type}</Text></Text>
                <Text style={styles.centerMeta}>Wait: {c.waitMins}m · Beds: {c.beds}/{c.bedsTotal} · Docs: {c.doctors}/{c.doctorsTotal}</Text>
              </View>
              <View style={[styles.riskBadge, {
                backgroundColor: c.riskScore>=70?COLORS.red+'15':c.riskScore>=40?COLORS.orange+'15':COLORS.green+'15',
              }]}>
                <Text style={[styles.riskText, { color:c.riskScore>=70?COLORS.red:c.riskScore>=40?COLORS.orange:COLORS.green }]}>
                  {c.riskScore}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Active Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Active AI Alerts</Text>
          {AI_ACTIONS.slice(0,3).map(a => (
            <View key={a.id} style={[styles.alertCard, { borderLeftColor: a.severity==='critical' ? COLORS.red : COLORS.orange }]}>
              <Text style={[styles.alertTitle, { color: a.severity==='critical' ? COLORS.red : COLORS.orange }]}>{a.title}</Text>
              <Text style={styles.alertPHC}>{a.phcName} · {a.createdAt}</Text>
              <Text style={styles.alertMsg} numberOfLines={2}>{a.message}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop:52, paddingBottom:16, paddingHorizontal:16, flexDirection:'row', alignItems:'center' },
  headerTitle: { color:'#fff', fontSize:18, fontWeight:'900' },
  headerSub: { color:'rgba(255,255,255,.6)', fontSize:11, marginTop:2 },
  liveBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(34,197,94,.15)', borderRadius:100, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:'rgba(34,197,94,.3)' },
  liveBadge2: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(34,197,94,.12)', borderRadius:100, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:'rgba(34,197,94,.25)' },
  liveDot: { width:6, height:6, borderRadius:3, backgroundColor:'#22c55e' },
  liveText: { color:'#22c55e', fontSize:10, fontWeight:'700' },
  kpiGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, padding:14 },
  kpiCard: { width:(W-42)/3, backgroundColor:'#fff', borderRadius:14, padding:12, borderWidth:1, borderColor:COLORS.border },
  kpiValue: { fontSize:22, fontWeight:'900' },
  kpiLabel: { fontSize:9, color:COLORS.textSub, marginTop:2, lineHeight:14 },
  mapCard: { marginHorizontal:14, backgroundColor:'#fff', borderRadius:16, borderWidth:1, borderColor:COLORS.border, overflow:'hidden', marginBottom:14 },
  mapHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12, borderBottomWidth:1, borderBottomColor:COLORS.border },
  mapTitle: { fontSize:13, fontWeight:'800', color:COLORS.text },
  mapArea: { height:220, position:'relative' },
  mapBg: { flex:1, backgroundColor:'#1a2744' },
  pin: { position:'absolute', alignItems:'center' },
  pinOuter: { width:26, height:26, borderRadius:13, borderWidth:2, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,.2)' },
  pinInner: { width:10, height:10, borderRadius:5 },
  pinPulse: { borderColor:'rgba(220,38,38,.6)' },
  pinLabel: { fontSize:8, fontWeight:'700', marginTop:2, textShadowColor:'rgba(0,0,0,.8)', textShadowOffset:{width:0,height:1}, textShadowRadius:2 },
  tooltip: { position:'absolute', top:8, left:8, backgroundColor:'rgba(255,255,255,.95)', borderRadius:10, padding:8, maxWidth:200 },
  tooltipName: { fontSize:11, fontWeight:'800', color:COLORS.text },
  tooltipRow: { fontSize:10, color:COLORS.textSub, marginTop:3 },
  legend: { position:'absolute', bottom:8, left:8, flexDirection:'row', gap:10, backgroundColor:'rgba(13,21,38,.8)', borderRadius:8, padding:6 },
  section: { marginHorizontal:14, backgroundColor:'#fff', borderRadius:16, padding:14, borderWidth:1, borderColor:COLORS.border, marginBottom:14 },
  sectionTitle: { fontSize:11, fontWeight:'800', color:COLORS.textSub, textTransform:'uppercase', letterSpacing:.8, marginBottom:12 },
  centerRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:10, borderTopWidth:1, borderTopColor:'#f8fafc' },
  statusDot: { width:10, height:10, borderRadius:5 },
  centerName: { fontSize:12, fontWeight:'700', color:COLORS.text },
  centerType: { fontSize:10, color:COLORS.textSub, fontWeight:'400' },
  centerMeta: { fontSize:10, color:COLORS.textSub, marginTop:2 },
  riskBadge: { borderRadius:100, paddingHorizontal:8, paddingVertical:4, minWidth:32, alignItems:'center' },
  riskText: { fontSize:11, fontWeight:'900' },
  alertCard: { borderLeftWidth:3, paddingLeft:10, paddingVertical:6, marginBottom:10 },
  alertTitle: { fontSize:12, fontWeight:'800' },
  alertPHC: { fontSize:10, color:COLORS.textSub, marginTop:2 },
  alertMsg: { fontSize:11, color:COLORS.text, marginTop:3, lineHeight:16 },
});
