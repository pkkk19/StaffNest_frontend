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
        background: '#FFFFFF', // White background for navbar
        text: '#374151', // Dark grey for text
        inactive: '#9CA3AF' // Light grey for inactive
      }
    : { 
        background: '#FFFFFF', // White background for navbar
        text: '#374151', // Dark grey for text
        inactive: '#9CA3AF' // Light grey for inactive
      };

  // Staff layout
  if (user?.role === 'staff') {
    return (
      <ProtectedRoute>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB', // Light grey border
              height: 80,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4,
              color: '#000000', // Black text for labels
            },
            tabBarActiveTintColor: '#2563EB', // Blue for active icon
            tabBarInactiveTintColor: '#000000', // Black for inactive icons
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ size, color, focused }) => (
                <HomeIcon size={size} color={focused ? '#2563EB' : '#000000'} />
              ),
            }}
          />
          <Tabs.Screen
            name="time"
            options={{
              title: 'Clock In',
              tabBarIcon: ({ size, color, focused }) => (
                <Clock size={size} color={focused ? '#2563EB' : '#000000'} />
              ),
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: 'Messenger',
              tabBarIcon: ({ size, color, focused }) => (
                <MessageSquare size={size} color={focused ? '#2563EB' : '#000000'} />
              ),
            }}
          />
          <Tabs.Screen
            name="more"
            options={{
              title: 'More',
              tabBarIcon: ({ size, color, focused }) => (
                <MoreVertical size={size} color={focused ? '#2563EB' : '#000000'} />
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
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: 80,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
            color: '#000000', // Black text for labels
          },
          tabBarActiveTintColor: '#2563EB', // Blue for active icon
          tabBarInactiveTintColor: '#000000', // Black for inactive icons
        }}>
        
        {/* Tab 1: Home */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ size, color, focused }) => (
              <HomeIcon size={size} color={focused ? '#2563EB' : '#000000'} />
            ),
          }}
        />
        
        {/* Tab 2: Clock In */}
        <Tabs.Screen
          name="time"
          options={{
            title: 'Clock In',
            tabBarIcon: ({ size, color, focused }) => (
              <Clock size={size} color={focused ? '#2563EB' : '#000000'} />
            ),
          }}
        />
        
        {/* Tab 3: Messenger */}
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Messenger',
            tabBarIcon: ({ size, color, focused }) => (
              <MessageSquare size={size} color={focused ? '#2563EB' : '#000000'} />
            ),
          }}
        />
        
        {/* Tab 4: Manage Staff */}
        <Tabs.Screen
          name="staff"
          options={{
            title: 'Manage Staff',
            tabBarIcon: ({ size, color, focused }) => (
              <Users size={size} color={focused ? '#2563EB' : '#000000'} />
            ),
          }}
        />
        
        {/* Tab 5: More */}
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ size, color, focused }) => (
              <MoreVertical size={size} color={focused ? '#2563EB' : '#000000'} />
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