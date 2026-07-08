import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, AI_ACTIONS, type AIAction } from '@/lib/data';

const SEV_COLOR: Record<string, string> = {
  critical: COLORS.red, warning: COLORS.orange, info: '#3b82f6',
};
const TYPE_ICON: Record<string, string> = {
  medicine:'cube', doctor:'person', disease:'fitness', footfall:'people', beds:'bed',
};

export default function AICommand() {
  const [processed, setProcessed] = useState<Record<string, 'approved'|'rejected'>>({});
  const pending = AI_ACTIONS.filter(a => !processed[a.id]);
  const allDone = pending.length === 0;

  const approve = (a: AIAction) => {
    setProcessed(p => ({ ...p, [a.id]: 'approved' }));
    Alert.alert('✅ Approved', `Action dispatched: ${a.recommendation}`);
  };
  const reject = (a: AIAction) => {
    setProcessed(p => ({ ...p, [a.id]: 'rejected' }));
  };

  return (
    <View style={{ flex:1, backgroundColor:COLORS.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="flash" size={20} color="#fff" />
        </View>
        <View style={{ flex:1 }}>
          <Text style={styles.headerTitle}>🧠 AI Command Center</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginTop:3 }}>
            <View style={styles.geminiBadge}><Text style={styles.geminiText}>Gemini 1.5 Pro</Text></View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>Auto-monitoring</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding:14 }} showsVerticalScrollIndicator={false}>
        {/* Intro Banner */}
        <View style={styles.introBanner}>
          <Text style={styles.introText}>
            AI is monitoring <Text style={{ fontWeight:'800', color:'#fff' }}>5 health centres</Text>,{' '}
            <Text style={{ fontWeight:'800', color:'#fff' }}>8 medicines</Text> and{' '}
            <Text style={{ fontWeight:'800', color:'#fff' }}>4 dispatch routes</Text>.{' '}
            {pending.length > 0
              ? <Text style={{ fontWeight:'800', color:'#fbbf24' }}>{pending.length} actions need your approval.</Text>
              : <Text style={{ fontWeight:'800', color:'#4ade80' }}>All actions processed ✓</Text>
            }
          </Text>
        </View>

        {/* Action Cards */}
        {pending.map(action => (
          <View key={action.id} style={[styles.card, { borderTopColor: SEV_COLOR[action.severity] }]}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <Ionicons name={TYPE_ICON[action.type] as any} size={14} color={SEV_COLOR[action.severity]} />
                <View style={[styles.phcBadge, { backgroundColor: SEV_COLOR[action.severity]+'15' }]}>
                  <Text style={[styles.phcText, { color: SEV_COLOR[action.severity] }]}>{action.phcName}</Text>
                </View>
                <View style={[styles.sevBadge, { backgroundColor: SEV_COLOR[action.severity]+'20' }]}>
                  <Text style={[styles.sevText, { color: SEV_COLOR[action.severity] }]}>{action.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.timeAgo}>{action.createdAt}</Text>
            </View>

            <Text style={styles.cardTitle}>{action.title}</Text>
            <Text style={styles.cardMsg}>{action.message}</Text>

            {/* AI Recommendation */}
            <View style={styles.recBox}>
              <Text style={styles.recLabel}>🤖 AI Recommendation</Text>
              <Text style={styles.recText}>{action.recommendation}</Text>
            </View>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => approve(action)} style={styles.approveBtn} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => reject(action)} style={styles.rejectBtn} activeOpacity={0.85}>
                <Ionicons name="close-circle-outline" size={16} color={COLORS.red} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Empty State */}
        {allDone && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.green} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>AI is monitoring for new issues. Check back soon.</Text>
          </View>
        )}

        <View style={{ height:20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', gap:12, paddingTop:52, paddingBottom:14, paddingHorizontal:16, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.border },
  headerIcon: { width:40, height:40, borderRadius:14, backgroundColor:'#7c3aed', alignItems:'center', justifyContent:'center' },
  headerTitle: { fontSize:15, fontWeight:'900', color:COLORS.text },
  geminiBadge: { backgroundColor:'#ede9fe', borderRadius:100, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:'#c4b5fd' },
  geminiText: { fontSize:9, color:'#7c3aed', fontWeight:'700' },
  pulseDot: { width:6, height:6, borderRadius:3, backgroundColor:'#22c55e' },
  pulseText: { fontSize:10, color:COLORS.textSub },
  introBanner: { backgroundColor:COLORS.primary, borderRadius:16, padding:14, marginBottom:14 },
  introText: { color:'rgba(255,255,255,.8)', fontSize:12, lineHeight:20 },
  card: { backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:12, borderWidth:1, borderColor:COLORS.border, borderTopWidth:4 },
  cardHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:6 },
  phcBadge: { borderRadius:100, paddingHorizontal:8, paddingVertical:3 },
  phcText: { fontSize:10, fontWeight:'700' },
  sevBadge: { borderRadius:100, paddingHorizontal:8, paddingVertical:3 },
  sevText: { fontSize:9, fontWeight:'800' },
  timeAgo: { fontSize:10, color:COLORS.textSub },
  cardTitle: { fontSize:14, fontWeight:'800', color:COLORS.text, marginBottom:6 },
  cardMsg: { fontSize:12, color:COLORS.textSub, lineHeight:18, marginBottom:12 },
  recBox: { backgroundColor:'#eff6ff', borderLeftWidth:3, borderLeftColor:COLORS.primary, borderRadius:10, padding:12, marginBottom:14 },
  recLabel: { fontSize:10, fontWeight:'800', color:COLORS.primary, marginBottom:5, textTransform:'uppercase', letterSpacing:.5 },
  recText: { fontSize:12, color:'#1e40af', lineHeight:18 },
  btnRow: { flexDirection:'row', gap:10 },
  approveBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, backgroundColor:COLORS.green, borderRadius:12, paddingVertical:12 },
  approveBtnText: { color:'#fff', fontWeight:'800', fontSize:13 },
  rejectBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, borderRadius:12, paddingVertical:12, borderWidth:1.5, borderColor:COLORS.red },
  rejectBtnText: { color:COLORS.red, fontWeight:'800', fontSize:13 },
  emptyState: { alignItems:'center', paddingVertical:48 },
  emptyIcon: { width:80, height:80, borderRadius:40, backgroundColor:COLORS.green+'15', alignItems:'center', justifyContent:'center', marginBottom:16 },
  emptyTitle: { fontSize:18, fontWeight:'900', color:COLORS.text },
  emptySub: { fontSize:13, color:COLORS.textSub, marginTop:6, textAlign:'center' },
});
