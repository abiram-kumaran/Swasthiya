import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/lib/data';

/* ─── Card ─────────────────────────────────────────────── */
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>{children}</View>
  );
}

/* ─── Badge ─────────────────────────────────────────────── */
export function Badge({
  label, color = COLORS.primary, bg,
}: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg ?? color + '20', borderColor: color + '40' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/* ─── Button ─────────────────────────────────────────────── */
export function Button({
  label, onPress, color = COLORS.primary, outlined = false,
  loading = false, disabled = false, style, textStyle, icon,
}: {
  label: string; onPress: () => void; color?: string;
  outlined?: boolean; loading?: boolean; disabled?: boolean;
  style?: ViewStyle; textStyle?: TextStyle; icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        outlined
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color }
          : { backgroundColor: color },
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={outlined ? color : '#fff'} size="small" />
        : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {icon}
            <Text style={[styles.btnText, { color: outlined ? color : '#fff' }, textStyle]}>{label}</Text>
          </View>
        )
      }
    </TouchableOpacity>
  );
}

/* ─── GovHeader ─────────────────────────────────────────── */
export function GovHeader({
  title, subtitle, right,
}: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.govHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.govTitle}>{title}</Text>
        {subtitle && <Text style={styles.govSub}>{subtitle}</Text>}
      </View>
      {right}
    </LinearGradient>
  );
}

/* ─── StatusDot ─────────────────────────────────────────── */
export function StatusDot({ status }: { status: string }) {
  const color = status === 'critical' ? COLORS.red
    : status === 'warning' ? COLORS.orange
    : COLORS.green;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

/* ─── SectionTitle ───────────────────────────────────────── */
export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

/* ─── Divider ────────────────────────────────────────────── */
export function Divider() {
  return <View style={styles.divider} />;
}

/* ─── EmptyState ─────────────────────────────────────────── */
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{icon}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

/* ─── KPICard ────────────────────────────────────────────── */
export function KPICard({
  label, value, color = COLORS.primary, icon,
}: { label: string; value: string | number; color?: string; icon?: string }) {
  return (
    <Card style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      {icon && <Text style={styles.kpiIcon}>{icon}</Text>}
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  btn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 13, fontWeight: '700' },
  govHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
  },
  govTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  govSub: { color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSub,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 6,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 13, color: COLORS.textSub, textAlign: 'center' },
  kpiCard: { flex: 1, minWidth: 80 },
  kpiIcon: { fontSize: 20, marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '900' },
  kpiLabel: { fontSize: 10, color: COLORS.textSub, fontWeight: '600', marginTop: 2 },
});
