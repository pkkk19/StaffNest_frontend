// contexts/ChatPreviewContext.tsx
import React, { createContext, useContext, useRef } from 'react';
import { encryptionService } from '@/services/encryptionService';

interface ChatPreviewContextType {
  getPreview: (messageId: string, encryptedContent: string) => string;
  clearPreview: (messageId: string) => void;
}

const ChatPreviewContext = createContext<ChatPreviewContextType | undefined>(undefined);

export function ChatPreviewProvider({ children }: { children: React.ReactNode }) {
  // In-memory cache (NOT state → no re-render spam)
  const previewCache = useRef<Map<string, string>>(new Map());

  const getPreview = (messageId: string, encryptedContent: string) => {
    if (previewCache.current.has(messageId)) {
      return previewCache.current.get(messageId)!;
    }

    try {
      const decrypted = encryptionService.getDecryptedContent(
        encryptedContent,
        true // preview mode
      );

      previewCache.current.set(messageId, decrypted);
      return decrypted;
    } catch {
      return '🔒 Encrypted message';
    }
  };

  const clearPreview = (messageId: string) => {
    previewCache.current.delete(messageId);
  };

  return (
    <ChatPreviewContext.Provider value={{ getPreview, clearPreview }}>
      {children}
    </ChatPreviewContext.Provider>
  );
}

export function useChatPreview() {
  const ctx = useContext(ChatPreviewContext);
  if (!ctx) {
    throw new Error('useChatPreview must be used within ChatPreviewProvider');
  }
  return ctx;
}
