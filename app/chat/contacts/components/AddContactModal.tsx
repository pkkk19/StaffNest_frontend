import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  qrCodeData: { qrCode: string; token: string; expiresAt: string } | null;
  generatingQR: boolean;
  inviteLink: string;
  userIdInput: string;
  addingByUserId: boolean;
  viewShotRef: React.RefObject<any>;
  onGenerateQRCode: () => void;
  onDownloadQRCode: () => void;
  onShareQRCode: () => void;
  onGenerateInviteLink: () => void;
  onCopyInviteLink: () => void;
  onShareInviteLink: () => void;
  onScanQRCode: () => void;
  onAddByUserId: () => void;
  onCopyMyUserId: () => void;
  onNavigateToRequests: () => void;
  onSetUserIdInput: (text: string) => void;
  pendingRequestsCount: number;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  visible,
  onClose,
  qrCodeData,
  generatingQR,
  inviteLink,
  userIdInput,
  addingByUserId,
  viewShotRef,
  onGenerateQRCode,
  onDownloadQRCode,
  onShareQRCode,
  onGenerateInviteLink,
  onCopyInviteLink,
  onShareInviteLink,
  onScanQRCode,
  onAddByUserId,
  onCopyMyUserId,
  onNavigateToRequests,
  onSetUserIdInput,
  pendingRequestsCount,
}) => {
  const ModalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.modalSection}>
      <Text style={styles.modalSectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const ModalOption: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onPress: () => void;
    disabled?: boolean;
  }> = ({ icon, title, description, onPress, disabled = false }) => (
    <TouchableOpacity 
      style={[styles.modalOption, disabled && styles.modalOptionDisabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.modalOptionIcon}>
        {icon}
      </View>
      <View style={styles.modalOptionContent}>
        <Text style={styles.modalOptionTitle}>{title}</Text>
        <Text style={styles.modalOptionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Contact</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Add by User ID Section */}
            <ModalSection title="Add by User ID">
              <View style={styles.userIdSection}>
                <TextInput
                  style={styles.userIdInput}
                  placeholder="Enter User ID"
                  value={userIdInput}
                  onChangeText={onSetUserIdInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.userIdButton, addingByUserId && styles.userIdButtonDisabled]}
                  onPress={onAddByUserId}
                  disabled={addingByUserId}
                >
                  {addingByUserId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={16} color="#fff" />
                  )}
                  <Text style={styles.userIdButtonText}>
                    {addingByUserId ? 'Sending...' : 'Send Request'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.copyUserIdButton}
                onPress={onCopyMyUserId}
              >
                <Ionicons name="copy" size={16} color="#007AFF" />
                <Text style={styles.copyUserIdText}>Copy My User ID</Text>
              </TouchableOpacity>
            </ModalSection>

            {/* Scan QR Code Option */}
            <ModalSection title="Scan QR Code">
              <ModalOption
                icon={<Ionicons name="scan" size={24} color="#007AFF" />}
                title="Scan QR Code"
                description="Scan a friend's QR code to add them"
                onPress={onScanQRCode}
              />
            </ModalSection>

            {/* Search Colleagues */}
            <ModalSection title="Search Colleagues">
              <ModalOption
                icon={<Ionicons name="search" size={24} color="#007AFF" />}
                title="Search Company Directory"
                description="Find and add people from your company"
                onPress={onClose}
              />
            </ModalSection>

            {/* QR Code Section */}
            <ModalSection title="QR Code">
              {qrCodeData ? (
                <View style={styles.qrSection}>
                  <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                    <View style={styles.qrCodeContainer}>
                      <QRCode value={qrCodeData.qrCode} size={200} backgroundColor="white" color="black" />
                      <Text style={styles.qrHint}>Scan this code to add you as a contact</Text>
                      <Text style={styles.qrExpiry}>
                        Expires: {new Date(qrCodeData.expiresAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  </ViewShot>
                  <View style={styles.qrActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={onDownloadQRCode}>
                      <Ionicons name="download" size={16} color="#007AFF" />
                      <Text style={styles.secondaryButtonText}>Save QR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={onShareQRCode}>
                      <Ionicons name="share" size={16} color="#007AFF" />
                      <Text style={styles.secondaryButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <ModalOption
                  icon={
                    generatingQR ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <Ionicons name="qr-code" size={24} color="#007AFF" />
                    )
                  }
                  title={generatingQR ? 'Generating QR Code...' : 'Generate My QR Code'}
                  description="Create a QR code that others can scan to add you"
                  onPress={onGenerateQRCode}
                  disabled={generatingQR}
                />
              )}
            </ModalSection>

            {/* Invite Link Section */}
            <ModalSection title="Invite Link">
              {inviteLink ? (
                <View style={styles.inviteSection}>
                  <View style={styles.inviteLinkContainer}>
                    <Text style={styles.inviteLink} numberOfLines={1}>{inviteLink}</Text>
                  </View>
                  <View style={styles.inviteActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={onCopyInviteLink}>
                      <Ionicons name="copy" size={16} color="#007AFF" />
                      <Text style={styles.secondaryButtonText}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={onShareInviteLink}>
                      <Ionicons name="share" size={16} color="#007AFF" />
                      <Text style={styles.secondaryButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <ModalOption
                  icon={<Ionicons name="link" size={24} color="#007AFF" />}
                  title="Create Invite Link"
                  description="Generate a link to share with colleagues"
                  onPress={onGenerateInviteLink}
                />
              )}
            </ModalSection>

            {/* Pending Requests */}
            <ModalSection title="Pending Requests">
              <ModalOption
                icon={<Ionicons name="mail" size={24} color="#007AFF" />}
                title="View Friend Requests"
                description={
                  pendingRequestsCount > 0 
                    ? `${pendingRequestsCount} pending requests` 
                    : 'No pending requests'
                }
                onPress={onNavigateToRequests}
              />
            </ModalSection>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionDisabled: {
    opacity: 0.6,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  modalOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  // User ID Section
  userIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userIdInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    fontSize: 16,
  },
  userIdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  userIdButtonDisabled: {
    backgroundColor: '#ccc',
  },
  userIdButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  copyUserIdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  copyUserIdText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // QR Code Section
  qrSection: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  qrExpiry: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 12,
  },
  // Invite Link Section
  inviteSection: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
  },
  inviteLinkContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inviteLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddContactModal;