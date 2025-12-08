// app/rota/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function RotaLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers by default
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="my-shifts" 
        options={{
          headerShown: true,
          title: 'My Shifts',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="open-shifts" 
        options={{
          headerShown: true,
          title: 'Open Shifts',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="my-requests" 
        options={{
          headerShown: true,
          title: 'My Requests',
          headerBackTitle: 'Back',
        }}
      />
      {isAdmin && (
        <Stack.Screen 
          name="shift-requests" 
          options={{
            headerShown: true,
            title: 'Shift Requests',
            headerBackTitle: 'Back',
          }}
        />
      )}
    </Stack>
  );
}