// /services/encryptionService.ts - SIMPLIFIED VERSION
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class EncryptionService {
  private key: string | null = null;
  private keyStorageKey = 'chat_encryption_key';

  // Initialize with user-specific key
  async initialize(userId: string) {
    try {
      // Try to load existing key from storage
      const storedKey = await AsyncStorage.getItem(this.keyStorageKey);
      
      if (storedKey) {
        this.key = storedKey;
        console.log('🔑 Using existing encryption key');
        return;
      }

      // Generate new key if none exists
      this.key = this.generateKey(userId);
      await AsyncStorage.setItem(this.keyStorageKey, this.key);
      console.log('🔑 Generated new encryption key');
      
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error);
      throw error;
    }
  }

  // Generate a unique key based on user ID
  private generateKey(userId: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return CryptoJS.SHA256(`${userId}_${timestamp}_${random}`).toString();
  }

  // Encrypt message
  encryptMessage(message: string): string {
    if (!this.key) {
      throw new Error('Encryption key not initialized');
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(message, this.key).toString();
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw error;
    }
  }

  // Decrypt message
  decryptMessage(encryptedMessage: string): string {
    if (!this.key) {
      throw new Error('Encryption key not initialized');
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, this.key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw error;
    }
  }

  // Generate HMAC for message verification
  generateHMAC(message: string): string {
    if (!this.key) {
      throw new Error('Encryption key not initialized');
    }
    return CryptoJS.HmacSHA256(message, this.key).toString();
  }

  // Verify HMAC
  verifyHMAC(message: string, hmac: string): boolean {
    if (!this.key) {
      throw new Error('Encryption key not initialized');
    }
    const calculatedHmac = CryptoJS.HmacSHA256(message, this.key).toString();
    return calculatedHmac === hmac;
  }

  // Clear encryption key (on logout)
  async clearKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.keyStorageKey);
      this.key = null;
      console.log('🔑 Cleared encryption key');
    } catch (error) {
      console.error('❌ Failed to clear encryption key:', error);
      throw error;
    }
  }

  // Get current key status
  getKeyStatus(): boolean {
    return !!this.key;
  }
}

export const encryptionService = new EncryptionService();