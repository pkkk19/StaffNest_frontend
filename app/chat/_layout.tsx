// app/chat/_layout.tsx - FIXED
import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide header since we have custom header
        // Important for Android
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="contacts" 
        options={{ 
          headerShown: false,
          title: 'Contacts'
        }} 
      />
      <Stack.Screen
        name="[conversationId]"
        options={{
          headerShown: false, // Custom header in component
          // Android-specific options
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
    </Stack>
  );
}