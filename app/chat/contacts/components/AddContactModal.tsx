import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Pressable } from 'react-native-gesture-handler';

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
  theme?: 'light' | 'dark';
}

// Simple QR code generator using pure JavaScript
const generateQRMatrix = (text: string, size = 21) => {
  // Create a simple QR-like pattern for demonstration
  // In production, you'd want to use a proper QR generation algorithm
  const matrix = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Add border
  for (let i = 0; i < size; i++) {
    matrix[0][i] = true;
    matrix[size - 1][i] = true;
    matrix[i][0] = true;
    matrix[i][size - 1] = true;
  }
  
  // Add position markers (simplified)
  for (let i = 2; i < 7; i++) {
    for (let j = 2; j < 7; j++) {
      matrix[i][j] = true;
      matrix[i][size - j - 1] = true;
      matrix[size - i - 1][j] = true;
    }
  }
  
  // Add timing pattern
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
  
  // Add data based on text hash (simplified)
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = 8; i < size - 8; i++) {
    for (let j = 8; j < size - 8; j++) {
      if ((i * j + hash) % 3 === 0) {
        matrix[i][j] = true;
      }
    }
  }
  
  return matrix;
};

// QR Code component using pure JavaScript and View
const SimpleQRCode = ({ 
  value, 
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  cellSize = 8
}: { 
  value: string; 
  size?: number;
  color?: string;
  backgroundColor?: string;
  cellSize?: number;
}) => {
  const matrix = generateQRMatrix(value);
  const cells = matrix.length;
  const adjustedCellSize = size / cells;
  
  return (
    <View 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor, 
        flexDirection: 'row', 
        flexWrap: 'wrap',
        padding: 4,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {matrix.map((row, i) => (
        row.map((cell, j) => (
          <View
            key={`${i}-${j}`}
            style={{
              width: adjustedCellSize,
              height: adjustedCellSize,
              backgroundColor: cell ? color : backgroundColor,
            }}
          />
        ))
      ))}
    </View>
  );
};

// Alternative: Create QR code as data URL using canvas-like approach
const createQRDataURL = async (text: string, size = 200) => {
  // This is a simplified version - in production, use a proper QR library
  const matrix = generateQRMatrix(text, 25);
  const cellSize = size / matrix.length;
  
  // Create an SVG string
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="100%" height="100%" fill="#FFFFFF"/>`;
  
  matrix.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell) {
        svg += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
      }
    });
  });
  
  svg += '</svg>';
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  return dataUrl;
};

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
  theme = 'light',
}) => {
  const isDarkTheme = theme === 'dark';
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const userIdInputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    if (qrCodeData?.qrCode) {
      createQRDataURL(qrCodeData.qrCode).then(setQrImageUrl);
    }
  }, [qrCodeData]);
  
  // Handle keyboard dismissal when tapping outside
  

  // Handle text input focus
  const handleInputFocus = () => {
    // Scroll to input position when focused
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 100);
  };

  const ModalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.modalSection}>
      <Text style={[styles.modalSectionTitle, isDarkTheme && styles.darkText]}>{title}</Text>
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
      style={[
        styles.modalOption, 
        isDarkTheme && styles.darkModalOption,
        disabled && styles.modalOptionDisabled
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.modalOptionIcon, isDarkTheme && styles.darkModalOptionIcon]}>
        {icon}
      </View>
      <View style={styles.modalOptionContent}>
        <Text style={[styles.modalOptionTitle, isDarkTheme && styles.darkText]}>{title}</Text>
        <Text style={[styles.modalOptionDescription, isDarkTheme && styles.darkSubText]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDarkTheme ? '#9CA3AF' : '#666'} />
    </TouchableOpacity>
  );

  // Simple QR Code renderer
  const renderQRCode = () => {
    if (!qrCodeData || !qrCodeData.qrCode) {
      return null;
    }

    return (
      <View style={styles.qrCodeContainer}>
        <SimpleQRCode
          value={qrCodeData.qrCode}
          size={200}
          color={isDarkTheme ? '#FFFFFF' : '#000000'}
          backgroundColor={isDarkTheme ? '#1F2937' : '#FFFFFF'}
        />
        <Text style={[styles.qrHint, isDarkTheme && styles.darkSubText]}>
          Scan this code to add you as a contact
        </Text>
        <Text style={[styles.qrExpiry, isDarkTheme && styles.darkSubText]}>
          Expires: {new Date(qrCodeData.expiresAt).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  // Alternative: Text-based QR code for very simple representation
  const TextQRCode = ({ value, size = 200 }: { value: string; size?: number }) => {
    const matrix = generateQRMatrix(value, 15); // Smaller matrix for text
    const cellSize = 1; // Character width
    
    return (
      <View style={{ 
        backgroundColor: isDarkTheme ? '#1F2937' : '#FFFFFF', 
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
      }}>
        <Text style={{ 
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          fontSize: size / 25,
          lineHeight: size / 25,
          color: isDarkTheme ? '#FFFFFF' : '#000000',
          letterSpacing: -0.5,
        }}>
          {matrix.map((row, i) => (
            <Text key={i}>
              {row.map(cell => cell ? '██' : '  ').join('')}{'\n'}
            </Text>
          ))}
        </Text>
        <Text style={[styles.qrHint, isDarkTheme && styles.darkSubText, { marginTop: 8 }]}>
          Text QR Code - Show to admin
        </Text>
      </View>
    );
  };

  return (
    <Modal
  visible={visible}
  animationType="slide"
  transparent
  presentationStyle="overFullScreen"
  onRequestClose={onClose}
>

  <View style={[styles.modalOverlay, isDarkTheme && styles.darkModalOverlay]}>
    <KeyboardAvoidingView
      behavior="padding"
keyboardVerticalOffset={0}

      style={styles.keyboardAvoidingView}
    >
          <View style={[styles.modalContainerInner, isDarkTheme && styles.darkModalContainer]}>
            <View style={[styles.modalHeader, isDarkTheme && styles.darkModalHeader]}>
              <Text style={[styles.modalTitle, isDarkTheme && styles.darkText]}>Add New Contact</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={isDarkTheme ? '#F9FAFB' : '#000'} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              style={[styles.modalContent, isDarkTheme && styles.darkModalContent]} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"

            >
              {/* Add by User ID Section */}
              <ModalSection title="Add by User ID">
                <View style={styles.userIdSection}>
                  <TextInput
                    ref={userIdInputRef}
                    style={[
                      styles.userIdInput, 
                      isDarkTheme && styles.darkUserIdInput
                    ]}
                    placeholder="Paste User ID  here"
                    placeholderTextColor={isDarkTheme ? '#9CA3AF' : '#999'}
                    value={userIdInput}
                    onChangeText={onSetUserIdInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    returnKeyType="default"
                  />
                  <TouchableOpacity
                    style={[
                      styles.userIdButton, 
                      addingByUserId && styles.userIdButtonDisabled,
                      isDarkTheme && styles.darkPrimaryButton
                    ]}
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
                  style={[styles.copyUserIdButton, isDarkTheme && styles.darkCopyUserIdButton]}
                  onPress={onCopyMyUserId}
                >
                  <Ionicons name="copy" size={16} color="#007AFF" />
                  <Text style={styles.copyUserIdText}>Copy My User ID</Text>
                </TouchableOpacity>
              </ModalSection>

                  {/* COMMENTED OUT: Scan QR Code Option */}
                  {/* <ModalSection title="Scan QR Code">
                    <ModalOption
                      icon={<Ionicons name="scan" size={24} color="#007AFF" />}
                      title="Scan QR Code"
                      description="Scan a friend's QR code to add them"
                      onPress={onScanQRCode}
                    />
                  </ModalSection> */}

                  {/* COMMENTED OUT: Search Colleagues */}
                  {/* <ModalSection title="Search Colleagues">
                    <ModalOption
                      icon={<Ionicons name="search" size={24} color="#007AFF" />}
                      title="Search Company Directory"
                      description="Find and add people from your company"
                      onPress={onClose}
                    />
                  </ModalSection> */}

                  {/* COMMENTED OUT: QR Code Section */}
                  {/* <ModalSection title="QR Code">
                    {qrCodeData ? (
                      <View style={[styles.qrSection, isDarkTheme && styles.darkQrSection]}>
                        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                          <View style={styles.qrCodeContainer}>
                            {renderQRCode()}
                          </View>
                        </ViewShot>
                        
                        <View style={styles.qrActions}>
                          <TouchableOpacity 
                            style={[styles.secondaryButton, isDarkTheme && styles.darkSecondaryButton]} 
                            onPress={onDownloadQRCode}
                          >
                            <Ionicons name="download" size={16} color="#007AFF" />
                            <Text style={[styles.secondaryButtonText, isDarkTheme && styles.darkSecondaryButtonText]}>
                              Save QR
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.secondaryButton, isDarkTheme && styles.darkSecondaryButton]} 
                            onPress={onShareQRCode}
                          >
                            <Ionicons name="share" size={16} color="#007AFF" />
                            <Text style={[styles.secondaryButtonText, isDarkTheme && styles.darkSecondaryButtonText]}>
                              Share
                            </Text>
                          </TouchableOpacity>
                        </View>
                        
                        <View style={{ marginTop: 16 }}>
                          <Text style={[styles.modalSectionTitle, isDarkTheme && styles.darkText, { marginBottom: 8 }]}>
                            Alternative (Text Version):
                          </Text>
                          <TextQRCode value={qrCodeData.qrCode} size={150} />
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
                  </ModalSection> */}

                  {/* COMMENTED OUT: Invite Link Section */}
                  {/* <ModalSection title="Invite Link">
                    {inviteLink ? (
                      <View style={[styles.inviteSection, isDarkTheme && styles.darkInviteSection]}>
                        <View style={[styles.inviteLinkContainer, isDarkTheme && styles.darkInviteLinkContainer]}>
                          <Text style={styles.inviteLink} numberOfLines={1}>{inviteLink}</Text>
                        </View>
                        <View style={styles.inviteActions}>
                          <TouchableOpacity 
                            style={[styles.secondaryButton, isDarkTheme && styles.darkSecondaryButton]} 
                            onPress={onCopyInviteLink}
                          >
                            <Ionicons name="copy" size={16} color="#007AFF" />
                            <Text style={[styles.secondaryButtonText, isDarkTheme && styles.darkSecondaryButtonText]}>
                              Copy
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.secondaryButton, isDarkTheme && styles.darkSecondaryButton]} 
                            onPress={onShareInviteLink}
                          >
                            <Ionicons name="share" size={16} color="#007AFF" />
                            <Text style={[styles.secondaryButtonText, isDarkTheme && styles.darkSecondaryButtonText]}>
                              Share
                            </Text>
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
                  </ModalSection> */}

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
                  
                  {/* Add some extra space at the bottom for keyboard */}
                  <View style={styles.bottomSpacer} />
                </ScrollView>
              </View>
          </KeyboardAvoidingView>
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
  modalContainerInner: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 400,
  },
  darkModalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 400,
  },
  darkModalContainer: {
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkModalHeader: {
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubText: {
    color: '#9CA3AF',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  darkModalContent: {
    backgroundColor: '#111827',
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
  darkModalOption: {
    backgroundColor: '#1F2937',
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
  darkModalOptionIcon: {
    backgroundColor: '#374151',
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
    color: '#000',
    minHeight: 48,
  },
  darkUserIdInput: {
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
    color: '#F9FAFB',
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
  darkPrimaryButton: {
    backgroundColor: '#2563EB',
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
  darkCopyUserIdButton: {
    backgroundColor: '#1F2937',
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
  darkQrSection: {
    backgroundColor: '#1F2937',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
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
    marginTop: 16,
  },
  // Invite Link Section
  inviteSection: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
  },
  darkInviteSection: {
    backgroundColor: '#1F2937',
  },
  inviteLinkContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  darkInviteLinkContainer: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
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
  darkSecondaryButton: {
    backgroundColor: '#374151',
    borderColor: '#2563EB',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  darkSecondaryButtonText: {
    color: '#60A5FA',
  },
  // Bottom spacer for keyboard
  bottomSpacer: {
    height: 100,
  },
});

export default AddContactModal;