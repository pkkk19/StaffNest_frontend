// File: contexts/AIChatContext.tsx
import React, { createContext, useContext, useState, useRef, ReactNode, useCallback, useEffect } from 'react';
import { deepseekService, ChatMessage } from '@/services/deepseekService';
import api from '@/services/api';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a more complete ChatMessage interface
interface AIChatMessage extends Omit<ChatMessage, 'metadata'> {
  metadata?: {
    type?: 'general' | 'app_command' | 'data_query' | 'error';
    command?: string;
    dataSource?: string;
    dataFetched?: boolean;
    error?: string;
    attachments?: any[];
  };
}

interface AppCommand {
  name: string;
  description: string;
  icon: string;
  endpoint: string;
}

interface AIChatContextType {
  messages: AIChatMessage[];
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
  sendMessage: (content: string, attachments?: any[]) => Promise<void>;
  clearMessages: () => void;
  setModel: (model: string) => void;
  currentModel: string;
  availableModels: string[];
  appCommands: AppCommand[];
  isTyping: boolean;
  hasMoreHistory: boolean;
  loadMoreHistory: () => Promise<void>;
  fetchAppCommands: () => Promise<void>;
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
  },
  
  // Time Off
  timeOff: {
    path: '/time-off',
    methods: ['GET', 'POST'],
    description: 'Manage time off requests'
  },
  myLeaves: {
    path: '/time-off/my-leaves',
    methods: ['GET'],
    description: 'Get user\'s own leave requests'
  }
};

// Define app commands for quick access
const APP_COMMANDS: AppCommand[] = [
  {
    name: 'get_shifts',
    description: 'Show my upcoming shifts',
    icon: 'calendar',
    endpoint: 'myShifts'
  },
  {
    name: 'get_payslips',
    description: 'Show my recent payslips',
    icon: 'dollar-sign',
    endpoint: 'myPayslips'
  },
  {
    name: 'get_timeoff_requests',
    description: 'Check my time off status',
    icon: 'clock',
    endpoint: 'myLeaves'
  },
  {
    name: 'get_company_policies',
    description: 'View company policies',
    icon: 'book-open',
    endpoint: 'company'
  },
  {
    name: 'get_staff_directory',
    description: 'Browse staff directory',
    icon: 'users',
    endpoint: 'staff'
  },
  {
    name: 'request_timeoff',
    description: 'Submit time off request',
    icon: 'calendar',
    endpoint: 'timeOff'
  }
];

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your HourWize AI assistant. I can help you with:\n• Shift scheduling and management\n• Payroll and payslip queries\n• Staff information and management\n• Company policies and locations\n• And much more!\n\nWhat would you like to know or do today?',
      timestamp: new Date(),
      metadata: {
        type: 'general'
      }
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentModel, setCurrentModel] = useState('deepseek-chat');
  const [availableModels, setAvailableModels] = useState<string[]>([
    'deepseek-chat',
    'deepseek-coder',
  ]);
  const [appCommands, setAppCommands] = useState<AppCommand[]>(APP_COMMANDS);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);

  const apiClient = api;

  // System prompt that includes available endpoints
  const getSystemPrompt = (): string => {
    return `You are HourWize AI, an intelligent assistant for the HourWize staff management platform. 
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
  };

  const fetchData = useCallback(async (endpointKey: string, params?: any): Promise<any> => {
    try {
      const endpoint = AVAILABLE_ENDPOINTS[endpointKey as keyof typeof AVAILABLE_ENDPOINTS];
      if (!endpoint) {
        throw new Error(`Endpoint ${endpointKey} not found`);
      }

      let response;
      
      // Handle specific endpoint patterns
      if (endpointKey === 'myShifts') {
        response = await apiClient.get('/shifts/my-shifts', { params });
      } else if (endpointKey === 'myPayslips') {
        response = await apiClient.get('/payslips/my-payslips', { params });
      } else if (endpointKey === 'myLeaves') {
        response = await apiClient.get('/time-off/my-leaves', { params });
      } else if (endpointKey === 'staff') {
        response = await apiClient.get('/users/staff', { params });
      } else if (endpointKey === 'company') {
        response = await apiClient.get('/companies/my', { params });
      } else {
        response = await apiClient.get(endpoint.path, { params });
      }

      return response.data;
    } catch (err: any) {
      console.error(`Error fetching from ${endpointKey}:`, err);
      throw new Error(`Failed to fetch ${endpointKey}: ${err.message}`);
    }
  }, [apiClient]);

  const performAction = useCallback(async (action: string, data?: any): Promise<any> => {
    try {
      const endpoint = AVAILABLE_ENDPOINTS[action as keyof typeof AVAILABLE_ENDPOINTS];
      if (!endpoint) {
        throw new Error(`Action ${action} not supported`);
      }

      let response;
      
      switch (action) {
        case 'shifts':
          response = await apiClient.post('/shifts', data);
          break;
        case 'shiftRequests':
          response = await apiClient.post('/shifts/requests', data);
          break;
        case 'generatePayslip':
          response = await apiClient.post('/payslips/generate', data);
          break;
        case 'users':
          response = await apiClient.post('/users', data);
          break;
        case 'companyLocations':
          response = await apiClient.post('/companies/locations', data);
          break;
        case 'roles':
          response = await apiClient.post('/roles', data);
          break;
        case 'timeOff':
          response = await apiClient.post('/time-off/request', data);
          break;
        default:
          throw new Error(`Action ${action} not implemented`);
      }

      return response.data;
    } catch (err: any) {
      console.error(`Error performing action ${action}:`, err);
      throw new Error(`Failed to perform ${action}: ${err.message}`);
    }
  }, [apiClient]);

  const detectAppCommand = useCallback((message: string): {command: AppCommand; endpoint: string} | null => {
    const lowerMessage = message.toLowerCase().trim();
    
    for (const command of APP_COMMANDS) {
      const patterns = [
        `show me my ${command.name.replace('get_', '')}`,
        `get my ${command.name.replace('get_', '')}`,
        `view my ${command.name.replace('get_', '')}`,
        `check ${command.name.replace('get_', '')}`,
        `${command.name.replace('_', ' ')}`,
        `my ${command.name.replace('get_', '')}`,
        `what are my ${command.name.replace('get_', '')}`,
        `when are my ${command.name.replace('get_', '')}`,
      ];
      
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          return { command, endpoint: command.endpoint };
        }
      }
    }
    
    return null;
  }, []);

  const extractParameters = useCallback((message: string): Record<string, string> => {
    const params: Record<string, string> = {};
    
    // Extract common parameters
    const patterns = [
      { regex: /limit\s*[:=]?\s*(\d+)/i, key: 'limit' },
      { regex: /month\s*[:=]?\s*(\w+)/i, key: 'month' },
      { regex: /year\s*[:=]?\s*(\d{4})/i, key: 'year' },
      { regex: /status\s*[:=]?\s*(\w+)/i, key: 'status' },
      { regex: /start\s*date\s*[:=]?\s*([\d-]+)/i, key: 'start_date' },
      { regex: /end\s*date\s*[:=]?\s*([\d-]+)/i, key: 'end_date' },
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern.regex);
      if (match) {
        params[pattern.key] = match[1].trim();
      }
    }
    
    return params;
  }, []);

  const processAIResponse = useCallback(async (userQuery: string): Promise<string> => {
    try {
      const detectedCommand = detectAppCommand(userQuery);
      
      if (detectedCommand) {
        const params = extractParameters(userQuery);
        
        try {
          const fetchedData = await fetchData(detectedCommand.endpoint, params);
          
          // Format the data for the AI
          let dataSummary = '';
          
          switch (detectedCommand.endpoint) {
            case 'myShifts':
              if (fetchedData && fetchedData.length > 0) {
                dataSummary = `I found ${fetchedData.length} upcoming shifts:\n`;
                fetchedData.forEach((shift: any, index: number) => {
                  const start = new Date(shift.start_time);
                  const end = new Date(shift.end_time);
                  dataSummary += `${index + 1}. ${shift.title || 'Shift'} on ${start.toLocaleDateString()} from ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${shift.status})\n`;
                });
              } else {
                dataSummary = 'You have no upcoming shifts scheduled.';
              }
              break;
              
            case 'myPayslips':
              if (fetchedData && fetchedData.length > 0) {
                dataSummary = `I found ${fetchedData.length} recent payslips:\n`;
                fetchedData.slice(0, 5).forEach((payslip: any, index: number) => {
                  const amount = payslip.net_pay || payslip.total_earnings || 0;
                  dataSummary += `${index + 1}. ${payslip.payslip_number || 'Payslip'} - £${amount.toFixed(2)} for period ${payslip.pay_period_start} to ${payslip.pay_period_end} (${payslip.status})\n`;
                });
              } else {
                dataSummary = 'No payslips found for your account.';
              }
              break;
              
            case 'myLeaves':
              if (fetchedData && fetchedData.length > 0) {
                dataSummary = `I found ${fetchedData.length} leave requests:\n`;
                fetchedData.forEach((leave: any, index: number) => {
                  dataSummary += `${index + 1}. ${leave.leave_type} from ${leave.start_date} to ${leave.end_date} (${leave.status})\n`;
                });
              } else {
                dataSummary = 'No leave requests found for your account.';
              }
              break;
              
            case 'staff':
              if (fetchedData && fetchedData.length > 0) {
                dataSummary = `Staff directory has ${fetchedData.length} members:\n`;
                fetchedData.slice(0, 10).forEach((staff: any, index: number) => {
                  dataSummary += `${index + 1}. ${staff.first_name} ${staff.last_name} - ${staff.position || 'Staff Member'} (${staff.email})\n`;
                });
              } else {
                dataSummary = 'No staff members found in the directory.';
              }
              break;
              
            case 'company':
              if (fetchedData) {
                dataSummary = `Company: ${fetchedData.name || 'HourWize Company'}\n`;
                dataSummary += `Address: ${fetchedData.address || 'Not specified'}\n`;
                if (fetchedData.phone_number) {
                  dataSummary += `Phone: ${fetchedData.phone_number}\n`;
                }
              } else {
                dataSummary = 'Company information not available.';
              }
              break;
          }
          
          // Save fetched data to AsyncStorage for context
          await AsyncStorage.setItem('last_fetched_data', JSON.stringify({
            command: detectedCommand.command.name,
            data: fetchedData,
            timestamp: new Date().toISOString()
          }));
          
          return dataSummary;
          
        } catch (fetchError) {
          console.error('Error fetching data for AI:', fetchError);
          return `I tried to fetch ${detectedCommand.command.description.toLowerCase()}, but encountered an error. Please try again later or contact support.`;
        }
      }
      
      return ''; // No data to append
      
    } catch (error) {
      console.error('Error processing AI response:', error);
      return '';
    }
  }, [detectAppCommand, extractParameters, fetchData]);

  const sendMessage = useCallback(async (content: string, attachments: any[] = []) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    const userMessage: AIChatMessage = {
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        type: 'general',
        attachments
      }
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      // Check for app command and fetch data if needed
      const dataContext = await processAIResponse(content);
      
      // Prepare conversation history with system prompt
      const conversationHistory: ChatMessage[] = [
        { 
          role: 'system', 
          content: getSystemPrompt(),
          timestamp: new Date()
        },
        ...messages.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        } as ChatMessage)),
        {
          role: 'user',
          content,
          timestamp: new Date(),
          metadata: { attachments }
        } as ChatMessage
      ];

      // If we have data context, add it to the system prompt
      if (dataContext) {
        conversationHistory[0].content += `\n\nI have fetched the following data for the user's query:\n${dataContext}\n\nPlease use this data to answer their question.`;
      }

      // Get response from DeepSeek with enhanced context
      const response = await deepseekService.chatThroughBackend(conversationHistory);
      
      const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I couldn\'t process your request.';

      const assistantMessage: AIChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        metadata: {
          type: dataContext ? 'app_command' : 'general',
          command: detectAppCommand(content)?.command?.name,
          dataFetched: !!dataContext
        }
      };

      // Add assistant response
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save to chat history
      await saveChatHistory([userMessage, assistantMessage]);
      
    } catch (err: any) {
      setError(err.message || 'Failed to get response from AI');
      
      // Add error message
      const errorMessage: AIChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        metadata: { type: 'error' }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [messages, processAIResponse, detectAppCommand]);

  const saveChatHistory = async (newMessages: AIChatMessage[]) => {
    try {
      // Get existing history
      const existingHistory = await AsyncStorage.getItem('chat_history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Add new messages
      const updatedHistory = [...history, ...newMessages];
      
      // Keep only last 100 messages
      if (updatedHistory.length > 100) {
        updatedHistory.splice(0, updatedHistory.length - 100);
      }
      
      await AsyncStorage.setItem('chat_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const loadChatHistory = useCallback(async (page: number = 1) => {
    try {
      const existingHistory = await AsyncStorage.getItem('chat_history');
      if (existingHistory) {
        const history = JSON.parse(existingHistory);
        setMessages(history);
        setTotalMessages(history.length);
        setHasMoreHistory(history.length > 20);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, []);

  const loadMoreHistory = useCallback(async () => {
    if (!hasMoreHistory || isLoading) return;
    
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    
    // Load additional history if needed
    // For now, we're using AsyncStorage with all history loaded
    setHasMoreHistory(false);
  }, [hasMoreHistory, isLoading, historyPage]);

  const clearMessages = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('chat_history');
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your HourWize AI assistant. How can I help you today?',
          timestamp: new Date(),
          metadata: { type: 'general' }
        },
      ]);
      setHistoryPage(1);
      setTotalMessages(1);
      setHasMoreHistory(false);
      setError(null);
    } catch (error) {
      console.error('Failed to clear messages:', error);
      setError('Failed to clear chat history');
    }
  }, []);

  const fetchAppCommands = useCallback(async () => {
    try {
      // Commands are already defined locally
      setAppCommands(APP_COMMANDS);
    } catch (error) {
      console.error('Failed to fetch app commands:', error);
    }
  }, []);

  const fetchAvailableModels = useCallback(async () => {
    try {
      // Try to fetch from backend
      const response = await apiClient.get('/ai-chat/models');
      if (response.data.success) {
        setAvailableModels(response.data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Use default models
      setAvailableModels(['deepseek-chat', 'deepseek-coder']);
    }
  }, [apiClient]);

  // Initialize on mount
  useEffect(() => {
    loadChatHistory(1);
    fetchAppCommands();
    fetchAvailableModels();
  }, [loadChatHistory, fetchAppCommands, fetchAvailableModels]);

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
    appCommands,
    isTyping,
    hasMoreHistory,
    loadMoreHistory,
    fetchAppCommands,
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