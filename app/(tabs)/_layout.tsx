// app/_layout.tsx (TabLayout)
import { Tabs } from 'expo-router';
import { 
  Home as HomeIcon, 
  Calendar, 
  MessageSquare, 
  Users, 
  MoreVertical, 
  Clock
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Keep navbar white/light for both themes
  const colors = theme === 'dark' 
    ? { 
        background: '#111827', // Dark background for navbar
        text: '#F9FAFB', // Light text for dark mode
        inactive: '#9CA3AF', // Light grey for inactive
        border: '#374151', // Dark border
        activeIcon: '#3B82F6', // Blue for active
        inactiveIcon: '#D1D5DB' // Light grey for inactive icons
      }
    : { 
        background: '#FFFFFF', // White background for navbar
        text: '#111827', // Dark text for light mode
        inactive: '#6B7280', // Darker grey for inactive
        border: '#E5E7EB', // Light border
        activeIcon: '#2563EB', // Blue for active
        inactiveIcon: '#6B7280' // Dark grey for inactive icons
      };

  // Common tab bar options
  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      height: 80,
      paddingBottom: 8,
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as '500', // Fixed: Type assertion
      marginTop: 4,
      color: colors.text,
    },
    tabBarActiveTintColor: colors.activeIcon,
    tabBarInactiveTintColor: colors.inactiveIcon,
  };

  // Staff layout
  if (user?.role === 'staff') {
    return (
      <ProtectedRoute>
        <Tabs screenOptions={screenOptions}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ size, color, focused }) => (
                <HomeIcon size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="time"
            options={{
              title: 'Clock In',
              tabBarIcon: ({ size, color, focused }) => (
                <Clock size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: 'Messenger',
              tabBarIcon: ({ size, color, focused }) => (
                <MessageSquare size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="more"
            options={{
              title: 'More',
              tabBarIcon: ({ size, color, focused }) => (
                <MoreVertical size={size} color={color} />
              ),
            }}
          />
          
          {/* Hidden tabs */}
          <Tabs.Screen
            name="settings"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="rota"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="staff"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </ProtectedRoute>
    );
  }

  // Admin/Manager layout
  return (
    <ProtectedRoute>
      <Tabs screenOptions={screenOptions}>
        
        {/* Tab 1: Home */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ size, color, focused }) => (
              <HomeIcon size={size} color={color} />
            ),
          }}
        />
        
        {/* Tab 2: Clock In */}
        <Tabs.Screen
          name="time"
          options={{
            title: 'Clock In',
            tabBarIcon: ({ size, color, focused }) => (
              <Clock size={size} color={color} />
            ),
          }}
        />
        
        {/* Tab 3: Messenger */}
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Messenger',
            tabBarIcon: ({ size, color, focused }) => (
              <MessageSquare size={size} color={color} />
            ),
          }}
        />
        
        {/* Tab 4: Manage Staff */}
        <Tabs.Screen
          name="staff"
          options={{
            title: 'Manage Staff',
            tabBarIcon: ({ size, color, focused }) => (
              <Users size={size} color={color} />
            ),
          }}
        />
        
        {/* Tab 5: More */}
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ size, color, focused }) => (
              <MoreVertical size={size} color={color} />
            ),
          }}
        />
        
        {/* Hidden screens - accessible from More tab */}
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="rota"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="rota/my-shifts"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="rota/open-shifts"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="rota/shift-requests"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}