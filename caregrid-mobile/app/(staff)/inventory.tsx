import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MEDICINES } from '@/lib/data';

type Filter = 'all'|'critical'|'low'|'ok'|'surplus';

const STATUS_COLOR: Record<string, { bar:string; badge:string; bg:string }> = {
  critical: { bar:COLORS.red,    badge:'#fef2f2', bg:'#fef2f2' },
  low:      { bar:COLORS.orange, badge:'#fff7ed', bg:'#fff7ed' },
  ok:       { bar:COLORS.green,  badge:'#f0fdf4', bg:'#fff'    },
  surplus:  { bar:'#3b82f6',     badge:'#eff6ff', bg:'#fff'    },
};

function daysColor(days: number) {
  if (days <= 0) return COLORS.red;
  if (days <= 7) return COLORS.red;
  if (days <= 14) return COLORS.orange;
  return COLORS.green;
}

export default function Inventory() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const all = MEDICINES;
  const filtered = all.filter(m => {
    const ok = filter === 'all' || m.status === filter;
    const s  = m.name.toLowerCase().includes(search.toLowerCase());
    return ok && s;
  });

  const counts: Record<string, number> = {
    all:      all.length,
    critical: all.filter(m=>m.status==='critical').length,
    low:      all.filter(m=>m.status==='low').length,
    ok:       all.filter(m=>m.status==='ok').length,
    surplus:  all.filter(m=>m.status==='surplus').length,
  };

  const criticalMed = all.find(m => m.status === 'critical');

  return (
    <View style={{ flex:1, backgroundColor:COLORS.bg }}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Medicine Inventory</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={14} color="rgba(255,255,255,.5)" />
            <TextInput style={styles.searchInput} placeholder="Search medicines…" placeholderTextColor="rgba(255,255,255,.4)" value={search} onChangeText={setSearch} />
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Scan','Barcode scanner opened (simulated). Detected: Paracetamol 500mg × 100')} style={styles.scanBtn}>
            <Ionicons name="scan" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Add Stock','Opening form (simulated)')} style={styles.scanBtn}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding:14 }}>
          {/* AI Forecast */}
          {criticalMed && (
            <LinearGradient colors={['#7c3aed','#6d28d9']} style={styles.aiBanner}>
              <Ionicons name="flash" size={16} color="#fff" />
              <View style={{ flex:1 }}>
                <Text style={styles.aiBannerTitle}>🤖 AI Forecast</Text>
                <Text style={styles.aiBannerText}>
                  <Text style={{ fontWeight:'800' }}>{criticalMed.name}</Text> stocks out in{' '}
                  <Text style={{ fontWeight:'800' }}>{criticalMed.daysLeft === 0 ? '0 days (today!)' : `${criticalMed.daysLeft} days`}</Text>.
                  Recommended order: <Text style={{ fontWeight:'800' }}>{criticalMed.aiRecommendedOrder} units</Text>.
                </Text>
                <TouchableOpacity onPress={() => Alert.alert('Transfer Requested', 'Request forwarded to CHC-Central.')} style={styles.transferBtn}>
                  <Text style={styles.transferText}>Request Transfer →</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )}

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
            {(['all','critical','low','ok','surplus'] as Filter[]).map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.tab, filter===f && styles.tabActive]}>
                <Text style={[styles.tabText, filter===f && styles.tabTextActive]}>{f.charAt(0).toUpperCase()+f.slice(1)} {counts[f]>0 ? `(${counts[f]})` : ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Medicine Cards */}
          {filtered.map(m => {
            const sc = STATUS_COLOR[m.status];
            const pct = Math.min((m.quantity / m.reorderLevel) * 100, 100);
            return (
              <View key={m.id} style={[styles.medCard, { backgroundColor:sc.bg }]}>
                <View style={styles.medTop}>
                  <View style={{ flex:1 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <Text style={styles.medName}>{m.name}</Text>
                      <View style={[styles.catBadge, { backgroundColor:COLORS.textLight+'20' }]}>
                        <Text style={styles.catText}>{m.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.medQty}>{m.quantity} <Text style={styles.medUnit}>{m.unit}</Text></Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor:sc.badge }]}>
                    <Text style={[styles.statusText, { color:sc.bar }]}>{m.status.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Bar */}
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width:`${pct}%` as any, backgroundColor:sc.bar }]} />
                </View>

                {/* Meta */}
                <View style={styles.metaRow}>
                  <Text style={[styles.metaItem, { color:daysColor(m.daysLeft) }]}>
                    {m.daysLeft === 0 ? '⚠️ 0 days left' : `${m.daysLeft}d left`}
                  </Text>
                  <Text style={styles.metaItem}>{m.dailyBurnRate}/day</Text>
                  <Text style={[styles.metaItem, { color: new Date(m.expiryDate).getTime() - Date.now() < 30*86400000 ? COLORS.red : COLORS.textSub }]}>
                    Exp: {new Date(m.expiryDate).toLocaleDateString('en-IN', { month:'short', year:'numeric' })}
                  </Text>
                </View>

                {m.predictedStockout && (
                  <View style={styles.aiStockout}>
                    <Ionicons name="warning" size={11} color={COLORS.red} />
                    <Text style={styles.aiStockoutText}>AI: stockout on {m.predictedStockout}</Text>
                  </View>
                )}

                <View style={styles.medActions}>
                  <TouchableOpacity onPress={() => Alert.alert('Issue','Dispensing record saved.')} style={[styles.medBtn, styles.medBtnGhost]}>
                    <Text style={styles.medBtnGhostText}>Issue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Alert.alert('Requested', `Transfer request sent for ${m.name}.`)} style={[styles.medBtn, { backgroundColor:COLORS.primary }]}>
                    <Text style={styles.medBtnText}>Request More</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height:20 }} />
        </View>
      </ScrollView>

      {/* FAB Scan Button */}
      <TouchableOpacity onPress={() => Alert.alert('Scan','Camera opened. Detected: Paracetamol 500mg × 100 ✅')} style={styles.fab}>
        <Ionicons name="camera" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop:52, paddingBottom:16, paddingHorizontal:16 },
  headerTitle: { color:'#fff', fontSize:17, fontWeight:'800', marginBottom:10 },
  searchRow: { flexDirection:'row', gap:8 },
  searchBox: { flex:1, flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,.15)', borderRadius:12, paddingHorizontal:12, paddingVertical:8, gap:8, borderWidth:1, borderColor:'rgba(255,255,255,.2)' },
  searchInput: { flex:1, color:'#fff', fontSize:13 },
  scanBtn: { backgroundColor:'rgba(255,255,255,.15)', borderRadius:12, padding:10, borderWidth:1, borderColor:'rgba(255,255,255,.2)' },
  aiBanner: { borderRadius:16, padding:14, flexDirection:'row', gap:10, marginBottom:12 },
  aiBannerTitle: { color:'#fff', fontSize:11, fontWeight:'800', marginBottom:4 },
  aiBannerText: { color:'rgba(255,255,255,.85)', fontSize:12, lineHeight:18 },
  transferBtn: { backgroundColor:'rgba(255,255,255,.2)', borderRadius:10, paddingHorizontal:12, paddingVertical:6, marginTop:8, alignSelf:'flex-start' },
  transferText: { color:'#fff', fontSize:11, fontWeight:'700' },
  tabsRow: { marginBottom:12, maxHeight:38 },
  tab: { paddingHorizontal:12, paddingVertical:7, borderRadius:100, backgroundColor:'#fff', marginRight:6, borderWidth:1, borderColor:COLORS.border },
  tabActive: { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  tabText: { fontSize:11, color:COLORS.textSub, fontWeight:'600' },
  tabTextActive: { color:'#fff' },
  medCard: { borderRadius:16, padding:14, marginBottom:10, borderWidth:1, borderColor:COLORS.border },
  medTop: { flexDirection:'row', alignItems:'flex-start', marginBottom:10 },
  medName: { fontSize:14, fontWeight:'800', color:COLORS.text },
  catBadge: { borderRadius:100, paddingHorizontal:8, paddingVertical:2 },
  catText: { fontSize:9, color:COLORS.textSub, fontWeight:'600' },
  medQty: { fontSize:24, fontWeight:'900', color:COLORS.text, marginTop:4 },
  medUnit: { fontSize:12, fontWeight:'400', color:COLORS.textSub },
  statusBadge: { borderRadius:100, paddingHorizontal:8, paddingVertical:4 },
  statusText: { fontSize:9, fontWeight:'800' },
  barBg: { height:6, backgroundColor:COLORS.border, borderRadius:3, marginBottom:8, overflow:'hidden' },
  barFill: { height:6, borderRadius:3 },
  metaRow: { flexDirection:'row', gap:16, marginBottom:8 },
  metaItem: { fontSize:11, color:COLORS.textSub },
  aiStockout: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:COLORS.red+'12', borderRadius:8, padding:8, marginBottom:8 },
  aiStockoutText: { fontSize:11, color:COLORS.red, fontWeight:'600' },
  medActions: { flexDirection:'row', gap:8 },
  medBtn: { flex:1, borderRadius:12, paddingVertical:10, alignItems:'center' },
  medBtnGhost: { backgroundColor:'#f1f5f9', borderWidth:1, borderColor:COLORS.border },
  medBtnGhostText: { fontSize:12, fontWeight:'700', color:COLORS.text },
  medBtnText: { fontSize:12, fontWeight:'700', color:'#fff' },
  fab: { position:'absolute', bottom:84, right:16, width:56, height:56, borderRadius:28, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:.2, shadowRadius:8, elevation:6 },
});
