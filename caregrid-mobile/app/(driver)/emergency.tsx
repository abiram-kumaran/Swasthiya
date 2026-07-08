import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

export default function DriverEmergency() {
  const [active, setActive] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Response</Text>
        <Text style={styles.headerSub}>Ambulance · CareGrid Network</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        {/* SOS Button */}
        <TouchableOpacity
          onPress={() => { setActive(!active); Alert.alert(active ? 'SOS Cancelled' : '🚨 Emergency SOS Activated!', active ? 'Alert cleared.' : 'District control and nearest hospital notified. ETA: 8 min.'); }}
          style={[styles.sosBtn, active && styles.sosBtnActive]}
          activeOpacity={0.85}
        >
          <Ionicons name="warning" size={40} color="#fff" />
          <Text style={styles.sosBtnTitle}>{active ? 'CANCEL SOS' : 'EMERGENCY SOS'}</Text>
          <Text style={styles.sosBtnSub}>{active ? 'Tap to cancel alert' : 'Tap to activate'}</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        {[
          { icon:'call',       label:'Call 108',             sub:'National emergency helpline',    color:'#ef4444', onPress:()=>Alert.alert('Calling','Dialling 108 (simulated)') },
          { icon:'medical',    label:'Nearest Hospital',     sub:'CHC-Central · 2.1 km · ICU ready', color:'#3b82f6', onPress:()=>Alert.alert('Hospital','Navigating to CHC-Central') },
          { icon:'radio',      label:'Contact Dispatch',     sub:'District control room',           color:'#8b5cf6', onPress:()=>Alert.alert('Dispatch','Contacting control room') },
          { icon:'share',      label:'Share Live Location',  sub:'Share with hospital & family',    color:'#10b981', onPress:()=>Alert.alert('Location','Live location shared') },
        ].map(a => (
          <TouchableOpacity key={a.label} onPress={a.onPress} style={styles.actionCard} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
              <Ionicons name={a.icon as any} size={22} color={a.color} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#475569" />
          </TouchableOpacity>
        ))}
        <View style={{ height:20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080d1a' },
  header: { paddingTop:56, paddingBottom:16, paddingHorizontal:16, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,.06)' },
  headerTitle: { color:'#fff', fontSize:20, fontWeight:'900' },
  headerSub: { color:'#475569', fontSize:11, marginTop:2 },
  sosBtn: { borderRadius:24, padding:28, alignItems:'center', backgroundColor:'#dc2626', marginBottom:24, shadowColor:'#dc2626', shadowOpacity:.4, shadowRadius:16, elevation:8 },
  sosBtnActive: { backgroundColor:'#475569' },
  sosBtnTitle: { color:'#fff', fontSize:24, fontWeight:'900', marginTop:12, letterSpacing:1 },
  sosBtnSub: { color:'rgba(255,255,255,.7)', fontSize:12, marginTop:4 },
  sectionLabel: { fontSize:10, fontWeight:'700', color:'#475569', textTransform:'uppercase', letterSpacing:.8, marginBottom:12 },
  actionCard: { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'#0d1526', borderRadius:16, padding:14, marginBottom:10, borderWidth:1, borderColor:'rgba(255,255,255,.06)' },
  actionIcon: { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' },
  actionLabel: { color:'#fff', fontSize:14, fontWeight:'700' },
  actionSub: { color:'#475569', fontSize:11, marginTop:2 },
});
