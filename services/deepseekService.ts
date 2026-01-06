// File: services/deepseekService.ts
import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  attachments?: any[];
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Interface for API message format
export interface ApiChatMessage {
  role: string;
  content: string;
}

class DeepSeekService {
  // Through your backend (recommended for production)
  async chatThroughBackend(messages: ChatMessage[]): Promise<DeepSeekResponse> {
    try {
      // Convert ChatMessage to the format expected by backend
      const apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await api.post('/ai-chat/chat', {
        messages: apiMessages,
        model: 'deepseek-chat',
        max_tokens: 2000,
        temperature: 0.7,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error in DeepSeek chat through backend:', error);
      
      // Fallback to simulated response
      return this.getFallbackResponse(messages);
    }
  }

  private getFallbackResponse(messages: ChatMessage[]): DeepSeekResponse {
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    const userQuery = lastUserMessage?.content.toLowerCase() || '';
    
    let responseContent = 'I understand your query. ';
    
    // Provide helpful responses based on query type
    if (userQuery.includes('shift') || userQuery.includes('schedule')) {
      responseContent += 'For shift-related queries, I can help you view upcoming shifts, check open shifts, or request shift changes. You can also clock in/out through the app.';
    } else if (userQuery.includes('payslip') || userQuery.includes('payroll')) {
      responseContent += 'For payroll questions, I can help you view your recent payslips, understand deductions, or check your payment history.';
    } else if (userQuery.includes('staff') || userQuery.includes('employee')) {
      responseContent += 'For staff management, I can help you view team members, check contact details, or manage staff information.';
    } else if (userQuery.includes('company') || userQuery.includes('location')) {
      responseContent += 'For company information, I can help you view company details, check locations, or understand company policies.';
    } else {
      responseContent += 'I\'m here to help with shift management, payroll, staff information, and company-related queries. Please let me know what specific information you need.';
    }

    return {
      id: 'fallback-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'deepseek-chat',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseContent,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  // Get chat history from backend
  async getChatHistory(page: number = 1, limit: number = 20): Promise<any> {
    try {
      const response = await api.get('/ai-chat/history', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  // Clear chat history
  async clearHistory(): Promise<any> {
    try {
      const response = await api.delete('/ai-chat/history');
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }

  // Get available DeepSeek models
  async getModels(): Promise<string[]> {
    try {
      const response = await api.get('/ai-chat/models');
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return ['deepseek-chat', 'deepseek-coder'];
    }
  }
}

export const deepseekService = new DeepSeekService();
export default deepseekService;