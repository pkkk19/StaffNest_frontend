// hooks/useShiftRequests.ts
import { useState, useCallback } from 'react';
import { shiftRequestsAPI } from '@/services/api';

export function useShiftRequests() {
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const requestShift = useCallback(async (shiftId: string, notes?: string) => {
    try {
      setRequestLoading(true);
      console.log('📤 Requesting shift:', shiftId);
      const response = await shiftRequestsAPI.createRequest({
        shift_id: shiftId,
        staff_notes: notes,
      });
      console.log('✅ Shift request successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Shift request error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to request shift';
      throw new Error(errorMessage);
    } finally {
      setRequestLoading(false);
    }
  }, []);

  const getShiftRequests = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      console.log('📤 Fetching shift requests with status:', status || 'all');
      const response = await shiftRequestsAPI.getRequests(status);
      console.log('✅ Shift requests fetched:', response.data?.length || 0, 'requests');
      return response.data;
    } catch (error: any) {
      console.error('❌ Fetch shift requests error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      const errorMessage = error.response?.data?.message || 'Failed to fetch shift requests';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyRequests = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📤 Fetching my shift requests');
      const response = await shiftRequestsAPI.getMyRequests();
      console.log('✅ My requests fetched:', response.data?.length || 0, 'requests');
      return response.data;
    } catch (error: any) {
      console.error('❌ Fetch my requests error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch your requests';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRequest = useCallback(async (requestId: string, adminNotes?: string) => {
    try {
      console.log('📤 Approving request:', requestId);
      const response = await shiftRequestsAPI.updateRequest(requestId, {
        status: 'approved',
        admin_notes: adminNotes,
      });
      console.log('✅ Request approved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Approve request error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to approve request';
      throw new Error(errorMessage);
    }
  }, []);

  const rejectRequest = useCallback(async (requestId: string, adminNotes?: string) => {
    try {
      console.log('📤 Rejecting request:', requestId);
      const response = await shiftRequestsAPI.updateRequest(requestId, {
        status: 'rejected',
        admin_notes: adminNotes,
      });
      console.log('✅ Request rejected:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Reject request error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject request';
      throw new Error(errorMessage);
    }
  }, []);

  return {
    requestShift,
    getShiftRequests,
    getMyRequests,
    approveRequest,
    rejectRequest,
    loading,
    requestLoading,
  };
}