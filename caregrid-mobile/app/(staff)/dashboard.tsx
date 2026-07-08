import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CENTERS, MEDICINES, AI_ACTIONS } from '@/lib/data';

const CENTER = CENTERS[0];
const MEDS = MEDICINES.filter((_,i) => i < 4);
const CRITICAL = MEDS.filter(m => m.status === 'critical');

const TASKS_INIT = [
  { id:1, label:'Morning medicine audit',    done:false },
  { id:2, label:'Update patient queue',       done:false },
  { id:3, label:'Doctor attendance marked',   done:true  },
  { id:4, label:'Submit daily footfall log',  done:false },
  { id:5, label:'Check expiry dates',         done:false },
];

const DOCTORS = [
  { name:'Dr. Arumugam', spec:'General Medicine', present:true  },
  { name:'Dr. Sundari',  spec:'Paediatrics',      present:false },
  { name:'Dr. Rajan',    spec:'General Medicine', present:false },
];

const TESTS = [
  { name:'Blood CBC',   status:'available' },
  { name:'Malaria RDT', status:'low',      qty:8  },
  { name:'Urine Test',  status:'available' },
  { name:'Dengue NS1',  status:'critical', qty:2  },
];

export default function StaffDashboard() {
  const [tasks, setTasks] = useState(TASKS_INIT);
  const [doctors, setDoctors] = useState(DOCTORS);

  const toggle = (id: number) => setTasks(p => p.map(t => t.id===id ? { ...t, done:!t.done } : t));
  const checkIn = (name: string) => {
    setDoctors(p => p.map(d => d.name===name ? { ...d, present:true } : d));
    Alert.alert('✅ Checked In', `${name} attendance recorded with GPS timestamp.`);
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:COLORS.bg }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={{ flex:1 }}>
          <Text style={styles.headerCenter}>{CENTER.name}</Text>
          <Text style={styles.headerSub}>Frontline Staff Portal</Text>
        </View>
        <View style={{ alignItems:'flex-end' }}>
          <View style={styles.avatar}><Text style={styles.avatarText}>NV</Text></View>
          <Text style={styles.staffName}>Nurse Vijaya</Text>
          <View style={styles.opdBadge}><View style={styles.blinkDot} /><Text style={styles.opdText}>OPD Open</Text></View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* KPIs */}
        <View style={styles.kpiRow}>
          {[
            { label:"Today's Patients", val:CENTER.footfallToday, color:'#3b82f6', icon:'people'      },
            { label:'Waiting Now',      val:23,                   color:COLORS.orange, icon:'time'    },
            { label:'Beds Available',   val:CENTER.beds,          color:CENTER.beds===0?COLORS.red:COLORS.green, icon:'bed' },
            { label:'Doctors Present',  val:`${CENTER.doctors}/${CENTER.doctorsTotal}`, color:CENTER.doctors<2?COLORS.red:COLORS.green, icon:'medical' },
          ].map(k => (
            <View key={k.label} style={[styles.kpiCard, { borderTopColor:k.color, borderTopWidth:3 }]}>
              <Ionicons name={k.icon as any} size={16} color={k.color} style={{ marginBottom:4 }} />
              <Text style={[styles.kpiVal, { color:k.color }]}>{k.val}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* AI Alert */}
        {CRITICAL.length > 0 && (
          <View style={styles.aiAlert}>
            <Ionicons name="warning" size={16} color={COLORS.red} />
            <Text style={styles.aiAlertText}>
              ⚠️ {CRITICAL.length} critical medicines near stock-out. AI recommends immediate reorder.
            </Text>
          </View>
        )}

        {/* Critical Medicines */}
        <Text style={styles.sectionTitle}>Critical Medicines</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:4 }}>
          {CRITICAL.map(m => (
            <View key={m.id} style={[styles.medCard, { borderColor:COLORS.red+'40', backgroundColor:COLORS.red+'08' }]}>
              <Text style={styles.medName}>{m.name.split(' ').slice(0,2).join(' ')}</Text>
              <Text style={[styles.medQty, { color:COLORS.red }]}>{m.quantity} {m.unit}</Text>
              <Text style={styles.medDays}>{m.daysLeft===0 ? 'Out today!' : `${m.daysLeft}d left`}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Tasks */}
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        <View style={styles.card}>
          <Text style={styles.taskCount}>{tasks.filter(t=>t.done).length}/{tasks.length} completed</Text>
          {tasks.map(t => (
            <TouchableOpacity key={t.id} onPress={() => toggle(t.id)} style={styles.taskRow}>
              <View style={[styles.checkbox, t.done && styles.checkboxDone]}>
                {t.done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={[styles.taskText, t.done && styles.taskDone]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Doctor Attendance */}
        <Text style={styles.sectionTitle}>Doctor Attendance</Text>
        <View style={styles.card}>
          {doctors.map(d => (
            <View key={d.name} style={styles.doctorRow}>
              <View style={[styles.docIcon, d.present && styles.docIconPresent]}>
                <Ionicons name="person" size={14} color={d.present ? COLORS.green : COLORS.textSub} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={styles.docName}>{d.name}</Text>
                <Text style={styles.docSpec}>{d.spec}</Text>
              </View>
              {d.present
                ? <View style={styles.presentBadge}><Text style={styles.presentText}>Present</Text></View>
                : <TouchableOpacity onPress={() => checkIn(d.name)} style={styles.checkInBtn}>
                    <Text style={styles.checkInText}>Check In</Text>
                  </TouchableOpacity>
              }
            </View>
          ))}
        </View>

        {/* Diagnostic Tests */}
        <Text style={styles.sectionTitle}>Diagnostic Tests</Text>
        <View style={styles.testsGrid}>
          {TESTS.map(t => (
            <View key={t.name} style={[styles.testCard, { backgroundColor: t.status==='critical' ? COLORS.red+'10' : t.status==='low' ? COLORS.orange+'10' : COLORS.green+'10' }]}>
              <Ionicons name="flask" size={14} color={t.status==='critical' ? COLORS.red : t.status==='low' ? COLORS.orange : COLORS.green} />
              <Text style={styles.testName}>{t.name}</Text>
              <Text style={[styles.testStatus, { color: t.status==='critical' ? COLORS.red : t.status==='low' ? COLORS.orange : COLORS.green }]}>
                {t.status==='critical' && t.qty ? `${t.qty} kits` : t.status==='low' && t.qty ? `${t.qty} kits` : 'Available'}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ height:20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop:52, paddingBottom:18, paddingHorizontal:16, flexDirection:'row', alignItems:'flex-start' },
  headerCenter: { color:'#fff', fontSize:18, fontWeight:'900' },
  headerSub: { color:'rgba(255,255,255,.65)', fontSize:11, marginTop:2 },
  avatar: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,.2)', alignItems:'center', justifyContent:'center', marginBottom:4 },
  avatarText: { color:'#fff', fontWeight:'800', fontSize:13 },
  staffName: { color:'rgba(255,255,255,.7)', fontSize:10, textAlign:'right' },
  opdBadge: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(34,197,94,.2)', borderRadius:100, paddingHorizontal:8, paddingVertical:3, marginTop:4 },
  blinkDot: { width:6, height:6, borderRadius:3, backgroundColor:'#22c55e' },
  opdText: { color:'#86efac', fontSize:10, fontWeight:'600' },
  content: { padding:14 },
  kpiRow: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 },
  kpiCard: { flex:1, minWidth:'45%', backgroundColor:'#fff', borderRadius:14, padding:12, borderWidth:1, borderColor:COLORS.border },
  kpiVal: { fontSize:22, fontWeight:'900' },
  kpiLabel: { fontSize:10, color:COLORS.textSub, marginTop:2 },
  aiAlert: { flexDirection:'row', alignItems:'flex-start', gap:8, backgroundColor:COLORS.red+'10', borderRadius:12, padding:12, borderWidth:1, borderColor:COLORS.red+'30', marginBottom:12 },
  aiAlertText: { flex:1, fontSize:12, color:COLORS.red, fontWeight:'600', lineHeight:18 },
  sectionTitle: { fontSize:11, fontWeight:'700', color:COLORS.textSub, textTransform:'uppercase', letterSpacing:.8, marginBottom:8, marginTop:4 },
  medCard: { borderRadius:14, padding:12, marginRight:8, borderWidth:1, minWidth:130 },
  medName: { fontSize:12, fontWeight:'800', color:COLORS.text, marginBottom:4 },
  medQty: { fontSize:20, fontWeight:'900' },
  medDays: { fontSize:10, color:COLORS.textSub, marginTop:2 },
  card: { backgroundColor:'#fff', borderRadius:16, padding:14, borderWidth:1, borderColor:COLORS.border, marginBottom:12 },
  taskCount: { fontSize:11, color:COLORS.textSub, marginBottom:8 },
  taskRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:7, borderTopWidth:1, borderTopColor:'#f8fafc' },
  checkbox: { width:18, height:18, borderRadius:5, borderWidth:2, borderColor:COLORS.border, alignItems:'center', justifyContent:'center' },
  checkboxDone: { backgroundColor:COLORS.green, borderColor:COLORS.green },
  taskText: { fontSize:12, color:COLORS.text },
  taskDone: { color:COLORS.textSub, textDecorationLine:'line-through' },
  doctorRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, borderTopWidth:1, borderTopColor:'#f8fafc' },
  docIcon: { width:34, height:34, borderRadius:12, backgroundColor:'#f1f5f9', alignItems:'center', justifyContent:'center' },
  docIconPresent: { backgroundColor:'#f0fdf4' },
  docName: { fontSize:12, fontWeight:'700', color:COLORS.text },
  docSpec: { fontSize:10, color:COLORS.textSub },
  presentBadge: { backgroundColor:'#f0fdf4', borderRadius:100, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor:'#bbf7d0' },
  presentText: { fontSize:10, color:COLORS.green, fontWeight:'700' },
  checkInBtn: { backgroundColor:'#eff6ff', borderRadius:100, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:'#bfdbfe' },
  checkInText: { fontSize:10, color:COLORS.primary, fontWeight:'700' },
  testsGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 },
  testCard: { width:'47%', borderRadius:12, padding:10, gap:4 },
  testName: { fontSize:11, fontWeight:'700', color:COLORS.text },
  testStatus: { fontSize:10, fontWeight:'600' },
});
