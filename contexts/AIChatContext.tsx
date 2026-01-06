// File: contexts/AIChatContext.tsx
import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { deepseekService, ChatMessage } from '@/services/deepseekService';
import api from '@/services/api';

interface AIChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
  sendMessage: (content: string, attachments?: any[]) => Promise<void>;
  clearMessages: () => void;
  setModel: (model: string) => void;
  currentModel: string;
  availableModels: string[];
  // Enhanced capabilities
  fetchData: (endpoint: string, params?: any) => Promise<any>;
  performAction: (action: string, data?: any) => Promise<any>;
  availableEndpoints: Record<string, any>;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

// Define all available endpoints from your backend
const AVAILABLE_ENDPOINTS = {
  // User/Staff Management
  users: {
    path: '/users',
    methods: ['GET', 'POST'],
    description: 'Manage staff members',
    params: {
      GET: {},
      POST: ['email', 'password', 'first_name', 'last_name', 'role', 'country', 'identification', 'pay_rates']
    }
  },
  staff: {
    path: '/users/staff',
    methods: ['GET'],
    description: 'Get all staff members (non-admin)'
  },
  
  // Shifts Management
  shifts: {
    path: '/shifts',
    methods: ['GET', 'POST'],
    description: 'Manage shifts',
    params: {
      GET: ['start_date', 'end_date', 'user_id', 'status'],
      POST: ['title', 'start_time', 'end_time', 'user_id', 'location', 'type', 'status']
    }
  },
  myShifts: {
    path: '/shifts/my-shifts',
    methods: ['GET'],
    description: 'Get user\'s own shifts'
  },
  openShifts: {
    path: '/shifts/open-shifts',
    methods: ['GET'],
    description: 'Get open shifts available for request'
  },
  shiftRequests: {
    path: '/shifts/requests',
    methods: ['GET', 'POST'],
    description: 'Manage shift requests'
  },
  
  // Payroll Management
  payslips: {
    path: '/payslips',
    methods: ['GET', 'POST'],
    description: 'Manage payslips',
    params: {
      GET: ['employee_id', 'status', 'year', 'pay_period_start', 'pay_period_end'],
      POST: ['employee_id', 'pay_period_start', 'pay_period_end', 'pay_date', 'include_shifts']
    }
  },
  myPayslips: {
    path: '/payslips/my-payslips',
    methods: ['GET'],
    description: 'Get user\'s own payslips'
  },
  generatePayslip: {
    path: '/payslips/generate',
    methods: ['POST'],
    description: 'Generate a new payslip'
  },
  
  // Company Management
  company: {
    path: '/companies/my',
    methods: ['GET'],
    description: 'Get company information'
  },
  companyLocations: {
    path: '/companies/locations',
    methods: ['GET', 'POST'],
    description: 'Manage company locations'
  },
  
  // Roles Management
  roles: {
    path: '/roles',
    methods: ['GET', 'POST'],
    description: 'Manage roles and positions'
  },
  
  // Stories
  stories: {
    path: '/stories/feed',
    methods: ['GET'],
    description: 'Get stories feed'
  },
  
  // Chat
  conversations: {
    path: '/chat/conversations',
    methods: ['GET'],
    description: 'Get chat conversations'
  },
  
  // Notifications
  notifications: {
    path: '/notifications/history',
    methods: ['GET'],
    description: 'Get notification history'
  }
};

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your HourWize AI assistant. I can help you with:\n• Shift scheduling and management\n• Payroll and payslip queries\n• Staff information and management\n• Company policies and locations\n• And much more!\n\nWhat would you like to know or do today?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentModel, setCurrentModel] = useState('deepseek-chat');
  const [availableModels, setAvailableModels] = useState<string[]>([
    'deepseek-chat',
    'deepseek-coder',
  ]);

  // System prompt that includes available endpoints
  const systemPrompt = `You are HourWize AI, an intelligent assistant for the HourWize staff management platform. 
You have access to the following backend endpoints:

${Object.entries(AVAILABLE_ENDPOINTS).map(([key, endpoint]) => 
  `- ${key}: ${endpoint.description} (${endpoint.methods.join(', ')} ${endpoint.path})`
).join('\n')}

IMPORTANT INSTRUCTIONS:
1. You can access real data from the system by using the available endpoints
2. When users ask about data (shifts, staff, payslips, etc.), you should fetch it from the backend
3. Format your responses clearly with bullet points or tables when appropriate
4. If you need to perform actions (create, update, delete), guide the user through the process
5. For complex queries, break them down and explain what data you're fetching

Example responses:
- "I'll check your upcoming shifts for you..." (then fetch from /shifts/my-shifts)
- "Let me look up that staff member's information..." (then fetch from /users)
- "I'll generate a payslip summary for you..." (then fetch from /payslips/my-payslips)

Current date: ${new Date().toLocaleDateString()}`;

  const fetchData = async (endpointKey: string, params?: any): Promise<any> => {
    try {
      const endpoint = AVAILABLE_ENDPOINTS[endpointKey as keyof typeof AVAILABLE_ENDPOINTS];
      if (!endpoint) {
        throw new Error(`Endpoint ${endpointKey} not found`);
      }

      let response;
      
      if (endpointKey === 'shifts' && params) {
        response = await api.get('/shifts', { params });
      } else if (endpointKey === 'payslips' && params) {
        response = await api.get('/payslips', { params });
      } else if (endpointKey === 'users' && params) {
        response = await api.get('/users', { params });
      } else {
        response = await api.get(endpoint.path);
      }

      return response.data;
    } catch (err: any) {
      console.error(`Error fetching from ${endpointKey}:`, err);
      throw new Error(`Failed to fetch ${endpointKey}: ${err.message}`);
    }
  };

  const performAction = async (action: string, data?: any): Promise<any> => {
    try {
      const endpoint = AVAILABLE_ENDPOINTS[action as keyof typeof AVAILABLE_ENDPOINTS];
      if (!endpoint) {
        throw new Error(`Action ${action} not supported`);
      }

      let response;
      
      switch (action) {
        case 'shifts':
          response = await api.post('/shifts', data);
          break;
        case 'shiftRequests':
          response = await api.post('/shifts/requests', data);
          break;
        case 'generatePayslip':
          response = await api.post('/payslips/generate', data);
          break;
        case 'users':
          response = await api.post('/users', data);
          break;
        case 'companyLocations':
          response = await api.post('/companies/locations', data);
          break;
        case 'roles':
          response = await api.post('/roles', data);
          break;
        default:
          throw new Error(`Action ${action} not implemented`);
      }

      return response.data;
    } catch (err: any) {
      console.error(`Error performing action ${action}:`, err);
      throw new Error(`Failed to perform ${action}: ${err.message}`);
    }
  };

  const sendMessage = async (content: string, attachments: any[] = []) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date(),
      attachments,
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare conversation history with system prompt
      const conversationHistory: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-5), // Last 5 messages for context
        userMessage
      ];

      // Get response from DeepSeek with enhanced context
      const response = await deepseekService.chatThroughBackend(conversationHistory);
      
      // Check if response includes API calls
      const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I couldn\'t process your request.';
      
      // Parse for potential API calls in the response
      const processedResponse = await processAIResponse(aiResponse, content);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: processedResponse,
        timestamp: new Date(),
      };

      // Add assistant response
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response from AI');
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const processAIResponse = async (aiResponse: string, userQuery: string): Promise<string> => {
    try {
      // Check if the AI response indicates it wants to fetch data
      const lowerQuery = userQuery.toLowerCase();
      const lowerResponse = aiResponse.toLowerCase();
      
      let fetchedData: any = null;
      let dataContext = '';
      
      // Check for shift-related queries
      if (lowerQuery.includes('shift') || lowerQuery.includes('rota') || lowerQuery.includes('schedule')) {
        if (lowerQuery.includes('my') || lowerQuery.includes('upcoming') || lowerQuery.includes('next')) {
          // Fetch user's shifts
          fetchedData = await fetchData('myShifts');
          if (fetchedData && fetchedData.length > 0) {
            const formattedShifts = fetchedData.map((shift: any, index: number) => 
              `${index + 1}. ${shift.title || 'Shift'} - ${new Date(shift.start_time).toLocaleDateString()} ${new Date(shift.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to ${new Date(shift.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${shift.status})`
            ).join('\n');
            dataContext = `\n\nHere are your shifts:\n${formattedShifts}`;
          } else {
            dataContext = '\n\nYou have no upcoming shifts scheduled.';
          }
        } else if (lowerQuery.includes('open') || lowerQuery.includes('available')) {
          // Fetch open shifts
          fetchedData = await fetchData('openShifts');
          if (fetchedData && fetchedData.length > 0) {
            const formattedShifts = fetchedData.map((shift: any, index: number) => 
              `${index + 1}. ${shift.title || 'Shift'} - ${new Date(shift.start_time).toLocaleDateString()} ${new Date(shift.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to ${new Date(shift.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} at ${shift.location || 'Location not specified'}`
            ).join('\n');
            dataContext = `\n\nAvailable open shifts:\n${formattedShifts}`;
          } else {
            dataContext = '\n\nThere are currently no open shifts available.';
          }
        }
      }
      
      // Check for staff-related queries
      else if (lowerQuery.includes('staff') || lowerQuery.includes('employee') || lowerQuery.includes('team')) {
        fetchedData = await fetchData('staff');
        if (fetchedData && fetchedData.length > 0) {
          const staffList = fetchedData.map((staff: any, index: number) => 
            `${index + 1}. ${staff.first_name} ${staff.last_name} - ${staff.position || 'No position'} (${staff.email})`
          ).join('\n');
          dataContext = `\n\nStaff members:\n${staffList}`;
        }
      }
      
      // Check for payslip queries
      else if (lowerQuery.includes('payslip') || lowerQuery.includes('payroll') || lowerQuery.includes('salary')) {
        if (lowerQuery.includes('my')) {
          fetchedData = await fetchData('myPayslips');
        } else {
          fetchedData = await fetchData('payslips');
        }
        
        if (fetchedData && fetchedData.length > 0) {
          const payslipList = fetchedData.slice(0, 5).map((payslip: any, index: number) => 
            `${index + 1}. ${payslip.payslip_number || 'Payslip'} - ${new Date(payslip.pay_period_start).toLocaleDateString()} to ${new Date(payslip.pay_period_end).toLocaleDateString()} - £${payslip.net_pay?.toFixed(2) || '0.00'} (${payslip.status})`
          ).join('\n');
          dataContext = `\n\nRecent payslips:\n${payslipList}`;
        }
      }
      
      // Check for company info queries
      else if (lowerQuery.includes('company') || lowerQuery.includes('location')) {
        fetchedData = await fetchData('company');
        if (fetchedData) {
          dataContext = `\n\nCompany: ${fetchedData.name || 'Unnamed Company'}\nAddress: ${fetchedData.address || 'Not specified'}`;
        }
      }
      
      // Combine AI response with fetched data
      return aiResponse + dataContext;
      
    } catch (error) {
      console.error('Error processing AI response:', error);
      return aiResponse;
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your HourWize AI assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  };

  const value: AIChatContextType = {
    messages,
    isLoading,
    error,
    isStreaming,
    sendMessage,
    clearMessages,
    setModel: setCurrentModel,
    currentModel,
    availableModels,
    fetchData,
    performAction,
    availableEndpoints: AVAILABLE_ENDPOINTS,
  };

  return (
    <AIChatContext.Provider value={value}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
}