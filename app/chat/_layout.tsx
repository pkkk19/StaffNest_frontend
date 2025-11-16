// app/chat/_layout.tsx
import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: '600',
        },
        // This ensures header works on Android
        headerShadowVisible: true,
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
          headerShown: true,
          title: 'Contacts',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="[conversationId]" 
        options={{ 
          headerShown: true,
          title: 'Chat',
          // Enable back button
          headerBackVisible: true,
        }} 
      />
    </Stack>
  );
}