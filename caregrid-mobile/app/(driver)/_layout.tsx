import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

export default function DriverLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#60a5fa',
      tabBarInactiveTintColor: '#475569',
      tabBarStyle: {
        backgroundColor: '#0d1526',
        borderTopColor: 'rgba(255,255,255,.08)',
        height: 62, paddingBottom: 8,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tabs.Screen name="dispatch"  options={{ title:'Deliveries', tabBarIcon:({color,size})=><Ionicons name="cube"          size={size} color={color} /> }} />
      <Tabs.Screen name="navigate"  options={{ title:'Navigate',   tabBarIcon:({color,size})=><Ionicons name="navigate"       size={size} color={color} /> }} />
      <Tabs.Screen name="emergency" options={{ title:'Emergency',  tabBarIcon:({color,size})=><Ionicons name="warning"        size={size} color={color} /> }} />
      <Tabs.Screen name="profile"   options={{ title:'Profile',    tabBarIcon:({color,size})=><Ionicons name="person-circle"  size={size} color={color} /> }} />
    </Tabs>
  );
}
