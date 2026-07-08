import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

export default function StaffLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.green,
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: { borderTopColor: '#e2e8f0', height: 62, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tabs.Screen name="dashboard" options={{ title:'Dashboard', tabBarIcon:({color,size})=><Ionicons name="grid"     size={size} color={color} /> }} />
      <Tabs.Screen name="patients"  options={{ title:'Patients',  tabBarIcon:({color,size})=><Ionicons name="people"   size={size} color={color} /> }} />
      <Tabs.Screen name="inventory" options={{ title:'Inventory', tabBarIcon:({color,size})=><Ionicons name="cube"     size={size} color={color} /> }} />
      <Tabs.Screen name="tasks"     options={{ title:'Tasks',     tabBarIcon:({color,size})=><Ionicons name="checkbox" size={size} color={color} /> }} />
    </Tabs>
  );
}
