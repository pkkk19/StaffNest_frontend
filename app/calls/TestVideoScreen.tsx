// Create a test file: app/calls/TestVideoScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform } from 'react-native';

export default function TestVideoScreen() {
  const [platform, setPlatform] = useState<string>('');
  
  useEffect(() => {
    // Check what platform we're on
    setPlatform(Platform.OS);
    
    // Try to dynamically import 100ms to see if it loads
    if (Platform.OS !== 'web') {
      import('@100mslive/react-native-hms')
        .then((HMS) => {
          console.log('✅ 100ms SDK loaded successfully:', Object.keys(HMS));
        })
        .catch((error) => {
          console.error('❌ Failed to load 100ms:', error.message);
        });
    }
  }, []);
  
  const testNativeModule = async () => {
    if (Platform.OS === 'web') {
      alert('100ms requires native modules - test on iOS/Android simulator');
      return;
    }
    
    try {
      const HMS = await import('@100mslive/react-native-hms');
      console.log('HMS SDK structure:', HMS);
      
      // Test if build() method exists
      if (HMS.HMSSDK && HMS.HMSSDK) {
        console.log('✅ HMSSDK.build() method exists');
        alert('✅ 100ms native module is available!');
      } else {
        console.log('❌ HMSSDK.build() not found');
        alert('❌ HMSSDK structure differs from expected');
      }
    } catch (error: any) {
      console.error('Native module test failed:', error);
      alert(`Failed: ${error.message}`);
    }
  };
  
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
        Platform: {platform}
      </Text>
      
      <Button 
        title="Test 100ms Native Module" 
        onPress={testNativeModule}
      />
      
      <View style={{ marginTop: 20 }}>
        <Text>Testing strategies:</Text>
        <Text>1. Run on iOS Simulator (npx expo run:ios)</Text>
        <Text>2. Run on Android Emulator (npx expo run:android)</Text>
        <Text>3. Check console logs for module loading</Text>
      </View>
    </View>
  );
}