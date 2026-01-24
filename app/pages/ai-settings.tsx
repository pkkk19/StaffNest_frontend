// File: app/pages/ai-settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { 
  ArrowLeft, 
  Settings, 
  Bot, 
  Shield, 
  Database, 
  Clock,
  Trash2,
  HelpCircle,
  Bell,
  Globe
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAIChat } from '@/contexts/AIChatContext';
import { router } from 'expo-router';

export default function AISettingsPage() {
  const { theme } = useTheme();
  const { clearMessages, currentModel, availableModels } = useAIChat();
  const [dataCollection, setDataCollection] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  const styles = createStyles(theme);

  const handleClearChat = () => {
    Alert.alert(
      'Clear All Chat History',
      'This will permanently delete all your chat history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: () => {
            clearMessages();
            Alert.alert('Success', 'All chat history has been cleared.');
          }
        }
      ]
    );
  };

  const handleExportChat = () => {
    Alert.alert(
      'Export Chat History',
      'Your chat history will be exported as a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          Alert.alert('Info', 'Export feature coming soon!');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#111827' : '#FFFFFF'}
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Settings size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          <Text style={styles.headerTitle}>AI Assistant Settings</Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Model</Text>
          
          <View style={styles.modelCard}>
            <View style={styles.modelHeader}>
              <View style={styles.modelIcon}>
                <Bot size={20} color="#10B981" />
              </View>
              <View style={styles.modelInfo}>
                <Text style={styles.modelName}>{currentModel}</Text>
                <Text style={styles.modelDescription}>DeepSeek Chat Model</Text>
              </View>
            </View>
            
            <Text style={styles.modelStatus}>
              Status: <Text style={styles.modelStatusActive}>Active</Text>
            </Text>
            
            <View style={styles.availableModels}>
              <Text style={styles.availableModelsTitle}>Available Models:</Text>
              {availableModels.map((model, index) => (
                <View key={index} style={styles.modelItem}>
                  <View style={[
                    styles.modelDot,
                    model === currentModel && styles.modelDotActive
                  ]} />
                  <Text style={[
                    styles.modelItemText,
                    model === currentModel && styles.modelItemTextActive
                  ]}>
                    {model}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Shield size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Data Collection</Text>
                <Text style={styles.settingDescription}>
                  Allow anonymous usage data to improve AI responses
                </Text>
              </View>
            </View>
            <Switch
              value={dataCollection}
              onValueChange={setDataCollection}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Database size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto-save Conversations</Text>
                <Text style={styles.settingDescription}>
                  Automatically save all conversations
                </Text>
              </View>
            </View>
            <Switch
              value={autoSave}
              onValueChange={setAutoSave}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Bell size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications for AI responses
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Clock size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Typing Indicator</Text>
                <Text style={styles.settingDescription}>
                  Show "AI is typing" indicator
                </Text>
              </View>
            </View>
            <Switch
              value={typingIndicator}
              onValueChange={setTypingIndicator}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.exportButton]}
            onPress={handleExportChat}
          >
            <Database size={20} color="#2563EB" />
            <Text style={[styles.actionButtonText, styles.exportButtonText]}>
              Export Chat History
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearChat}
          >
            <Trash2 size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.clearButtonText]}>
              Clear All Chat History
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          
          <TouchableOpacity style={styles.helpItem}>
            <HelpCircle size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <View style={styles.helpText}>
              <Text style={styles.helpTitle}>Help Center</Text>
              <Text style={styles.helpDescription}>
                Get help with AI Assistant features
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.helpItem}>
            <Globe size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <View style={styles.helpText}>
              <Text style={styles.helpTitle}>Privacy Policy</Text>
              <Text style={styles.helpDescription}>
                Read our privacy policy
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            AI Assistant v1.0.0 • Powered by DeepSeek
          </Text>
          <Text style={styles.footerSubtext}>
            Last updated: January 2024
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    container: {
      flex: 1,
    },
    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    modelCard: {
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    modelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    modelIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#10B98120',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modelInfo: {
      flex: 1,
    },
    modelName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    modelDescription: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 2,
    },
    modelStatus: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
    },
    modelStatusActive: {
      color: '#10B981',
      fontWeight: '600',
    },
    availableModels: {
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
      paddingTop: 12,
    },
    availableModelsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#D1D5DB' : '#4B5563',
      marginBottom: 8,
    },
    modelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    modelDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
    },
    modelDotActive: {
      backgroundColor: '#10B981',
    },
    modelItemText: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    modelItemTextActive: {
      color: isDark ? '#10B981' : '#059669',
      fontWeight: '600',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    settingText: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    exportButton: {
      backgroundColor: isDark ? '#1E40AF20' : '#EFF6FF',
      borderWidth: 1,
      borderColor: isDark ? '#1E40AF' : '#3B82F6',
    },
    clearButton: {
      backgroundColor: isDark ? '#7F1D1D20' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? '#7F1D1D' : '#EF4444',
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
    },
    exportButtonText: {
      color: '#2563EB',
    },
    clearButtonText: {
      color: '#EF4444',
    },
    helpItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
    },
    helpText: {
      flex: 1,
    },
    helpTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    helpDescription: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    footer: {
      padding: 24,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    footerSubtext: {
      fontSize: 11,
      color: isDark ? '#6B7280' : '#9CA3AF',
      textAlign: 'center',
      marginTop: 4,
    },
  });
};