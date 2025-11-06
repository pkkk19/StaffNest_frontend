import { Tabs } from 'expo-router';
import { Chrome as Home, Calendar, Clock, Users, MessageSquare, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const colors = theme === 'dark' 
    ? { background: '#1F2937', text: '#F9FAFB', inactive: '#6B7280' }
    : theme === 'colorblind'
    ? { background: '#FFFFFF', text: '#374151', inactive: '#9CA3AF' }
    : { background: '#FFFFFF', text: '#374151', inactive: '#9CA3AF' };

  // Different tab layouts for staff vs manager
  if (user?.role === 'staff') {
    return (
      <ProtectedRoute>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
              height: 80,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4,
            },
            tabBarActiveTintColor: '#2563EB',
            tabBarInactiveTintColor: colors.inactive,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ size, color }) => (
                <Home size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="rota"
            options={{
              title: 'My Rota',
              tabBarIcon: ({ size, color }) => (
                <Calendar size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="time"
            options={{
              title: 'Time',
              tabBarIcon: ({ size, color }) => (
                <Clock size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: 'Chat',
              tabBarIcon: ({ size, color }) => (
                <MessageSquare size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ size, color }) => (
                <Settings size={size} color={color} />
              ),
            }}
          />
          {/* Hide staff tab for staff users */}
          {/* <Tabs.Screen
            name="staff"
            options={{
              href: null,
            }}
          /> */}
        </Tabs>
      </ProtectedRoute>
    );
  }

  // Manager layout with all tabs
  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            height: 80,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: colors.inactive,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="rota"
          options={{
            title: 'Rota',
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="time"
          options={{
            title: 'Time',
            tabBarIcon: ({ size, color }) => (
              <Clock size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="staff"
          options={{
            title: 'Manage Staff',
            tabBarIcon: ({ size, color }) => (
              <Users size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ size, color }) => (
              <MessageSquare size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ size, color }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}