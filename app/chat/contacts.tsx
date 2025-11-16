import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useContacts } from './contacts/hooks/useContacts';
import ContactsTabs from './contacts/components/ContactsTabs';
import AddContactModal from './contacts/components/AddContactModal';
import QRScanner from '@/components/QRScanner';

export default function ContactsPage() {
  const router = useRouter();
  const {
    activeTab,
    setActiveTab,
    friends,
    pendingRequests,
    searchResults,
    searchQuery,
    loading,
    refreshing,
    isAddModalVisible,
    searchLoading,
    showScanner,
    qrCodeData,
    generatingQR,
    inviteLink,
    userIdInput,
    addingByUserId,
    viewShotRef,
    onRefresh,
    handleSearch,
    handleAddContact,
    handleCloseModal,
    handleCloseScanner,
    handleFriendAdded,
    handleRemoveFriend,
    handleRespondRequest,
    handleSendRequest,
    handleAddByUserId,
    handleCopyMyUserId,
    handleGenerateQRCode,
    handleDownloadQRCode,
    handleShareQRCode,
    handleGenerateInviteLink,
    handleCopyInviteLink,
    handleShareInviteLink,
    handleScanQRCode,
    setUserIdInput,
  } = useContacts();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Contacts',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleAddContact} style={styles.headerButton}>
            <Ionicons name="person-add" size={24} color="#007AFF" />
          </TouchableOpacity>
        ),
      }} />

      <TouchableOpacity style={styles.floatingButton} onPress={handleAddContact}>
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      <ContactsTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        friends={friends}
        pendingRequests={pendingRequests}
        searchResults={searchResults}
        searchQuery={searchQuery}
        loading={loading}
        refreshing={refreshing}
        searchLoading={searchLoading}
        onRefresh={onRefresh}
        handleSearch={handleSearch}
        onAddContact={handleAddContact}
        onRemoveFriend={handleRemoveFriend}
        onRespondRequest={handleRespondRequest}
        onSendRequest={handleSendRequest}
        onNavigateToRequests={() => setActiveTab('requests')}
      />

      {/* Add Contact Modal */}
      <AddContactModal
        visible={isAddModalVisible}
        onClose={handleCloseModal}
        qrCodeData={qrCodeData}
        generatingQR={generatingQR}
        inviteLink={inviteLink}
        userIdInput={userIdInput}
        addingByUserId={addingByUserId}
        viewShotRef={viewShotRef}
        onGenerateQRCode={handleGenerateQRCode}
        onDownloadQRCode={handleDownloadQRCode}
        onShareQRCode={handleShareQRCode}
        onGenerateInviteLink={handleGenerateInviteLink}
        onCopyInviteLink={handleCopyInviteLink}
        onShareInviteLink={handleShareInviteLink}
        onScanQRCode={handleScanQRCode}
        onAddByUserId={handleAddByUserId}
        onCopyMyUserId={handleCopyMyUserId}
        onNavigateToRequests={() => {
          handleCloseModal();
          setActiveTab('requests');
        }}
        onSetUserIdInput={setUserIdInput}
        pendingRequestsCount={pendingRequests.length}
      />

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner 
          onClose={handleCloseScanner}
          onFriendAdded={handleFriendAdded}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerButton: { padding: 8, marginHorizontal: 8 },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
});