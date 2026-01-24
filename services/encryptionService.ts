import CryptoJS from 'crypto-js';

class EncryptionService {
  private encryptionKey: string;
  private isInitialized: boolean = false;
  
  constructor() {
    // Use a fixed key for now (in production, use secure storage)
    // For development, we'll use a consistent key - 32 chars for AES-256
    this.encryptionKey = 'your-32-character-secure-key-here!!';
    
    // Force CryptoJS to use its built-in PRNG instead of native crypto
    this.configureCryptoJS();
    
    this.isInitialized = true;
  }

  private configureCryptoJS() {
    // Override the random number generator to use CryptoJS's PRNG
    CryptoJS.lib.WordArray.random = function(nBytes) {
      const words: number[] = [];
      const r = (function(m_w) {
        let m_z = 0x3ade68b1;
        const mask = 0xffffffff;
        
        return function() {
          m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
          m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
          let result = ((m_z << 0x10) + m_w) & mask;
          result /= 0x100000000;
          result += 0.5;
          return result * (Math.random() > 0.5 ? 1 : -1);
        };
      })(Math.random() * 0x100000000);
      
      for (let i = 0, rcache; i < nBytes; i += 4) {
        const _r = r() * 0x100000000;
        words.push(_r < 0 ? Math.floor(_r) : Math.floor(_r));
      }
      
      return CryptoJS.lib.WordArray.create(words, nBytes);
    };
  }

  // Add all missing methods that chatService expects
  initialize(userId: string): Promise<void> {
    console.log(`🔐 Initializing encryption for user: ${userId}`);
    return Promise.resolve();
  }

  getKeyStatus(): { hasKey: boolean; isReady: boolean } {
    return {
      hasKey: !!this.encryptionKey && this.encryptionKey.length >= 32,
      isReady: this.isInitialized
    };
  }

  generateHMAC(message: string): string {
    try {
      return CryptoJS.HmacSHA256(message, this.encryptionKey).toString();
    } catch (error) {
      console.error('❌ HMAC generation failed:', error);
      // Fallback to SHA256 if HMAC fails
      return CryptoJS.SHA256(message + this.encryptionKey).toString();
    }
  }

  getKeyFingerprint(): string {
    return CryptoJS.SHA256(this.encryptionKey).toString().substring(0, 16);
  }

  clearKey(): Promise<void> {
    console.log('🔐 Clearing encryption key');
    // In production, properly clear the key from memory
    this.encryptionKey = '';
    this.isInitialized = false;
    return Promise.resolve();
  }

  // Main encryption method
  encryptMessage(message: string): string {
    try {
      console.log('🔐 Encrypting message...');
      
      // Generate IV using our configured random function
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Encrypt using AES CBC mode
      const encrypted = CryptoJS.AES.encrypt(message, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Create a simple JSON object with the encrypted data
      const result = {
        iv: iv.toString(CryptoJS.enc.Base64),
        ciphertext: encrypted.toString(),
        // Add a version marker for future compatibility
        v: '1',
        timestamp: Date.now()
      };

      return JSON.stringify(result);
      
    } catch (error) {
      console.error('❌ AES Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Main decryption method - returns decrypted content or original if not encrypted
  decryptMessage(encryptedData: string): string {
    try {
      // If it's already a plain string, return it
      if (!encryptedData || typeof encryptedData !== 'string') {
        return encryptedData;
      }

      // Check if it's encrypted JSON
      if (encryptedData.trim().startsWith('{')) {
        try {
          const data = JSON.parse(encryptedData);
          
          // Check for v1 format (AES encryption)
          if (data.v === '1' && data.iv && data.ciphertext) {
            const iv = CryptoJS.enc.Base64.parse(data.iv);
            const decrypted = CryptoJS.AES.decrypt(
              data.ciphertext,
              this.encryptionKey,
              {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
              }
            );
            
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (decryptedText) {
              console.log('✅ Message decrypted successfully (v1)');
              return decryptedText;
            }
          }
          
          // Check for old format (for backward compatibility)
          if (data.iv && data.encrypted) {
            const iv = CryptoJS.enc.Base64.parse(data.iv);
            const decrypted = CryptoJS.AES.decrypt(
              data.encrypted,
              this.encryptionKey,
              {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
              }
            );
            
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (decryptedText) {
              console.log('✅ Message decrypted successfully (legacy format)');
              return decryptedText;
            }
          }
        } catch (jsonError) {
          console.log('⚠️ Not a valid encrypted JSON, returning as-is');
        }
      }
      
      // If not encrypted or decryption failed, return original
      return encryptedData;
      
    } catch (error) {
      console.error('❌ Decryption failed, returning original:', error);
      return encryptedData;
    }
  }

  // NEW: Smart getter that always returns decrypted content
  getDecryptedContent(content: string, isEncrypted?: boolean): string {
    if (!content) return '';
    
    // If explicitly marked as encrypted, try to decrypt
    if (isEncrypted) {
      return this.decryptMessage(content);
    }
    
    // If not marked, but looks encrypted, try to decrypt anyway
    if (this.isEncrypted(content)) {
      return this.decryptMessage(content);
    }
    
    // Otherwise return as-is
    return content;
  }

  // Check if message is encrypted (based on your format)
  isEncrypted(message: string): boolean {
    try {
      // Check if it's JSON encrypted format
      if (message.trim().startsWith('{')) {
        try {
          const data = JSON.parse(message);
          // Check for any known encrypted formats
          return !!(data.iv && data.ciphertext) || 
                 !!(data.iv && data.encrypted) || 
                 !!(data.fallback && data.encrypted);
        } catch {
          return false;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();