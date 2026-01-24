// app/chat/contacts/components/CustomHeader.tsx - ENHANCED VERSION
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

interface CustomHeaderProps {
  title?: string;
  onAddContact?: () => void;
  showBackButton?: boolean;
  rightButton?: React.ReactNode;
  pendingRequestsCount?: number;
  onNavigateToRequests?: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title = 'Contacts',
  onAddContact,
  showBackButton = true,
  rightButton,
  pendingRequestsCount = 0,
  onNavigateToRequests,
}) => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor="#fff" />
      <View style={styles.headerContainer}>
        {/* Left section */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color="#007AFF" 
              />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Right section */}
        <View style={styles.rightSection}>
          {pendingRequestsCount > 0 && onNavigateToRequests && (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={onNavigateToRequests}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="notifications" size={22} color="#007AFF" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          
          {rightButton || (
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddContact}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="person-add" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 60,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  addButton: {
    padding: 4,
  },
  notificationButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CustomHeader;