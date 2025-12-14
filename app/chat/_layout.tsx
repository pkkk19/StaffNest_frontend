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
          headerTitle: 'Chat',
          // Android-specific header styling
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerTintColor: '#007AFF',
        }}
      />
    </Stack>
  );
}