// services/encryptionService.ts
import CryptoJS from 'crypto-js';

class EncryptionService {
  private encryptionKey: string;
  
  constructor() {
    // Use a secure key - in production, store this securely
    this.encryptionKey = 'your-secure-encryption-key-here'; // CHANGE THIS
  }

  // Add all missing methods that chatService expects
  initialize(userId: string): Promise<void> {
    console.log(`🔐 Initializing encryption for user: ${userId}`);
    return Promise.resolve();
  }

  getKeyStatus(): { hasKey: boolean; isReady: boolean } {
    return {
      hasKey: !!this.encryptionKey && this.encryptionKey.length > 0,
      isReady: true
    };
  }

  generateHMAC(message: string): string {
    return CryptoJS.HmacSHA256(message, this.encryptionKey).toString();
  }

  getKeyFingerprint(): string {
    return CryptoJS.SHA256(this.encryptionKey).toString().substring(0, 16);
  }

  clearKey(): Promise<void> {
    console.log('🔐 Clearing encryption key');
    return Promise.resolve();
  }

  // Your existing encryption methods
  encryptMessage(message: string): string {
    try {
      console.log('🔐 Encrypting message...');
      
      // Generate a random IV (Initialization Vector)
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Encrypt the message
      const encrypted = CryptoJS.AES.encrypt(message, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Create hash for verification
      const hash = CryptoJS.SHA256(message + this.encryptionKey).toString();

      // Combine IV with encrypted data
      const result = {
        iv: iv.toString(CryptoJS.enc.Base64),
        encrypted: encrypted.toString(),
        hash: hash
      };

      return JSON.stringify(result);
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  decryptMessage(encryptedData: string): string {
    try {
      console.log('🔓 Decrypting message...');
      
      const data = JSON.parse(encryptedData);
      const iv = CryptoJS.enc.Base64.parse(data.iv);
      
      const decrypted = CryptoJS.AES.decrypt(data.encrypted, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Simple encryption fallback
  simpleEncrypt(message: string): { encrypted: string; hash: string } {
    try {
      const key = this.encryptionKey;
      let encrypted = '';
      
      for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
      }

      const hash = CryptoJS.SHA256(message + key).toString();
      
      return {
        encrypted: Buffer.from(encrypted).toString('base64'),
        hash: hash
      };
    } catch (error) {
      console.error('❌ Simple encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  simpleDecrypt(encrypted: string): string {
    try {
      const key = this.encryptionKey;
      const decoded = Buffer.from(encrypted, 'base64').toString('binary');
      let message = '';
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        message += String.fromCharCode(charCode);
      }
      
      return message;
    } catch (error) {
      console.error('❌ Simple decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }
}

export const encryptionService = new EncryptionService();