import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

const TASKS_DATA = [
  { id:1, label:'Morning medicine audit',          category:'Inventory',  priority:'high',   done:false, due:'9:00 AM'  },
  { id:2, label:'Update patient queue board',      category:'Patients',   priority:'medium', done:false, due:'10:00 AM' },
  { id:3, label:'Doctor attendance marked',        category:'Attendance', priority:'high',   done:true,  due:'8:30 AM'  },
  { id:4, label:'Submit daily footfall log to DMO',category:'Reports',    priority:'high',   done:false, due:'5:00 PM'  },
  { id:5, label:'Check ORS and Paracetamol expiry',category:'Inventory',  priority:'medium', done:false, due:'2:00 PM'  },
  { id:6, label:'Bed occupancy report',            category:'Beds',       priority:'low',    done:false, due:'4:00 PM'  },
  { id:7, label:'Dengue test kits restock request',category:'Inventory',  priority:'high',   done:false, due:'11:00 AM' },
];

const PRIO_COLOR: Record<string, string> = {
  high: COLORS.red, medium: COLORS.orange, low: COLORS.green,
};

const CAT_ICON: Record<string, string> = {
  Inventory: 'cube', Patients: 'people', Attendance: 'person-circle',
  Reports: 'document-text', Beds: 'bed', default: 'checkbox',
};

export default function StaffTasks() {
  const [tasks, setTasks] = useState(TASKS_DATA);
  const done   = tasks.filter(t => t.done).length;
  const pct    = Math.round((done / tasks.length) * 100);

  const toggle = (id: number) =>
    setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Today's Tasks</Text>
        <Text style={styles.headerSub}>PHC-Alpha · {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</Text>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
            <Text style={styles.progressLabel}>{done} of {tasks.length} completed</Text>
            <Text style={[styles.progressLabel, { fontWeight:'800' }]}>{pct}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
        {/* AI Pending Actions */}
        <View style={styles.aiBanner}>
          <Ionicons name="flash" size={14} color="#7c3aed" />
          <Text style={styles.aiBannerText}>
            AI has flagged 3 high-priority tasks. Complete them before 12pm to avoid district escalation.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>All Tasks</Text>

        {tasks.map(task => (
          <TouchableOpacity
            key={task.id}
            onPress={() => toggle(task.id)}
            activeOpacity={0.85}
            style={[styles.taskCard, task.done && styles.taskCardDone]}
          >
            <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
              {task.done && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.taskLabel, task.done && styles.taskLabelDone]}>
                {task.label}
              </Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginTop:5 }}>
                <View style={styles.catBadge}>
                  <Ionicons name={(CAT_ICON[task.category] ?? CAT_ICON.default) as any} size={10} color={COLORS.textSub} />
                  <Text style={styles.catText}>{task.category}</Text>
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', gap:3 }}>
                  <Ionicons name="time-outline" size={10} color={COLORS.textLight} />
                  <Text style={styles.dueText}>{task.due}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.prioDot, { backgroundColor: PRIO_COLOR[task.priority] }]} />
          </TouchableOpacity>
        ))}

        {/* Add Task */}
        <TouchableOpacity
          onPress={() => Alert.alert('Add Task', 'New task form (simulated)')}
          style={styles.addTaskBtn}
        >
          <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.addTaskText}>Add New Task</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop:52, paddingBottom:24, paddingHorizontal:16 },
  headerTitle: { color:'#fff', fontSize:18, fontWeight:'900' },
  headerSub: { color:'rgba(255,255,255,.65)', fontSize:11, marginTop:3, marginBottom:16 },
  progressCard: { backgroundColor:'rgba(255,255,255,.15)', borderRadius:16, padding:14, borderWidth:1, borderColor:'rgba(255,255,255,.2)' },
  progressLabel: { color:'rgba(255,255,255,.8)', fontSize:12 },
  progressBg: { height:8, backgroundColor:'rgba(255,255,255,.2)', borderRadius:4, overflow:'hidden' },
  progressFill: { height:8, backgroundColor:'#fff', borderRadius:4 },
  aiBanner: { flexDirection:'row', alignItems:'flex-start', gap:8, backgroundColor:'#ede9fe', borderRadius:14, padding:12, borderWidth:1, borderColor:'#c4b5fd', marginBottom:14 },
  aiBannerText: { flex:1, fontSize:12, color:'#5b21b6', lineHeight:18 },
  sectionLabel: { fontSize:11, fontWeight:'700', color:COLORS.textSub, textTransform:'uppercase', letterSpacing:.8, marginBottom:10 },
  taskCard: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:8, borderWidth:1, borderColor:COLORS.border },
  taskCardDone: { opacity:.65, backgroundColor:'#f8fafc' },
  checkbox: { width:22, height:22, borderRadius:7, borderWidth:2, borderColor:COLORS.border, alignItems:'center', justifyContent:'center', flexShrink:0 },
  checkboxDone: { backgroundColor:COLORS.green, borderColor:COLORS.green },
  taskLabel: { fontSize:13, fontWeight:'600', color:COLORS.text, lineHeight:19 },
  taskLabelDone: { textDecorationLine:'line-through', color:COLORS.textSub },
  catBadge: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#f1f5f9', borderRadius:100, paddingHorizontal:8, paddingVertical:3 },
  catText: { fontSize:10, color:COLORS.textSub, fontWeight:'600' },
  dueText: { fontSize:10, color:COLORS.textLight },
  prioDot: { width:8, height:8, borderRadius:4, flexShrink:0 },
  addTaskBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderRadius:16, paddingVertical:14, borderWidth:1.5, borderColor:COLORS.primary, borderStyle:'dashed', marginTop:4 },
  addTaskText: { color:COLORS.primary, fontSize:13, fontWeight:'700' },
});
