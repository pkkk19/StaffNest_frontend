import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Alert, 
  Modal, 
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { TabType } from '../hooks/useContacts';
import { 
  Friend, 
  FriendRequest, 
  SearchedUser, 
  contactsService,
  VerifiedContact 
} from '@/services/contactsService';
import { Ionicons } from '@expo/vector-icons';
import FriendsList from './FriendsList';
import RequestsList from './RequestsList';
import AddFriendsTab from './AddFriendsTab';
import * as Contacts from 'expo-contacts';

interface ContactsTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  friends: Friend[];
  pendingRequests: FriendRequest[];
  searchResults: SearchedUser[];
  searchQuery: string;
  loading: boolean;
  refreshing: boolean;
  searchLoading: boolean;
  onRefresh: () => void;
  handleSearch: (query: string) => void;
  onAddContact?: () => void;
  onRemoveFriend?: (friendId: string) => void;
  onRespondRequest?: (requestId: string, action: 'accepted' | 'rejected') => void;
  onSendRequest: (userId: string) => void;
  onNavigateToRequests?: () => void;
}

const ContactsTabs: React.FC<ContactsTabsProps> = ({
  activeTab,
  setActiveTab,
  friends,
  pendingRequests,
  searchResults,
  searchQuery,
  loading,
  refreshing,
  searchLoading,
  onRefresh,
  handleSearch,
  onAddContact,
  onRemoveFriend,
  onRespondRequest,
  onSendRequest,
  onNavigateToRequests,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedContacts, setImportedContacts] = useState<VerifiedContact[]>([]);
  const [notFoundNumbers, setNotFoundNumbers] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<string[]>([]);

  const handleImportContacts = async () => {
    try {
      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        setImportLoading(true);
        Alert.alert(
          'Importing Contacts',
          'Fetching and analyzing your contacts...',
          [],
          { cancelable: false }
        );
        
        // Get contacts
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        if (data.length > 0) {
          // Extract and clean phone numbers
          const phoneNumbers: string[] = [];
          data.forEach(contact => {
            if (contact.phoneNumbers) {
              contact.phoneNumbers.forEach(phone => {
                if (phone.number) {
                  phoneNumbers.push(phone.number);
                }
              });
            }
          });

          console.log(`Found ${phoneNumbers.length} phone numbers from ${data.length} contacts`);

          // Verify with backend
          try {
            const response = await contactsService.verifyPhoneContacts(phoneNumbers);
            
            // Create VerifiedContact objects from the response
            const verifiedContacts: VerifiedContact[] = response.foundUsers.map(item => ({
              user: {
                _id: item.user._id,
                first_name: item.user.first_name,
                last_name: item.user.last_name,
                email: item.user.email,
                phone_number: item.user.phone_number,
                profile_picture_url: item.user.profile_picture_url,
                position: item.user.position,
                is_active: item.user.is_active,
                friendshipStatus: item.friendshipStatus,
                isIncomingRequest: item.isIncomingRequest
              } as SearchedUser,
              matchedPhoneNumbers: item.matchedPhoneNumbers
            }));
            
            setImportedContacts(verifiedContacts);
            setNotFoundNumbers(response.notFoundNumbers);
            setShowImportModal(true);
            
          } catch (error) {
            console.error('Error verifying contacts:', error);
            Alert.alert('Error', 'Failed to verify contacts. Please try again.');
          }
        } else {
          Alert.alert('No Contacts', 'No contacts found on your device.');
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Please grant contacts permission to find friends from your device.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // For iOS/Android settings opening
                // You might need to use Linking.openURL or expo-linking
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
      Alert.alert('Error', 'Failed to import contacts. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleSendBulkRequests = async () => {
    const userIdsToAdd = importedContacts
      .filter(contact => contact.user.friendshipStatus === 'none')
      .map(contact => contact.user._id);

    if (userIdsToAdd.length === 0) {
      Alert.alert('No Users to Add', 'All found contacts are already friends or have pending requests.');
      return;
    }

    try {
      setSendingRequests(userIdsToAdd);
      
      const response = await contactsService.sendBulkFriendRequests(userIdsToAdd);
      
      // Show results
      const successCount = response.filter((r: any) => r.status === 'success').length;
      const skippedCount = response.filter((r: any) => r.status === 'skipped').length;
      const errorCount = response.filter((r: any) => r.status === 'error').length;
      
      let message = `Successfully sent ${successCount} friend request${successCount !== 1 ? 's' : ''}.`;
      if (skippedCount > 0) message += ` ${skippedCount} were skipped.`;
      if (errorCount > 0) message += ` ${errorCount} failed.`;
      
      Alert.alert(
        'Friend Requests Sent',
        message,
        [{ text: 'OK', onPress: () => {
          setShowImportModal(false);
          onRefresh(); // Refresh the contacts list
        }}]
      );
      
    } catch (error) {
      console.error('Error sending bulk requests:', error);
      Alert.alert('Error', 'Failed to send friend requests. Please try again.');
    } finally {
      setSendingRequests([]);
    }
  };

  const handleAddSingleContact = async (userId: string) => {
    try {
      setSendingRequests(prev => [...prev, userId]);
      await contactsService.sendFriendRequest(userId);
      
      // Update local state
      setImportedContacts(prev => 
        prev.map(contact => 
          contact.user._id === userId 
            ? {
                ...contact,
                user: {
                  ...contact.user,
                  friendshipStatus: 'pending' as const,
                  isIncomingRequest: false
                }
              }
            : contact
        )
      );
      
      Alert.alert('Success', 'Friend request sent!');
      onRefresh();
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    } finally {
      setSendingRequests(prev => prev.filter(id => id !== userId));
    }
  };

  const renderTabButton = (tab: TabType, label: string, count?: number) => (
    <TouchableOpacity 
      style={[styles.tab, activeTab === tab && styles.activeTab]} 
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label} {count !== undefined ? `(${count})` : ''}
      </Text>
    </TouchableOpacity>
  );

  const renderContactItem = (contact: VerifiedContact, index: number) => (
    <View key={index} style={styles.contactItem}>
      <View style={styles.contactInfo}>
        {contact.user.profile_picture_url ? (
          <Image 
            source={{ uri: contact.user.profile_picture_url }} 
            style={styles.contactAvatar} 
          />
        ) : (
          <View style={styles.contactAvatarPlaceholder}>
            <Text style={styles.contactAvatarText}>
              {contact.user.first_name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>
            {contact.user.first_name} {contact.user.last_name}
          </Text>
          <Text style={styles.contactDetailsText}>
            {contact.user.position} • {contact.user.email}
          </Text>
          {contact.user.phone_number && (
            <Text style={styles.contactPhone}>
              📱 {contact.user.phone_number}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.contactActions}>
        {contact.user.friendshipStatus === 'friends' ? (
          <Text style={styles.statusText}>✓ Friends</Text>
        ) : contact.user.friendshipStatus === 'pending' ? (
          contact.user.isIncomingRequest ? (
            <Text style={styles.statusText}>Request Received</Text>
          ) : (
            <Text style={styles.statusText}>Request Sent</Text>
          )
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddSingleContact(contact.user._id)}
            disabled={sendingRequests.includes(contact.user._id)}
          >
            <Text style={styles.addButtonText}>
              {sendingRequests.includes(contact.user._id) ? 'Sending...' : 'Add'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.tabContainer}>
        {renderTabButton('friends', 'Friends', friends.length)}
        {renderTabButton('requests', 'Requests', pendingRequests.length)}
        {renderTabButton('add', 'Add Friends')}
      </View>

      {/* Import Contacts Button */}
      <TouchableOpacity 
        style={styles.importContactsButton}
        onPress={handleImportContacts}
        disabled={importLoading}
      >
        {importLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons name="download" size={16} color="#007AFF" />
        )}
        <Text style={styles.importContactsText}>
          {importLoading ? 'Importing...' : 'Import Contacts from Device'}
        </Text>
      </TouchableOpacity>

      {activeTab === 'friends' && (
        <FriendsList
          friends={friends}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onAddContact={onAddContact}
          onRemoveFriend={onRemoveFriend}
        />
      )}

      {activeTab === 'requests' && (
        <RequestsList
          pendingRequests={pendingRequests}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onRespondRequest={onRespondRequest}
        />
      )}

      {activeTab === 'add' && (
        <AddFriendsTab
          searchResults={searchResults}
          searchQuery={searchQuery}
          searchLoading={searchLoading}
          handleSearch={handleSearch}
          onSendRequest={onSendRequest}
          onNavigateToRequests={onNavigateToRequests}
        />
      )}

      {/* Import Contacts Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contacts Found</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {importedContacts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Found on StaffNest ({importedContacts.length})
                  </Text>
                  {importedContacts.map((contact, index) => renderContactItem(contact, index))}
                </View>
              )}

              {notFoundNumbers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Not Found on StaffNest ({notFoundNumbers.length})
                  </Text>
                  <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>
                      These phone numbers weren't found in your company:
                    </Text>
                    {notFoundNumbers.slice(0, 5).map((number, index) => (
                      <Text key={index} style={styles.phoneNumber}>
                        📱 {number}
                      </Text>
                    ))}
                    {notFoundNumbers.length > 5 && (
                      <Text style={styles.moreText}>
                        ...and {notFoundNumbers.length - 5} more
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {importedContacts.some(contact => contact.user.friendshipStatus === 'none') && (
                <TouchableOpacity
                  style={styles.bulkAddButton}
                  onPress={handleSendBulkRequests}
                  disabled={sendingRequests.length > 0}
                >
                  {sendingRequests.length > 0 ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.bulkAddButtonText}>
                      Add All ({importedContacts.filter(c => c.user.friendshipStatus === 'none').length})
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImportModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  tabContainer: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0' 
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center' 
  },
  activeTab: { 
    borderBottomWidth: 2, 
    borderBottomColor: '#007AFF' 
  },
  tabText: { 
    fontSize: 14, 
    color: '#666', 
    fontWeight: '500' 
  },
  activeTabText: { 
    color: '#007AFF' 
  },
  importContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
    justifyContent: 'center',
  },
  importContactsText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactDetailsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
    color: '#007AFF',
  },
  contactActions: {
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  notFoundContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  notFoundText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  bulkAddButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bulkAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ContactsTabs;