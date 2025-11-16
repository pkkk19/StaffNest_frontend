// app/chat/index.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function ChatIndex() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Chat' }} />
      <Text style={styles.text}>Select a conversation to start chatting</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});