import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

export default function PatientLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: { borderTopColor: '#e2e8f0', height: 62, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tabs.Screen name="home"    options={{ title:'Home',    tabBarIcon:({color,size})=><Ionicons name="home"           size={size} color={color} /> }} />
      <Tabs.Screen name="map"     options={{ title:'Map',     tabBarIcon:({color,size})=><Ionicons name="map"            size={size} color={color} /> }} />
      <Tabs.Screen name="chat"    options={{ title:'AI Chat', tabBarIcon:({color,size})=><Ionicons name="chatbubble-ellipses" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title:'Profile', tabBarIcon:({color,size})=><Ionicons name="person"         size={size} color={color} /> }} />
    </Tabs>
  );
}
