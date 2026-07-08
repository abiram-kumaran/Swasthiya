import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: { borderTopColor: '#e2e8f0', height: 62, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tabs.Screen name="overview"   options={{ title:'Overview',   tabBarIcon:({color,size})=><Ionicons name="grid"          size={size} color={color} /> }} />
      <Tabs.Screen name="analytics"  options={{ title:'Analytics',  tabBarIcon:({color,size})=><Ionicons name="bar-chart"     size={size} color={color} /> }} />
      <Tabs.Screen name="ai-command" options={{ title:'AI Command', tabBarIcon:({color,size})=><Ionicons name="flash"         size={size} color={color} />, tabBarBadge: 4 }} />
      <Tabs.Screen name="reports"    options={{ title:'Reports',    tabBarIcon:({color,size})=><Ionicons name="document-text" size={size} color={color} /> }} />
    </Tabs>
  );
}
