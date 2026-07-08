import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/lib/data';

function Section({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label:string; value:string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Chip({ label, color = COLORS.primary, onRemove }: { label:string; color?:string; onRemove?:()=>void }) {
  return (
    <View style={[styles.chip, { backgroundColor:color+'15', borderColor:color+'40' }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={12} color={color} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const HISTORY = [
  { date:'Jun 28, 2026', clinic:'PHC-North',   diagnosis:'Routine Checkup',  doctor:'Dr. Sharma' },
  { date:'May 15, 2026', clinic:'CHC-Central',  diagnosis:'Seasonal Allergy', doctor:'Dr. Priya'  },
  { date:'Mar 3, 2026',  clinic:'PHC-Beta',     diagnosis:'Viral Fever',      doctor:'Dr. Arjun'  },
];

export default function PatientProfile() {
  const [conditions, setConditions] = useState(['Hypertension','Diabetes Type 2']);
  const [allergies, setAllergies] = useState(['Penicillin']);
  const [lang, setLang] = useState('EN');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [largeText, setLargeText] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>MS</Text>
        </View>
        <Text style={styles.name}>Muthu Selvam</Text>
        <Text style={styles.mobile}>+91 98765 43210</Text>
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
          <Text style={styles.verifiedText}>ABHA Verified</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert('Edit Profile','Editing profile (simulated)')}>
          <Ionicons name="create-outline" size={14} color={COLORS.primary} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding:16 }}>
        {/* Health Info */}
        <Section title="Health Information">
          <Row label="Blood Group" value="B+" />
          <Row label="Age"         value="67 years" />
          <Row label="Weight"      value="68 kg" />
          <Row label="Height"      value="162 cm" />
          <Row label="ABHA ID"     value="14-2345-6789-0001" />
        </Section>

        {/* Conditions */}
        <Section title="Current Health Issues">
          <View style={styles.chipsRow}>
            {conditions.map(c => (
              <Chip key={c} label={c} color={COLORS.primary} onRemove={() => setConditions(p=>p.filter(x=>x!==c))} />
            ))}
            <TouchableOpacity onPress={() => Alert.alert('Add Condition','Enter condition name')} style={styles.addChip}>
              <Ionicons name="add" size={12} color={COLORS.textSub} />
              <Text style={styles.addChipText}>Add</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Allergies */}
        <Section title="Allergies">
          <View style={styles.chipsRow}>
            {allergies.map(a => (
              <Chip key={a} label={a} color={COLORS.red} onRemove={() => setAllergies(p=>p.filter(x=>x!==a))} />
            ))}
            <TouchableOpacity onPress={() => Alert.alert('Add Allergy','Enter allergy')} style={styles.addChip}>
              <Ionicons name="add" size={12} color={COLORS.textSub} />
              <Text style={styles.addChipText}>Add</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Emergency Contacts */}
        <Section title="Emergency Contacts">
          {[{name:'Sunita Kumar',rel:'Wife',phone:'+91 98765 11111'},{name:'Raj Kumar',rel:'Brother',phone:'+91 98765 22222'}].map(c => (
            <View key={c.name} style={styles.contactRow}>
              <View style={styles.contactIcon}><Ionicons name="person" size={16} color={COLORS.primary} /></View>
              <View style={{ flex:1 }}>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactSub}>{c.rel} · {c.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert('Call',`Calling ${c.phone}`)}>
                <Ionicons name="call" size={16} color={COLORS.green} />
              </TouchableOpacity>
            </View>
          ))}
        </Section>

        {/* Medical History */}
        <Section title="Medical History">
          {HISTORY.map((h,i) => (
            <View key={h.date} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDot} />
                {i < HISTORY.length-1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{h.date}</Text>
                <Text style={styles.timelineDiag}>{h.diagnosis}</Text>
                <Text style={styles.timelineSub}>{h.clinic} · {h.doctor}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* Settings */}
        <Section title="Settings">
          {/* Language */}
          <Text style={styles.subLabel}>Language</Text>
          <View style={styles.langRow}>
            {['EN','हिन्दी','தமிழ்'].map(l => (
              <TouchableOpacity key={l} onPress={() => setLang(l)} style={[styles.langBtn, lang===l && styles.langBtnActive]}>
                <Text style={[styles.langBtnText, lang===l && { color:COLORS.primary, fontWeight:'700' }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true:COLORS.primary }} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true:COLORS.primary }} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Large Text</Text>
            <Switch value={largeText} onValueChange={setLargeText} trackColor={{ true:COLORS.primary }} />
          </View>
        </Section>

        {/* Logout */}
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height:20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:COLORS.bg },
  avatarSection: { alignItems:'center', paddingTop:60, paddingBottom:24, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.border },
  avatar: { width:80, height:80, borderRadius:40, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center', marginBottom:12, shadowColor:COLORS.primary, shadowOpacity:.3, shadowRadius:10, elevation:4 },
  avatarText: { color:'#fff', fontSize:24, fontWeight:'900' },
  name: { fontSize:18, fontWeight:'900', color:COLORS.text },
  mobile: { fontSize:12, color:COLORS.textSub, marginTop:3 },
  verifiedRow: { flexDirection:'row', alignItems:'center', gap:4, marginTop:6 },
  verifiedText: { fontSize:11, color:COLORS.green, fontWeight:'600' },
  editBtn: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#eff6ff', borderRadius:100, paddingHorizontal:14, paddingVertical:7, marginTop:12, borderWidth:1, borderColor:'#bfdbfe' },
  editBtnText: { color:COLORS.primary, fontSize:12, fontWeight:'700' },
  section: { backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:12, borderWidth:1, borderColor:COLORS.border },
  sectionTitle: { fontSize:10, fontWeight:'800', color:COLORS.textSub, textTransform:'uppercase', letterSpacing:.8, marginBottom:10 },
  row: { flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderBottomColor:'#f8fafc' },
  rowLabel: { fontSize:12, color:COLORS.textSub },
  rowValue: { fontSize:12, fontWeight:'700', color:COLORS.text },
  chipsRow: { flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:2 },
  chip: { flexDirection:'row', alignItems:'center', gap:4, borderRadius:100, paddingHorizontal:10, paddingVertical:5, borderWidth:1 },
  chipText: { fontSize:11, fontWeight:'600' },
  addChip: { flexDirection:'row', alignItems:'center', gap:3, borderRadius:100, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:COLORS.border, borderStyle:'dashed' },
  addChipText: { fontSize:11, color:COLORS.textSub },
  contactRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, borderBottomWidth:1, borderBottomColor:'#f8fafc' },
  contactIcon: { width:36, height:36, borderRadius:12, backgroundColor:'#eff6ff', alignItems:'center', justifyContent:'center' },
  contactName: { fontSize:13, fontWeight:'700', color:COLORS.text },
  contactSub: { fontSize:11, color:COLORS.textSub, marginTop:1 },
  callBtn: { width:36, height:36, borderRadius:12, backgroundColor:'#f0fdf4', alignItems:'center', justifyContent:'center' },
  timelineItem: { flexDirection:'row', gap:10, marginBottom:4 },
  timelineLeft: { alignItems:'center', width:14 },
  timelineDot: { width:10, height:10, borderRadius:5, backgroundColor:COLORS.primary, marginTop:3 },
  timelineLine: { flex:1, width:2, backgroundColor:COLORS.border, marginTop:4 },
  timelineContent: { flex:1, paddingBottom:12 },
  timelineDate: { fontSize:10, color:COLORS.textSub, marginBottom:2 },
  timelineDiag: { fontSize:13, fontWeight:'700', color:COLORS.text },
  timelineSub: { fontSize:11, color:COLORS.textSub, marginTop:1 },
  subLabel: { fontSize:11, color:COLORS.textSub, marginBottom:6 },
  langRow: { flexDirection:'row', gap:8, marginBottom:10 },
  langBtn: { flex:1, paddingVertical:8, borderRadius:10, backgroundColor:'#f1f5f9', alignItems:'center', borderWidth:1, borderColor:COLORS.border },
  langBtnActive: { backgroundColor:'#dbeafe', borderColor:'#93c5fd' },
  langBtnText: { fontSize:12, color:COLORS.textSub },
  toggleRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:10, borderTopWidth:1, borderTopColor:'#f8fafc' },
  toggleLabel: { fontSize:13, color:COLORS.text },
  logoutBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#fff1f2', borderRadius:16, paddingVertical:14, borderWidth:1, borderColor:'#fecaca' },
  logoutText: { color:COLORS.red, fontSize:14, fontWeight:'800' },
});
