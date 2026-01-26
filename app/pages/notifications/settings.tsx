import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { 
  Bell, 
  ChevronLeft, 
  Calendar,
  MessageSquare,
  Phone,
  FileText,
  Shield,
  Volume2,
  Vibrate,
  Zap,
  Moon,
  Clock,
  Check,
  X,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { notificationSettingsService, NotificationSettings, NotificationPreferences } from '@/services/notificationSettingService';

const REMINDER_MINUTE_OPTIONS = [
  { label: 'At shift start', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '10 minutes before', value: 10 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '4 hours before', value: 240 },
  { label: '1 day before', value: 1440 },
];

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const [tempStartTime, setTempStartTime] = useState('22:00');
  const [tempEndTime, setTempEndTime] = useState('07:00');

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
  try {
    setLoading(true);
    const data = await notificationSettingsService.getSettings();
    setSettings(data);
    
    // Add null checks
    if (data?.preferences?.quietHours) {
      setTempStartTime(data.preferences.quietHours.startTime || '22:00');
      setTempEndTime(data.preferences.quietHours.endTime || '07:00');
    } else {
      // Set default values
      setTempStartTime('22:00');
      setTempEndTime('07:00');
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    Alert.alert('Error', 'Failed to load notification settings');
  } finally {
    setLoading(false);
  }
};

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleToggle = async (settingPath: string, value: boolean) => {
    if (!settings) return;

    try {
      setSaving(true);
      
      // Update local state immediately for better UX
      const updatedSettings = { ...settings };
      const pathParts = settingPath.split('.');
      let current: any = updatedSettings.preferences;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      
      setSettings(updatedSettings);
      
      // Save to backend
      await notificationSettingsService.toggleSetting(settingPath, value);
      
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to update setting');
      // Reload original settings
      loadSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleReminderMinutesChange = async (minutes: number) => {
    if (!settings) return;

    try {
      setSaving(true);
      const currentMinutes = [...settings.preferences.shiftReminderMinutes];
      const newMinutes = currentMinutes.includes(minutes)
        ? currentMinutes.filter(m => m !== minutes)
        : [...currentMinutes, minutes].sort((a, b) => a - b);

      const updatedSettings = await notificationSettingsService.updateShiftReminderMinutes(newMinutes);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update reminder minutes:', error);
      Alert.alert('Error', 'Failed to update reminder minutes');
    } finally {
      setSaving(false);
    }
  };

  const handleQuietHoursToggle = async (dayIndex: number) => {
    if (!settings) return;

    try {
      setSaving(true);
      const currentDays = [...settings.preferences.quietHours.days];
      const newDays = currentDays.includes(dayIndex)
        ? currentDays.filter(d => d !== dayIndex)
        : [...currentDays, dayIndex].sort((a, b) => a - b);

      const updatedSettings = await notificationSettingsService.updateSettings({
        quietHours: {
          ...settings.preferences.quietHours,
          days: newDays
        }
      });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update quiet hours:', error);
      Alert.alert('Error', 'Failed to update quiet hours');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (type: 'start' | 'end', time: string) => {
    if (!settings) return;

    try {
      setSaving(true);
      const updatedSettings = await notificationSettingsService.updateSettings({
        quietHours: {
          ...settings.preferences.quietHours,
          [type === 'start' ? 'startTime' : 'endTime']: time
        }
      });
      setSettings(updatedSettings);
      if (type === 'start') setTempStartTime(time);
      else setTempEndTime(time);
    } catch (error) {
      console.error('Failed to update time:', error);
      Alert.alert('Error', 'Failed to update time');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all notification settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const updatedSettings = await notificationSettingsService.resetToDefaults();
              setSettings(updatedSettings);
              setTempStartTime(updatedSettings.preferences.quietHours.startTime);
              setTempEndTime(updatedSettings.preferences.quietHours.endTime);
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              console.error('Failed to reset settings:', error);
              Alert.alert('Error', 'Failed to reset settings');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const SettingToggle = ({ 
    icon: Icon, 
    title, 
    description, 
    value, 
    onToggle,
    settingPath 
  }: {
    icon: any;
    title: string;
    description?: string;
    value: boolean;
    onToggle: (path: string, value: boolean) => void;
    settingPath: string;
  }) => (
    <View style={styles.settingToggle}>
      <Icon size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => onToggle(settingPath, newValue)}
        trackColor={{ false: '#767577', true: '#2563EB' }}
        thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
        disabled={saving}
      />
    </View>
  );

  const ReminderTimeOption = ({ label, value }: { label: string; value: number }) => {
    const isSelected = settings?.preferences.shiftReminderMinutes.includes(value);
    
    return (
      <TouchableOpacity
        style={[
          styles.reminderOption,
          isSelected && styles.reminderOptionSelected,
          { borderColor: isDark ? '#374151' : '#E5E7EB' }
        ]}
        onPress={() => handleReminderMinutesChange(value)}
        disabled={saving}
      >
        <Text style={[
          styles.reminderOptionText,
          isSelected && styles.reminderOptionTextSelected
        ]}>
          {label}
        </Text>
        {isSelected && <Check size={16} color="#2563EB" />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load settings</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#111827' : '#F9FAFB'}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={isDark ? '#F9FAFB' : '#111827'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetToDefaults}
          disabled={saving}
        >
          <RefreshCw size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* General Settings */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('general')}
          >
            <Bell size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.sectionHeaderTitle}>General</Text>
            {expandedSection === 'general' ? 
              <ChevronUp size={20} color={isDark ? '#9CA3AF' : '#6B7280'} /> :
              <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            }
          </TouchableOpacity>
          
          {expandedSection === 'general' && (
            <View style={styles.sectionContent}>
              <SettingToggle
                icon={Bell}
                title="Push Notifications"
                description="Receive push notifications"
                value={settings.preferences.pushNotifications}
                onToggle={handleToggle}
                settingPath="pushNotifications"
              />
              
              <SettingToggle
                icon={Volume2}
                title="Notification Sound"
                value={settings.preferences.notificationSound}
                onToggle={handleToggle}
                settingPath="notificationSound"
              />
              
              <SettingToggle
                icon={Vibrate}
                title="Vibration"
                value={settings.preferences.vibration}
                onToggle={handleToggle}
                settingPath="vibration"
              />
              
              <SettingToggle
                icon={Zap}
                title="LED Light"
                value={settings.preferences.ledLight}
                onToggle={handleToggle}
                settingPath="ledLight"
              />
              
              <SettingToggle
                icon={Shield}
                title="Badge Count"
                description="Show unread count on app icon"
                value={settings.preferences.badgeCount}
                onToggle={handleToggle}
                settingPath="badgeCount"
              />
            </View>
          )}
        </View>

        {/* Shift Reminders */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('shifts')}
          >
            <Calendar size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.sectionHeaderTitle}>Shift Reminders</Text>
            {expandedSection === 'shifts' ? 
              <ChevronUp size={20} color={isDark ? '#9CA3AF' : '#6B7280'} /> :
              <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            }
          </TouchableOpacity>
          
          {expandedSection === 'shifts' && (
            <View style={styles.sectionContent}>
              <SettingToggle
                icon={Bell}
                title="Shift Reminders"
                description="Get reminded about upcoming shifts"
                value={settings.preferences.shiftReminders}
                onToggle={handleToggle}
                settingPath="shiftReminders"
              />
              
              <Text style={styles.subSectionTitle}>Remind me before shift:</Text>
              <View style={styles.reminderOptions}>
                {REMINDER_MINUTE_OPTIONS.map((option) => (
                  <ReminderTimeOption key={option.value} {...option} />
                ))}
              </View>
              
              <SettingToggle
                icon={Calendar}
                title="Shift Assigned"
                description="When assigned to a new shift"
                value={settings.preferences.shiftAssigned}
                onToggle={handleToggle}
                settingPath="shiftAssigned"
              />
              
              <SettingToggle
                icon={Calendar}
                title="Shift Updated"
                description="When shift details change"
                value={settings.preferences.shiftUpdated}
                onToggle={handleToggle}
                settingPath="shiftUpdated"
              />
              
              <SettingToggle
                icon={Calendar}
                title="Shift Cancelled"
                description="When a shift is cancelled"
                value={settings.preferences.shiftCancelled}
                onToggle={handleToggle}
                settingPath="shiftCancelled"
              />
            </View>
          )}
        </View>

        {/* Messages */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('messages')}
          >
            <MessageSquare size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.sectionHeaderTitle}>Messages</Text>
            {expandedSection === 'messages' ? 
              <ChevronUp size={20} color={isDark ? '#9CA3AF' : '#6B7280'} /> :
              <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            }
          </TouchableOpacity>
          
          {expandedSection === 'messages' && (
            <View style={styles.sectionContent}>
              <SettingToggle
                icon={MessageSquare}
                title="New Messages"
                description="When you receive a new message"
                value={settings.preferences.newMessages}
                onToggle={handleToggle}
                settingPath="newMessages"
              />
              
              <SettingToggle
                icon={Volume2}
                title="Message Sound"
                value={settings.preferences.messageSound}
                onToggle={handleToggle}
                settingPath="messageSound"
              />
              
              <SettingToggle
                icon={Vibrate}
                title="Message Vibration"
                value={settings.preferences.messageVibration}
                onToggle={handleToggle}
                settingPath="messageVibration"
              />
            </View>
          )}
        </View>

        {/* Calls */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('calls')}
          >
            <Phone size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.sectionHeaderTitle}>Calls</Text>
            {expandedSection === 'calls' ? 
              <ChevronUp size={20} color={isDark ? '#9CA3AF' : '#6B7280'} /> :
              <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            }
          </TouchableOpacity>
          
          {expandedSection === 'calls' && (
            <View style={styles.sectionContent}>
              <SettingToggle
                icon={Phone}
                title="Incoming Calls"
                description="When someone calls you"
                value={settings.preferences.incomingCalls}
                onToggle={handleToggle}
                settingPath="incomingCalls"
              />
              
              <SettingToggle
                icon={Volume2}
                title="Call Sound"
                value={settings.preferences.callSound}
                onToggle={handleToggle}
                settingPath="callSound"
              />
              
              <SettingToggle
                icon={Vibrate}
                title="Call Vibration"
                value={settings.preferences.callVibration}
                onToggle={handleToggle}
                settingPath="callVibration"
              />
            </View>
          )}
        </View>

        {/* System */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('system')}
          >
            <Shield size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.sectionHeaderTitle}>System Notifications</Text>
            {expandedSection === 'system' ? 
              <ChevronUp size={20} color={isDark ? '#9CA3AF' : '#6B7280'} /> :
              <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            }
          </TouchableOpacity>
          
          {expandedSection === 'system' && (
            <View style={styles.sectionContent}>
              <SettingToggle
                icon={FileText}
                title="New Payslip"
                description="When a new payslip is generated"
                value={settings.preferences.newPayslip}
                onToggle={handleToggle}
                settingPath="newPayslip"
              />
            </View>
          )}
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('quiet')}
          >
            <Moon size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.sectionHeaderTitle}>Quiet Hours</Text>
            {expandedSection === 'quiet' ? 
              <ChevronUp size={20} color={isDark ? '#9CA3AF' : '#6B7280'} /> :
              <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            }
          </TouchableOpacity>
          
          {expandedSection === 'quiet' && (
            <View style={styles.sectionContent}>
              <SettingToggle
                icon={Moon}
                title="Enable Quiet Hours"
                description="Silence notifications during specific hours"
                value={settings.preferences.quietHours.enabled}
                onToggle={handleToggle}
                settingPath="quietHours.enabled"
              />
              
              {settings.preferences.quietHours.enabled && (
                <>
                  <View style={styles.timeSelector}>
                    <View style={styles.timeOption}>
                      <Text style={styles.timeLabel}>From</Text>
                      <TouchableOpacity 
                        style={styles.timeButton}
                        onPress={() => setShowTimePicker('start')}
                      >
                        <Clock size={16} color="#2563EB" />
                        <Text style={styles.timeText}>{settings.preferences.quietHours.startTime}</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.timeOption}>
                      <Text style={styles.timeLabel}>To</Text>
                      <TouchableOpacity 
                        style={styles.timeButton}
                        onPress={() => setShowTimePicker('end')}
                      >
                        <Clock size={16} color="#2563EB" />
                        <Text style={styles.timeText}>{settings.preferences.quietHours.endTime}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.subSectionTitle}>Days:</Text>
                  <View style={styles.daysGrid}>
                    {DAYS_OF_WEEK.map((day) => (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.dayButton,
                          settings.preferences.quietHours.days.includes(day.value) && styles.dayButtonSelected,
                          { borderColor: isDark ? '#374151' : '#E5E7EB' }
                        ]}
                        onPress={() => handleQuietHoursToggle(day.value)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          settings.preferences.quietHours.days.includes(day.value) && styles.dayButtonTextSelected
                        ]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                Set {showTimePicker === 'start' ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity onPress={() => setShowTimePicker(null)}>
                <X size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerContainer}>
              <TextInput
                style={[styles.timeInput, { 
                  color: isDark ? '#F9FAFB' : '#111827',
                  borderColor: isDark ? '#4B5563' : '#E5E7EB'
                }]}
                value={showTimePicker === 'start' ? tempStartTime : tempEndTime}
                onChangeText={(text) => {
                  if (showTimePicker === 'start') setTempStartTime(text);
                  else setTempEndTime(text);
                }}
                placeholder="HH:MM"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="numbers-and-punctuation"
              />
              
              <Text style={[styles.timeFormatHint, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Format: HH:MM (24-hour)
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTimePicker(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  if (showTimePicker) {
                    handleTimeChange(showTimePicker, showTimePicker === 'start' ? tempStartTime : tempEndTime);
                    setShowTimePicker(null);
                  }
                }}
              >
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    resetButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingVertical: 20,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 12,
      marginHorizontal: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      gap: 12,
    },
    sectionHeaderTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    sectionContent: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#F3F4F6',
    },
    settingToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      gap: 12,
    },
    toggleContent: {
      flex: 1,
    },
    toggleTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    toggleDescription: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    subSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 16,
      marginBottom: 12,
    },
    reminderOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    reminderOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    reminderOptionSelected: {
      backgroundColor: isDark ? '#1E40AF' : '#DBEAFE',
      borderColor: '#2563EB',
    },
    reminderOptionText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    reminderOptionTextSelected: {
      color: '#2563EB',
      fontWeight: '600',
    },
    timeSelector: {
      flexDirection: 'row',
      gap: 16,
      marginVertical: 16,
    },
    timeOption: {
      flex: 1,
    },
    timeLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
    },
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
    },
    timeText: {
      fontSize: 15,
      color: isDark ? '#F9FAFB' : '#111827',
      fontWeight: '500',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dayButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayButtonSelected: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    dayButtonText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontWeight: '500',
    },
    dayButtonTextSelected: {
      color: '#FFFFFF',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 20,
      padding: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    timePickerContainer: {
      marginBottom: 24,
    },
    timeInput: {
      fontSize: 48,
      fontWeight: '700',
      textAlign: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 8,
    },
    timeFormatHint: {
      fontSize: 14,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
    },
    cancelButton: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    saveButton: {
      backgroundColor: '#2563EB',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}