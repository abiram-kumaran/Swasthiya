import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, CENTERS } from '@/lib/data';

const CROWD_COLOR: Record<string, string> = {
  high: COLORS.red, moderate: COLORS.orange, low: COLORS.green,
};

const QUICK_ACTIONS = [
  { icon:'calendar',        label:'Book Token',     color:'#3b82f6', onPress:()=>Alert.alert('Token Booking','Opening booking flow...') },
  { icon:'car',             label:'Ambulance',      color:COLORS.red, onPress:()=>Alert.alert('🚑 Ambulance','Requesting ambulance... ETA 8 min') },
  { icon:'alert-circle',    label:'Emergency SOS',  color:'#dc2626', onPress:()=>Alert.alert('🚨 SOS','Emergency services alerted!') },
  { icon:'medical',         label:'Vaccination',    color:COLORS.green, onPress:()=>Alert.alert('Vaccination','Schedule opened') },
  { icon:'search',          label:'Specialist',     color:'#7c3aed', onPress:()=>Alert.alert('Specialist','Search opened') },
  { icon:'fitness',         label:'Medicine Check', color:'#d97706', onPress:()=>Alert.alert('Medicine','Checking availability...') },
];

export default function PatientHome() {
  const recommended = CENTERS.find(c => c.status === 'healthy') ?? CENTERS[3];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Gov Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={{ flex:1 }}>
          <Text style={styles.greeting}>Good Morning 👋</Text>
          <Text style={styles.name}>Muthu Selvam</Text>
          <Text style={styles.abha}>ABHA: 14-2345-6789-0001</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>MS</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* ABHA Health Card */}
        <LinearGradient colors={['#1a73e8','#0B6CBB']} style={styles.healthCard}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
            <View style={{ flex:1 }}>
              <Text style={styles.cardLabel}>ABHA Health Card</Text>
              <Text style={styles.cardName}>Muthu Selvam</Text>
              <Text style={styles.cardId}>14-2345-6789-0001</Text>
              <View style={styles.vitalsRow}>
                {[['Blood','B+'],['Age','67'],['Allergy','Penicillin']].map(([l,v]) => (
                  <View key={l} style={styles.vital}>
                    <Text style={styles.vitalLabel}>{l}</Text>
                    <Text style={styles.vitalValue}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNum}>82</Text>
              <Text style={styles.scoreLabel}>Health{'\n'}Score</Text>
            </View>
          </View>
          <View style={styles.barcode}>
            <Text style={{ color:'rgba(255,255,255,.3)', letterSpacing:2, fontSize:8 }}>
              ████████████████████████████
            </Text>
          </View>
        </LinearGradient>

        {/* Alerts */}
        <SectionTitle title="Health Alerts" />
        <View style={styles.alertCard}>
          <Text style={{ fontSize:18 }}>🌡️</Text>
          <View style={{ flex:1, marginLeft:10 }}>
            <Text style={[styles.alertTitle, { color:COLORS.red }]}>Heatwave Advisory</Text>
            <Text style={styles.alertMsg}>Stay hydrated. Avoid outdoor 12pm–4pm.</Text>
          </View>
          <View style={[styles.alertBadge, { backgroundColor:COLORS.red+'20' }]}>
            <Text style={[styles.alertBadgeText, { color:COLORS.red }]}>HIGH</Text>
          </View>
        </View>
        <View style={[styles.alertCard, { borderColor:COLORS.orange+'40', backgroundColor:COLORS.orange+'08' }]}>
          <Text style={{ fontSize:18 }}>🦟</Text>
          <View style={{ flex:1, marginLeft:10 }}>
            <Text style={[styles.alertTitle, { color:COLORS.orange }]}>Dengue Alert — Karungal Ward</Text>
            <Text style={styles.alertMsg}>14 cases detected. Use mosquito repellent.</Text>
          </View>
          <View style={[styles.alertBadge, { backgroundColor:COLORS.orange+'20' }]}>
            <Text style={[styles.alertBadgeText, { color:COLORS.orange }]}>WATCH</Text>
          </View>
        </View>

        {/* AI Recommendation */}
        <SectionTitle title="🤖 AI Recommendation" />
        <View style={styles.aiCard}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <Text style={styles.aiCenter}>{recommended.name}</Text>
            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>Best match</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
            {[`${recommended.waitMins} min wait`,`${recommended.doctors} doctors`,`${recommended.beds} beds free`,recommended.distance ?? '2.1 km','Medicines stocked'].map(chip => (
              <View key={chip} style={styles.chip}><Text style={styles.chipText}>{chip}</Text></View>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => Alert.alert('Token Booked!', `Your token at ${recommended.name} has been booked.`)}
            style={styles.bookBtn}
          >
            <Text style={styles.bookBtnText}>Book Token →</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <SectionTitle title="Quick Actions" />
        <View style={styles.qaGrid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.label} onPress={a.onPress} activeOpacity={0.8} style={styles.qaItem}>
              <View style={[styles.qaIcon, { backgroundColor:a.color+'18' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.qaLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nearby Centres */}
        <SectionTitle title="Nearby Health Centres" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:16 }}>
          {CENTERS.slice(0,4).map(c => (
            <TouchableOpacity key={c.id} onPress={() => router.push('/(patient)/map')} style={styles.centerCard} activeOpacity={0.85}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:8 }}>
                <View style={[styles.crowdDot, { backgroundColor:CROWD_COLOR[c.crowd] }]} />
                <Text style={styles.centerName}>{c.name}</Text>
                <View style={styles.typePill}><Text style={styles.typeText}>{c.type}</Text></View>
              </View>
              {[
                ['⏱', `${c.waitMins} min wait`],
                ['👨‍⚕️', `${c.doctors}/${c.doctorsTotal} doctors`],
                ['🛏', `${c.beds} beds`],
                ['📍', c.distance ?? '~2 km'],
              ].map(([icon, text]) => (
                <Text key={text as string} style={styles.centerRow}>{icon as string} {text as string}</Text>
              ))}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:COLORS.bg },
  header: { paddingTop:56, paddingBottom:20, paddingHorizontal:18, flexDirection:'row', alignItems:'center' },
  greeting: { color:'rgba(255,255,255,.7)', fontSize:12, marginBottom:4 },
  name: { color:'#fff', fontSize:20, fontWeight:'900' },
  abha: { color:'rgba(255,255,255,.6)', fontSize:11, marginTop:2 },
  avatar: { width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,.2)', alignItems:'center', justifyContent:'center' },
  content: { padding:16 },
  healthCard: { borderRadius:20, padding:18, marginBottom:16 },
  cardLabel: { color:'rgba(255,255,255,.6)', fontSize:9, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, marginBottom:6 },
  cardName: { color:'#fff', fontSize:16, fontWeight:'900' },
  cardId: { color:'rgba(255,255,255,.6)', fontSize:11, marginTop:2 },
  vitalsRow: { flexDirection:'row', gap:20, marginTop:14 },
  vital: {},
  vitalLabel: { color:'rgba(255,255,255,.5)', fontSize:9 },
  vitalValue: { color:'#fff', fontSize:13, fontWeight:'800' },
  scoreCircle: { width:72, height:72, borderRadius:36, backgroundColor:'rgba(255,255,255,.15)', borderWidth:2, borderColor:'rgba(255,255,255,.3)', alignItems:'center', justifyContent:'center' },
  scoreNum: { color:'#fff', fontSize:20, fontWeight:'900' },
  scoreLabel: { color:'rgba(255,255,255,.6)', fontSize:8, textAlign:'center', lineHeight:12 },
  barcode: { marginTop:16, paddingTop:12, borderTopWidth:1, borderTopColor:'rgba(255,255,255,.15)', alignItems:'center' },
  alertCard: { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.red+'08', borderWidth:1, borderColor:COLORS.red+'30', borderRadius:14, padding:12, marginBottom:8 },
  alertTitle: { fontSize:12, fontWeight:'700' },
  alertMsg: { fontSize:11, color:COLORS.textSub, marginTop:2 },
  alertBadge: { borderRadius:100, paddingHorizontal:8, paddingVertical:3 },
  alertBadgeText: { fontSize:9, fontWeight:'800' },
  aiCard: { backgroundColor:'#fff', borderRadius:16, padding:14, borderWidth:1, borderColor:'#e9d5ff', marginBottom:4, shadowColor:'#7c3aed', shadowOpacity:.06, shadowRadius:8, elevation:2 },
  aiCenter: { fontSize:16, fontWeight:'900', color:COLORS.primary },
  aiBadge: { backgroundColor:'#ede9fe', borderRadius:100, paddingHorizontal:8, paddingVertical:3 },
  aiBadgeText: { fontSize:9, fontWeight:'700', color:'#7c3aed' },
  chip: { backgroundColor:'#f0fdf4', borderRadius:100, paddingHorizontal:10, paddingVertical:4, marginRight:6, borderWidth:1, borderColor:'#bbf7d0' },
  chipText: { fontSize:10, color:COLORS.green, fontWeight:'600' },
  bookBtn: { backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:12, alignItems:'center' },
  bookBtnText: { color:'#fff', fontWeight:'800', fontSize:14 },
  qaGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:4 },
  qaItem: { width:'30%', alignItems:'center', backgroundColor:'#fff', borderRadius:16, padding:14, borderWidth:1, borderColor:COLORS.border, shadowColor:'#000', shadowOpacity:.04, shadowRadius:4, elevation:1 },
  qaIcon: { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center', marginBottom:6 },
  qaLabel: { fontSize:10, color:COLORS.textSub, fontWeight:'600', textAlign:'center' },
  centerCard: { backgroundColor:'#fff', borderRadius:16, padding:14, marginRight:10, width:160, borderWidth:1, borderColor:COLORS.border, shadowColor:'#000', shadowOpacity:.04, shadowRadius:4, elevation:1 },
  centerName: { fontSize:12, fontWeight:'800', color:COLORS.text, flex:1 },
  crowdDot: { width:8, height:8, borderRadius:4 },
  typePill: { backgroundColor:'#dbeafe', borderRadius:100, paddingHorizontal:6, paddingVertical:2 },
  typeText: { fontSize:9, color:COLORS.primary, fontWeight:'700' },
  centerRow: { fontSize:11, color:COLORS.textSub, marginBottom:3 },
});
