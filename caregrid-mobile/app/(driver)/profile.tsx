import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DriverProfile() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>RK</Text></View>
        <Text style={styles.name}>Ravi Kumar</Text>
        <Text style={styles.role}>Logistics Driver · CareGrid Network</Text>
        <Text style={styles.id}>Driver ID: DRV-2024-0042</Text>
      </View>

      <View style={{ padding:16 }}>
        {[
          { label:'Vehicle No.',   value:'TN 33 AB 4567' },
          { label:'Vehicle Type',  value:'Medicine Van'  },
          { label:'Fuel Level',    value:'78%'           },
          { label:'Dist. Today',   value:'47 km'         },
          { label:'Deliveries',    value:'3 completed'   },
        ].map(r => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}

        <TouchableOpacity onPress={() => Alert.alert('Support','Calling dispatch control (simulated)')} style={styles.supportBtn}>
          <Ionicons name="headset" size={16} color="#60a5fa" />
          <Text style={styles.supportText}>Contact Dispatch Support</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={16} color="#f87171" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080d1a' },
  header: { paddingTop:56, paddingBottom:28, alignItems:'center', borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,.06)' },
  avatar: { width:80, height:80, borderRadius:40, backgroundColor:'#1e3a5f', borderWidth:2, borderColor:'#3b82f6', alignItems:'center', justifyContent:'center', marginBottom:12 },
  avatarText: { color:'#60a5fa', fontSize:24, fontWeight:'900' },
  name: { color:'#fff', fontSize:20, fontWeight:'900' },
  role: { color:'#475569', fontSize:12, marginTop:4 },
  id: { color:'#334155', fontSize:11, marginTop:2 },
  row: { flexDirection:'row', justifyContent:'space-between', paddingVertical:14, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,.06)' },
  rowLabel: { color:'#475569', fontSize:13 },
  rowValue: { color:'#cbd5e1', fontSize:13, fontWeight:'700' },
  supportBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'rgba(96,165,250,.1)', borderRadius:16, paddingVertical:14, marginTop:20, borderWidth:1, borderColor:'rgba(96,165,250,.2)' },
  supportText: { color:'#60a5fa', fontSize:14, fontWeight:'700' },
  logoutBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'rgba(248,113,113,.1)', borderRadius:16, paddingVertical:14, marginTop:10, borderWidth:1, borderColor:'rgba(248,113,113,.2)' },
  logoutText: { color:'#f87171', fontSize:14, fontWeight:'700' },
});
