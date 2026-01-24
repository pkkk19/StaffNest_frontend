// app/calls/_layout.tsx
import { Stack } from 'expo-router';

export default function CallsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="VideoCallScreen" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }} 
      />
    </Stack>
  );
}