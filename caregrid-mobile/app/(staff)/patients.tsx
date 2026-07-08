import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PATIENTS, type Patient } from '@/lib/data';

const PRIO: Record<Patient['priority'], { color:string; order:number }> = {
  emergency:{ color:COLORS.red,    order:0 },
  senior:   { color:COLORS.orange, order:1 },
  pregnant: { color:'#7c3aed',     order:2 },
  child:    { color:'#3b82f6',     order:3 },
  normal:   { color:COLORS.textSub,order:4 },
};

export default function Patients() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'queue'|'history'>('queue');
  const [detail, setDetail] = useState<Patient|null>(null);

  const sorted = [...PATIENTS].sort((a,b) => PRIO[a.priority].order - PRIO[b.priority].order);
  const visible = sorted.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ flex:1, backgroundColor:COLORS.bg }}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <Text style={styles.headerTitle}>Patients</Text>
            <View style={styles.countBadge}><Text style={styles.countText}>{PATIENTS.filter(p=>p.tokenNumber).length} waiting</Text></View>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Register Patient','Opening registration form (simulated)')} style={styles.registerBtn}>
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={14} color="rgba(255,255,255,.5)" />
          <TextInput style={styles.searchInput} placeholder="Search patients…" placeholderTextColor="rgba(255,255,255,.4)" value={search} onChangeText={setSearch} />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['queue','history'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab===t && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab===t && styles.tabTextActive]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:14 }} showsVerticalScrollIndicator={false}>
        {tab === 'queue' ? visible.filter(p=>p.tokenNumber).map((p,i) => (
          <View key={p.id} style={styles.patientCard}>
            <View style={[styles.token, { backgroundColor:PRIO[p.priority].color }]}>
              <Text style={styles.tokenText}>#{p.tokenNumber}</Text>
            </View>
            <View style={{ flex:1 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <Text style={styles.patientName}>{p.name}</Text>
                <Text style={styles.patientMeta}>{p.age}y · {p.gender==='M'?'M':'F'}</Text>
                <View style={[styles.prioBadge, { backgroundColor:PRIO[p.priority].color+'20', borderColor:PRIO[p.priority].color+'40' }]}>
                  <Text style={[styles.prioText, { color:PRIO[p.priority].color }]}>{p.priority}</Text>
                </View>
              </View>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:5 }}>
                {p.conditions.slice(0,2).map(c => (
                  <View key={c} style={styles.condChip}><Text style={styles.condText}>{c}</Text></View>
                ))}
              </View>
            </View>
            <View style={{ gap:6 }}>
              <TouchableOpacity onPress={() => Alert.alert(`🔊 Calling Token #${p.tokenNumber}`,`${p.name} — Please proceed to OPD`)} style={styles.callBtn}>
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDetail(p)} style={styles.viewBtn}>
                <Text style={styles.viewText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )) : (
          <View style={{ alignItems:'center', padding:40 }}>
            <Ionicons name="time-outline" size={40} color={COLORS.textLight} />
            <Text style={{ color:COLORS.textSub, marginTop:12, fontSize:13 }}>Visit history will appear here</Text>
          </View>
        )}
        <View style={{ height:20 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!detail} animationType="slide" presentationStyle="pageSheet">
        {detail && (
          <ScrollView style={{ flex:1, backgroundColor:COLORS.bg }}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={{ paddingTop:52, paddingBottom:20, paddingHorizontal:16 }}>
              <TouchableOpacity onPress={() => setDetail(null)} style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:12 }}>
                <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,.7)" />
                <Text style={{ color:'rgba(255,255,255,.7)', fontSize:12 }}>Back</Text>
              </TouchableOpacity>
              <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                <View style={{ width:52, height:52, borderRadius:26, backgroundColor:'rgba(255,255,255,.2)', alignItems:'center', justifyContent:'center' }}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View>
                  <Text style={{ color:'#fff', fontSize:16, fontWeight:'900' }}>{detail.name}</Text>
                  <Text style={{ color:'rgba(255,255,255,.6)', fontSize:11, marginTop:2 }}>{detail.age}y · {detail.gender==='M'?'Male':'Female'} · {detail.bloodGroup}</Text>
                  <Text style={{ color:'rgba(255,255,255,.5)', fontSize:10 }}>ABHA: {detail.abhaId}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={{ padding:16 }}>
              {[['Phone', detail.phone], ['Village', detail.village]].map(([l,v]) => (
                <View key={l} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:10, borderBottomWidth:1, borderBottomColor:COLORS.border }}>
                  <Text style={{ color:COLORS.textSub, fontSize:12 }}>{l}</Text>
                  <Text style={{ color:COLORS.text, fontSize:12, fontWeight:'700' }}>{v}</Text>
                </View>
              ))}
              <View style={{ marginTop:14 }}>
                <Text style={{ fontSize:11, fontWeight:'700', color:COLORS.textSub, textTransform:'uppercase', letterSpacing:.8, marginBottom:8 }}>Conditions</Text>
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                  {detail.conditions.map(c => <View key={c} style={{ backgroundColor:'#eff6ff', borderRadius:100, paddingHorizontal:10, paddingVertical:4 }}><Text style={{ fontSize:11, color:COLORS.primary, fontWeight:'600' }}>{c}</Text></View>)}
                </View>
              </View>
              {detail.allergies.length > 0 && (
                <View style={{ marginTop:14 }}>
                  <Text style={{ fontSize:11, fontWeight:'700', color:COLORS.red, textTransform:'uppercase', letterSpacing:.8, marginBottom:8 }}>⚠️ Allergies</Text>
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                    {detail.allergies.map(a => <View key={a} style={{ backgroundColor:'#fef2f2', borderRadius:100, paddingHorizontal:10, paddingVertical:4 }}><Text style={{ fontSize:11, color:COLORS.red, fontWeight:'600' }}>{a}</Text></View>)}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop:52, paddingBottom:16, paddingHorizontal:16 },
  headerTitle: { color:'#fff', fontSize:17, fontWeight:'800' },
  countBadge: { backgroundColor:'rgba(255,255,255,.2)', borderRadius:100, paddingHorizontal:8, paddingVertical:3 },
  countText: { color:'#fff', fontSize:10, fontWeight:'700' },
  registerBtn: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(255,255,255,.15)', borderRadius:10, paddingHorizontal:10, paddingVertical:7, borderWidth:1, borderColor:'rgba(255,255,255,.3)' },
  registerText: { color:'#fff', fontSize:11, fontWeight:'700' },
  searchBox: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,.12)', borderRadius:12, paddingHorizontal:12, paddingVertical:9, gap:8, borderWidth:1, borderColor:'rgba(255,255,255,.2)' },
  searchInput: { flex:1, color:'#fff', fontSize:13 },
  tabRow: { flexDirection:'row', margin:14, marginBottom:4, backgroundColor:'#e2e8f0', borderRadius:12, padding:3 },
  tabBtn: { flex:1, paddingVertical:8, borderRadius:10, alignItems:'center' },
  tabBtnActive: { backgroundColor:'#fff', shadowColor:'#000', shadowOpacity:.06, shadowRadius:4, elevation:1 },
  tabText: { fontSize:12, color:COLORS.textSub, fontWeight:'600' },
  tabTextActive: { color:COLORS.primary, fontWeight:'700' },
  patientCard: { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:8, borderWidth:1, borderColor:COLORS.border },
  token: { width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
  tokenText: { color:'#fff', fontSize:10, fontWeight:'900' },
  patientName: { fontSize:13, fontWeight:'800', color:COLORS.text },
  patientMeta: { fontSize:11, color:COLORS.textSub },
  prioBadge: { borderRadius:100, paddingHorizontal:7, paddingVertical:2, borderWidth:1 },
  prioText: { fontSize:9, fontWeight:'800', textTransform:'capitalize' },
  condChip: { backgroundColor:'#f1f5f9', borderRadius:100, paddingHorizontal:8, paddingVertical:2 },
  condText: { fontSize:10, color:COLORS.textSub },
  callBtn: { backgroundColor:COLORS.primary, borderRadius:10, paddingHorizontal:12, paddingVertical:6, alignItems:'center' },
  callText: { color:'#fff', fontSize:11, fontWeight:'700' },
  viewBtn: { backgroundColor:'#f1f5f9', borderRadius:10, paddingHorizontal:12, paddingVertical:6, alignItems:'center' },
  viewText: { color:COLORS.text, fontSize:11, fontWeight:'600' },
});
