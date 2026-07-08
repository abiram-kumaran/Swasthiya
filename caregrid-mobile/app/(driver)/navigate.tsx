import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DriverNavigate() {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.iconBox}>
          <Ionicons name="navigate" size={40} color="#60a5fa" />
        </View>
        <Text style={styles.title}>Smart Navigation</Text>
        <Text style={styles.sub}>
          AI-optimised routing based on traffic,{'\n'}fuel, distance and urgency.
        </Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Navigation', 'Opening Google Maps with optimised route (simulated)')}
          style={styles.btn}
        >
          <Ionicons name="navigate-circle" size={18} color="#fff" />
          <Text style={styles.btnText}>Start Navigation</Text>
        </TouchableOpacity>

        {['Traffic-aware routing','Multi-stop optimisation','Fuel efficiency mode'].map(f => (
          <View key={f} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080d1a' },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:32 },
  iconBox: { width:80, height:80, borderRadius:24, backgroundColor:'rgba(96,165,250,.12)', alignItems:'center', justifyContent:'center', marginBottom:20, borderWidth:1, borderColor:'rgba(96,165,250,.2)' },
  title: { color:'#fff', fontSize:20, fontWeight:'900', marginBottom:8 },
  sub: { color:'#475569', fontSize:13, textAlign:'center', lineHeight:20, marginBottom:28 },
  btn: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#3b82f6', borderRadius:16, paddingVertical:14, paddingHorizontal:28, marginBottom:28 },
  btnText: { color:'#fff', fontSize:15, fontWeight:'800' },
  featureRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  featureText: { color:'#475569', fontSize:13 },
});
