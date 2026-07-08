import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, DISPATCH, type DispatchRoute } from '@/lib/data';

const PRIO_BORDER: Record<string, string> = {
  emergency: COLORS.red, urgent: COLORS.orange, normal: '#3b82f6',
};

const STATUS_STYLE: Record<string, { label:string; color:string; bg:string }> = {
  pending:    { label:'Pending',    color:'#60a5fa', bg:'rgba(96,165,250,.15)'  },
  in_transit: { label:'In Transit', color:'#fbbf24', bg:'rgba(251,191,36,.15)'  },
  delivered:  { label:'Delivered',  color:'#4ade80', bg:'rgba(74,222,128,.15)'  },
};

function RouteProgress({ status }: { status: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = status === 'pending' ? 0 : status === 'in_transit' ? 0.55 : 1;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 1200, useNativeDriver: false }).start();
  }, [pct]);

  const barColor = status === 'delivered' ? '#4ade80' : status === 'in_transit' ? '#fbbf24' : '#3b82f6';

  return (
    <View style={styles.routeTrack}>
      {/* Labels */}
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
        <Text style={styles.routeLabel}>Pickup</Text>
        <Text style={styles.routeLabel}>Delivery</Text>
      </View>
      {/* Track */}
      <View style={styles.trackBg}>
        <Animated.View style={[styles.trackFill, {
          width: anim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
          backgroundColor: barColor,
        }]} />
        {/* Truck icon */}
        {status === 'in_transit' && (
          <Animated.View style={[styles.truckIcon, {
            left: anim.interpolate({ inputRange:[0,1], outputRange:['0%','88%'] }),
          }]}>
            <Ionicons name="car" size={14} color="#0d1526" />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function RouteCard({
  route, onConfirmPickup, onConfirmDelivery,
}: {
  route: DispatchRoute;
  onConfirmPickup: (id: string) => void;
  onConfirmDelivery: (id: string) => void;
}) {
  const ss = STATUS_STYLE[route.status];
  const borderColor = PRIO_BORDER[route.priority];

  return (
    <View style={[styles.card, { borderTopColor: borderColor }]}>
      {/* Top row */}
      <View style={{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, flex:1 }}>
          <View style={styles.payloadIcon}>
            <Ionicons name="cube" size={20} color="#60a5fa" />
          </View>
          <View style={{ flex:1 }}>
            <Text style={styles.payload}>{route.payload}</Text>
            <Text style={styles.payloadQty}>{route.payloadQty.toLocaleString()} units</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
          <Text style={[styles.statusText, { color: ss.color }]}>{ss.label}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={{ flexDirection:'row', alignItems:'center', marginBottom:12 }}>
        <View style={styles.centerBox}>
          <View style={styles.dotBlue} />
          <Text style={styles.centerName}>{route.fromCenter}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#475569" style={{ marginHorizontal:8 }} />
        <View style={styles.centerBox}>
          <View style={[styles.dotBlue, { backgroundColor: route.status === 'delivered' ? '#4ade80' : '#475569' }]} />
          <Text style={styles.centerName}>{route.toCenter}</Text>
        </View>
      </View>

      {/* Progress */}
      {route.status !== 'delivered' && <RouteProgress status={route.status} />}

      {/* Meta */}
      <View style={{ flexDirection:'row', gap:16, marginBottom:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
          <Ionicons name="time-outline" size={12} color="#475569" />
          <Text style={styles.metaText}>ETA: {route.eta}</Text>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
          <Ionicons name="flag-outline" size={12} color={PRIO_BORDER[route.priority]} />
          <Text style={[styles.metaText, { color: PRIO_BORDER[route.priority] }]}>{route.priority}</Text>
        </View>
      </View>

      {/* Action buttons */}
      {route.status === 'pending' && (
        <TouchableOpacity
          onPress={() => onConfirmPickup(route.id)}
          style={[styles.actionBtn, { backgroundColor:'#3b82f6' }]}
          activeOpacity={0.85}
        >
          <Ionicons name="cube-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Confirm Pickup</Text>
        </TouchableOpacity>
      )}
      {route.status === 'in_transit' && (
        <TouchableOpacity
          onPress={() => onConfirmDelivery(route.id)}
          style={[styles.actionBtn, { backgroundColor:'#16a34a' }]}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Confirm Delivery</Text>
        </TouchableOpacity>
      )}
      {route.status === 'delivered' && (
        <View style={[styles.actionBtn, { backgroundColor:'rgba(74,222,128,.12)', borderWidth:1, borderColor:'rgba(74,222,128,.3)' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
          <Text style={[styles.actionBtnText, { color:'#4ade80' }]}>Delivered ✓</Text>
        </View>
      )}
    </View>
  );
}

export default function DriverDispatch() {
  const [routes, setRoutes] = useState(DISPATCH);

  const confirmPickup = (id: string) => {
    setRoutes(p => p.map(r => r.id === id ? { ...r, status: 'in_transit' as const } : r));
    Alert.alert('✅ Pickup Confirmed', 'Status updated to In Transit. Navigation started.');
  };

  const confirmDelivery = (id: string) => {
    setRoutes(p => p.map(r => r.id === id ? { ...r, status: 'delivered' as const } : r));
    Alert.alert('🎉 Delivery Confirmed!', 'Inventory at destination updated. Great work!');
  };

  const active    = routes.filter(r => r.status !== 'delivered').length;
  const delivered = routes.filter(r => r.status === 'delivered').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex:1 }}>
          <Text style={styles.headerTitle}>Dispatch</Text>
          <Text style={styles.headerSub}>Driver: Ravi Kumar · CareGrid Network</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label:'Active',          value:active,    color:'#60a5fa', icon:'cube'         },
          { label:'Delivered Today', value:delivered, color:'#4ade80', icon:'checkmark-circle' },
          { label:'Dist. Today',     value:'47 km',   color:'#fbbf24', icon:'speedometer'  },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon as any} size={16} color={s.color} style={{ marginBottom:4 }} />
            <Text style={[styles.statValue, { color:s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding:14, paddingBottom:24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Active Routes ({routes.length})</Text>
        {routes.map(r => (
          <RouteCard
            key={r.id}
            route={r}
            onConfirmPickup={confirmPickup}
            onConfirmDelivery={confirmDelivery}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080d1a' },
  header: { paddingTop:56, paddingBottom:16, paddingHorizontal:16, flexDirection:'row', alignItems:'center', borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,.06)' },
  headerTitle: { color:'#fff', fontSize:20, fontWeight:'900' },
  headerSub: { color:'#475569', fontSize:11, marginTop:2 },
  onlineBadge: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(74,222,128,.1)', borderRadius:100, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:'rgba(74,222,128,.25)' },
  onlineDot: { width:6, height:6, borderRadius:3, backgroundColor:'#4ade80' },
  onlineText: { color:'#4ade80', fontSize:10, fontWeight:'800', letterSpacing:.5 },
  statsRow: { flexDirection:'row', padding:14, gap:10, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,.06)' },
  statCard: { flex:1, backgroundColor:'rgba(255,255,255,.05)', borderRadius:14, padding:12, alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,.08)' },
  statValue: { fontSize:20, fontWeight:'900' },
  statLabel: { fontSize:9, color:'#475569', marginTop:2, textAlign:'center' },
  sectionLabel: { fontSize:10, fontWeight:'700', color:'#475569', textTransform:'uppercase', letterSpacing:.8, marginBottom:12 },
  card: { backgroundColor:'#0d1526', borderRadius:20, padding:16, marginBottom:14, borderWidth:1, borderColor:'rgba(255,255,255,.08)', borderTopWidth:4 },
  payloadIcon: { width:44, height:44, borderRadius:14, backgroundColor:'rgba(96,165,250,.12)', alignItems:'center', justifyContent:'center' },
  payload: { color:'#fff', fontSize:15, fontWeight:'800', lineHeight:20 },
  payloadQty: { color:'#60a5fa', fontSize:12, fontWeight:'600', marginTop:2 },
  statusBadge: { borderRadius:100, paddingHorizontal:10, paddingVertical:4, alignSelf:'flex-start' },
  statusText: { fontSize:10, fontWeight:'700' },
  centerBox: { flex:1, flexDirection:'row', alignItems:'center', gap:6 },
  dotBlue: { width:8, height:8, borderRadius:4, backgroundColor:'#3b82f6' },
  centerName: { color:'#cbd5e1', fontSize:12, fontWeight:'600', flex:1 },
  routeTrack: { marginBottom:10 },
  routeLabel: { fontSize:10, color:'#475569' },
  trackBg: { height:6, backgroundColor:'rgba(255,255,255,.1)', borderRadius:3, overflow:'visible', position:'relative' },
  trackFill: { height:6, borderRadius:3, position:'absolute', top:0, left:0 },
  truckIcon: { position:'absolute', top:-10, width:24, height:24, borderRadius:12, backgroundColor:'#fbbf24', alignItems:'center', justifyContent:'center' },
  metaText: { fontSize:11, color:'#475569', fontWeight:'600' },
  actionBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderRadius:16, paddingVertical:15, marginTop:4 },
  actionBtnText: { color:'#fff', fontSize:15, fontWeight:'900' },
});
