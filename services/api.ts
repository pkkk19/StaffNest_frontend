import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Role, CreateRoleDto, UpdateRoleDto} from '../app/types/roles';

// At the top of your file
const USE_NGROK = false; // Set to false for local development

const getBaseURL = () => {
  if (USE_NGROK) {
    return 'https://a07d798a0150.ngrok-free.app';
  } else {
    return `https://staffnest-backend-production.up.railway.app`;
  }
};

interface Story {
  _id: string;
  userId: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
  duration: number;
  caption?: string;
  type: 'announcement' | 'policy' | 'event' | 'update' | 'personal';
  viewCount: number;
  hasViewed: boolean;
  isCurrentUser: boolean;
  createdAt: string;
  expiresAt: string;
  visibility: 'friends' | 'company' | 'both';
}

interface StoryGroup {
  userId: string;
  userInfo: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
  isCurrentUser: boolean;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
});

// Add auth token to requests automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authaccess_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    console.log('📊 Full Response:', JSON.stringify(response, null, 2));
    console.log('📊 Response Data:', response.data);
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', error.message);
    console.error('🔗 URL attempted:', error.config?.baseURL + error.config?.url);

    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
      console.error('📊 Response headers:', error.response.headers);

      // Handle token expiration (401 Unauthorized)
      if (error.response.status === 401) {
        console.log('🔄 Token expired, removing from storage');

        try {
          // Remove the expired token
          await AsyncStorage.removeItem('authaccess_token');

          // You can also emit an event or use a global state to notify the app
          // For now, we'll just log and let the component handle the redirect
          console.log('🔑 Token removed due to expiration');

          // You could also show an alert here if needed
          // Alert.alert('Session Expired', 'Please login again');
        } catch (storageError) {
          console.error('Error removing auth token:', storageError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    company_id?: string;
  }) => api.post('/auth/register', userData),
};

// Profile API calls
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData: any) => api.put('/profile', profileData),
  uploadProfilePicture: (formData: FormData) => 
    api.post('/profile/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  removeProfilePicture: () => api.post('/profile/remove-picture'),
};

// Companies API calls
export const companiesAPI = {
  getCompanies: () => api.get('/companies'),
  createCompany: (companyData: {
    name: string;
    address?: string;
    phone_number?: string;
    logo_url?: string;
  }) => api.post('/companies', companyData),
  getCompany: (id: string) => api.get(`/companies/${id}`),
  getMyCompany: () => api.get('/companies/my'),
  updateCompany: (companyData: any) => api.put('/companies', companyData),
  deleteCompany: (id: string) => api.delete(`/companies/${id}`),
  
  // Logo upload endpoints
  uploadLogo: (formData: FormData) => 
    api.post('/companies/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  removeLogo: () => api.post('/companies/remove-logo'),

  addLocation: (locationData: {
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    radius?: number;
    is_active?: boolean;
  }) => api.post('/companies/locations', locationData),

  getLocations: () => api.get('/companies/locations'),

  updateLocation: (locationIndex: number, locationData: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    is_active?: boolean;
  }) => api.put(`/companies/locations/${locationIndex}`, locationData),

  deleteLocation: (locationIndex: number) => api.delete(`/companies/locations/${locationIndex}`),
};

// Shifts API calls
export const shiftsAPI = {
  createShift: (shiftData: {
    title: string;
    description?: string;
    start_time: string;  // ISO string
    end_time: string;    // ISO string
    user_id?: string;
    location?: string;
    location_coordinates?: {
      latitude: number;
      longitude: number;
    };
    location_address?: string;
    color_hex?: string;
    type?: 'assigned' | 'open';
    status?: string;
  }) => api.post('/shifts', shiftData),

  getShift: (id: string) => api.get(`/shifts/${id}`),

  getShifts: (filters?: any) => 
    api.get('/shifts', { params: filters }),

  // Get user's shifts
  getMyShifts: (filters?: any) => 
    api.get('/shifts/my-shifts', { params: filters }),

  // Get open shifts
  getOpenShifts: (filters?: any) => 
    api.get('/shifts', { 
      params: { 
        type: 'open',
        ...filters 
      } 
    }),

  updateShift: (id: string, shiftData: any) =>
    api.put(`/shifts/${id}`, shiftData),
  deleteShift: (id: string) => api.delete(`/shifts/${id}`),
  deleteShiftsBulk: (data: {
    start_date?: string;
    end_date?: string;
    user_id?: string;
    status?: string;
    type?: string;
    day?: string;
    month?: string;
    week?: string;
    force?: boolean;
  }) => api.delete('/shifts/bulk', { data }),
  clockIn: (id: string, data?: {
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
  }) => api.post(`/shifts/${id}/clock-in`, data),
  clockOut: (id: string, data?: {
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
  }) => api.post(`/shifts/${id}/clock-out`, data),
};

// Rota API calls
export const rotaAPI = {
  getRota: () => api.get('/rota'),
  createRota: (rotaData: {
    title: string;
    description?: string;
    start_time: Date;
    end_time: Date;
    user_id: string;
    company_id: string;
    status?: string;
    notes?: string;
  }) => api.post('/rota', rotaData),
  getRotaItem: (id: string) => api.get(`/rota/${id}`),
  updateRotaItem: (id: string, rotaData: any) =>
    api.put(`/rota/${id}`, rotaData),
  deleteRotaItem: (id: string) => api.delete(`/rota/${id}`),
};

export const shiftRequestsAPI = {
  // Create shift request
  createRequest: (requestData: { shift_id: string; staff_notes?: string }) => 
    api.post('/shifts/requests', requestData),

  // Get shift requests (admin)
  getRequests: (status?: string) => 
    api.get('/shifts/requests', { 
      params: status ? { status } : {} 
    }),

  // Get user's shift requests
  getMyRequests: () => 
    api.get('/shifts/requests/my-requests'),

  // Update shift request (approve/reject)
  updateRequest: (id: string, updateData: { status: 'approved' | 'rejected'; admin_notes?: string }) => 
    api.patch(`/shifts/requests/${id}`, updateData),
};

export const staffAPI = {
  createStaff: (staffData: {
    // Core fields
    email: string;
    password?: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'staff';
    position?: string;
    phone_number?: string;
    date_of_birth?: string;
    address?: string;

    // Country selection
    country: string;

    // Flexible payroll data
    identification?: {
      employee_ref: string;
      // Country-specific IDs will be shown based on selected country
      ni_number?: string;    // UK
      ssn?: string;          // US  
      tfn?: string;          // AU
      pan?: string;          // NP
      uae_id?: string;       // AE
    };

    tax_info?: {
      // Will be populated based on country
      tax_code?: string;     // UK
      filing_status?: string; // US
      tax_scale?: string;    // AU
      tax_slab?: string;     // NP
    };

    payment_method?: {
      method: string;
      // Country-specific banking
      sort_code?: string;      // UK
      routing_number?: string; // US
      bsb_code?: string;       // AU
      account_number?: string;
    };

    employment?: {
      department?: string;
      employment_type?: string;
      pay_frequency?: string;
      start_date?: string;
      working_hours_per_week?: number;
    };

    pay_rates?: {
      default_hourly_rate?: number;
      default_salary?: number;
      overtime_rate?: number;
    };

    pension?: {
      employee_contribution_rate?: number;
      employer_contribution_rate?: number;
      is_salary_sacrifice?: boolean;
    };

    // Custom payment/deduction types can be added later
    payment_types?: any[];
    deduction_types?: any[];

  }) => api.post('/users', staffData),

  // Get all staff members
  getStaff: () => api.get('/users'),

  // Get staff members only (non-admin)
  getStaffMembers: () => api.get('/users/staff'),

  // Get specific staff member
  getStaffMember: (id: string) => api.get(`/users/${id}`),

  // Update staff member
  updateStaff: (id: string, staffData: any) => api.patch(`/users/${id}`, staffData),

  // Delete staff member
  deleteStaff: (id: string) => api.delete(`/users/${id}`),
};

export const chatAPI = {
  // Get conversations list
  getConversations: () => api.get('/chat/conversations'),

  // Create new conversation
  createConversation: (participantIds: string[], name?: string) =>
    api.post('/chat/conversations', { participantIds, name }),

  // Get messages for a conversation
  getMessages: (conversationId: string, page: number = 1) =>
    api.get(`/chat/conversations/${conversationId}/messages?page=${page}`),

  // Send a message
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { content }),

  // Mark messages as read
  markAsRead: (conversationId: string, messageIds: string[]) =>
    api.put(`/chat/conversations/${conversationId}/read`, { messageIds }),
};

export const contactsAPI = {
  // Search users
  searchUsers: (query: string) => api.get(`/contacts/search?q=${encodeURIComponent(query)}`),

  // Send friend request
  sendFriendRequest: (toUserId: string, message?: string) =>
    api.post('/contacts/friend-requests', { toUserId, message }),

  // Get pending requests
  getPendingRequests: () => api.get('/contacts/friend-requests/pending'),

  // Respond to friend request
  respondToRequest: (requestId: string, action: 'accepted' | 'rejected') =>
    api.put('/contacts/friend-requests/respond', { requestId, action }),

  // Get friends list
  getFriends: () => api.get('/contacts/friends'),

  // Remove friend
  removeFriend: (friendId: string) => api.delete(`/contacts/friends/${friendId}`),

  // Generate QR code for user
  generateQRCode: () => api.get('/contacts/qr-code'),

  // Add friend by QR code
  addFriendByQR: (qrData: string) => api.post('/contacts/qr-add', { qrData }),
};

export const rolesAPI = {
  // Get all roles for current company
  getRoles: (): Promise<{ data: Role[] }> => api.get('/roles'),
  
  // Get role with details (populated)
  getRoleWithDetails: (id: string): Promise<{ data: Role }> => 
    api.get(`/roles/${id}/details`),
  
  // Create a new role
  createRole: (roleData: CreateRoleDto) => api.post('/roles', roleData),
  
  // Update a role
  updateRole: (id: string, roleData: UpdateRoleDto) => api.put(`/roles/${id}`, roleData),
  
  // Delete a role
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  
  // Add shift to role
  addShiftToRole: (roleId: string, shiftData: any) => 
    api.post(`/roles/${roleId}/shifts`, shiftData),
  
  // Update shift
  updateShift: (roleId: string, shiftId: string, shiftData: any) =>
    api.put(`/roles/${roleId}/shifts/${shiftId}`, shiftData),
  
  // Delete shift
  deleteShift: (roleId: string, shiftId: string) =>
    api.delete(`/roles/${roleId}/shifts/${shiftId}`),
  
  // Add qualified user to role
  addQualifiedUser: (roleId: string, userId: string) =>
    api.post(`/roles/${roleId}/qualified-users`, { user_id: userId }),
  
  // Add multiple qualified users
  addQualifiedUsersBatch: (roleId: string, userIds: string[]) =>
    api.post(`/roles/${roleId}/qualified-users/batch`, { user_ids: userIds }),
  
  // Remove qualified user from role
  removeQualifiedUser: (roleId: string, userId: string) =>
    api.delete(`/roles/${roleId}/qualified-users/${userId}`),
};


export const payslipAPI = {

   createPayslip: (data: any) => api.post('/payslips/generate', data),
  // Get payslips with filters
  getPayslips: (filters?: {
    employee_id?: string;
    status?: string;
    year?: string;
    pay_period_start?: string;
    pay_period_end?: string;
  }) => api.get('/payslips', { params: filters }),

  // Get employee's own payslips
  getMyPayslips: (filters?: { status?: string; year?: string }) =>
    api.get('/payslips/my-payslips', { params: filters }),

  // Get specific payslip
  getPayslip: (id: string) => api.get(`/payslips/${id}`),

  // Generate payslip
  generatePayslip: (data: {
    employee_id: string;
    pay_period_start: string;
    pay_period_end: string;
    pay_date: string;
    include_shifts?: boolean;
  }) => api.post('/payslips/generate', data),

  // Bulk generate payslips
  bulkGeneratePayslips: (data: {
    employee_ids: string[];
    pay_period_start: string;
    pay_period_end: string;
    pay_date: string;
  }) => api.post('/payslips/bulk-generate', data),

  // Update payslip
updatePayslip: (id: string, data: any) => api.put(`/payslips/${id}`, data),

  // Approve payslip
  approvePayslip: (id: string) => api.post(`/payslips/${id}/approve`),

  // Reject payslip
  rejectPayslip: (id: string, rejection_reason: string) =>
    api.post(`/payslips/${id}/reject`, { rejection_reason }),

  // Mark as paid
  markPayslipAsPaid: (id: string) => api.post(`/payslips/${id}/mark-paid`),

  // Generate PDF
  generatePDF: (id: string) => api.post(`/payslips/${id}/generate-pdf`),

  // Get pay periods
  getPayPeriods: () => api.get('/payslips/periods'),

  // Get payslip summary
  getPayslipSummary: (id: string) => api.get(`/payslips/${id}/summary`),

  // Delete payslip
  deletePayslip: (id: string) => api.delete(`/payslips/${id}`),
};

// Make sure staffAPI is already defined in your fil

// Add payroll configuration API
export const payrollConfigAPI = {
  // Get country configuration
  getCountryConfig: (country: string) => api.get(`/payroll/config/${country}`),

  // Get available countries
  getAvailableCountries: () => api.get('/payroll/config/countries'),

  // Update employee payroll settings
  updateEmployeePayroll: (employeeId: string, data: any) =>
    api.put(`/users/${employeeId}/payroll`, data),

  // Get company payroll settings
  getCompanyPayrollSettings: () => api.get('/payroll/settings'),

  // Update company payroll settings
  updateCompanyPayrollSettings: (data: any) => api.put('/payroll/settings', data),
};

export const notificationAPI = {
  registerDevice: (data: { userId: string; token: string; platform: string }) =>
    api.post('/notifications/register-device', data),

  unregisterDevice: (data: { userId: string; token: string }) =>
    api.post('/notifications/unregister-device', data),

  getPreferences: () => api.get('/notifications/preferences'),

  updatePreferences: (preferences: any) => 
    api.put('/notifications/preferences', preferences),

  getNotificationHistory: () => api.get('/notifications/history'),

  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
};

export const storiesAPI = {
  // Upload a story (image or video)
  uploadStory: (formData: FormData) => 
    api.post('/stories/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Get stories feed for the current user
  getStoryFeed: () => api.get('/stories/feed'),

  // Get user's own stories
  getMyStories: () => api.get('/stories/my-stories'),

  // Mark a story as viewed
  viewStory: (storyId: string) => 
    api.post(`/stories/${storyId}/view`),

  // Get who viewed your story
  getStoryViews: (storyId: string) => 
    api.get(`/stories/${storyId}/views`),

  // Delete a story
  deleteStory: (storyId: string) => 
    api.delete(`/stories/${storyId}`),

  // Get story statistics
  getStats: () => api.get('/stories/stats'),
};

// Time Off API calls
export const timeOffAPI = {
  // Create a leave request
  createLeaveRequest: (data: {
    leave_type: 'time_off' | 'sick_leave' | 'paid_leave' | 'unpaid_leave' | 'annual_leave' | 'personal_leave';
    duration_type: 'all_day' | 'partial_day';
    start_date: string;
    end_date: string;
    start_time?: string;
    end_time?: string;
    reason: string;
    attachment_urls?: string[];
    is_half_day?: boolean;
    half_day_period?: 'morning' | 'afternoon';
    requested_hours?: number;
  }) => api.post('/time-off/request', data),

  // Get all leaves (admin)
   getAllLeaves: (filters?: {
    user_id?: string;
    leave_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    year?: string;
    limit?: number; // ADD THIS
  }) => api.get('/time-off', { params: filters }),

  // Get user's own leaves
  getMyLeaves: (filters?: {
    leave_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    year?: string;
    limit?: number; // ADD THIS
  }) => api.get('/time-off/my-leaves', { params: filters }),

  // Get leave summary
  getLeaveSummary: (year?: string) => api.get('/time-off/summary', { params: { year } }),

  // Get team calendar (admin)
  getTeamCalendar: (month?: number, year?: number) => 
    api.get('/time-off/team-calendar', { params: { month, year } }),

  // Get single leave
  getLeave: (id: string) => api.get(`/time-off/${id}`),

  // Update leave request
  updateLeave: (id: string, data: any) => api.put(`/time-off/${id}`, data),

  // Approve/reject leave (admin)
  approveOrRejectLeave: (id: string, data: {
    status: 'approved' | 'rejected';
    rejection_reason?: string;
    update_user_balance?: boolean;
  }) => api.patch(`/time-off/${id}/approve`, data),

  // Cancel leave request
  cancelLeave: (id: string) => api.patch(`/time-off/${id}/cancel`, {}),

  // Get company stats (admin)
  getCompanyStats: (year?: string) => api.get('/time-off/stats/company', { params: { year } }),

  // Delete leave (admin)
  deleteLeave: (id: string) => api.delete(`/time-off/${id}`),

  // Get user leave balance (admin)
  getUserLeaveBalance: (userId: string) => api.get(`/time-off/user/${userId}/balance`),
};

export const autoGenerationAPI = {
  // Generate schedule using algorithms
  generateSchedule: (data: {
    period: 'day' | 'week' | 'month' | 'custom';
    start_date?: string;
    end_date?: string;
    fill_open_only?: boolean;
    consider_preferences?: boolean;
    ensure_legal_compliance?: boolean;
    auto_create_shifts?: boolean;
    algorithm?: 'round_robin' | 'fair_share' | 'coverage_first' | 'preference_based';
    balance_workload?: boolean;
    max_shifts_per_staff?: number;
    excluded_staff_ids?: string[];
    notes?: string;
  }) => api.post('/auto-scheduling/generate', data),

  // Get available staff for a shift
  getAvailableStaff: (roleId: string, startTime: string, endTime: string) => 
    api.get(`/auto-scheduling/available-staff/${roleId}`, {
      params: { start_time: startTime, end_time: endTime }
    }),

  // Get scheduling history
  getScheduleHistory: (limit?: number, page?: number) => 
    api.get('/auto-scheduling/history', { params: { limit, page } }),

  // Get available algorithms
  getAlgorithms: () => api.get('/auto-scheduling/algorithms'),

  // Fill open shifts
  fillOpenShifts: () => api.post('/auto-scheduling/fill-open-shifts'),

  // Preview schedule (without creating)
  previewSchedule: (data: {
    period: 'day' | 'week' | 'month' | 'custom';
    start_date?: string;
    end_date?: string;
    fill_open_only?: boolean;
    consider_preferences?: boolean;
    ensure_legal_compliance?: boolean;
    algorithm?: string;
    balance_workload?: boolean;
  }) => api.post('/auto-scheduling/preview', data),
};

export default api;