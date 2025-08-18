import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { addRequest, updateRequestStatus } from '@/store/slices/holidaySlice';
import { Calendar, Plus, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Sun, Plane } from 'lucide-react-native';
import Constants from 'expo-constants';

export default function Holidays() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { requests, balances } = useSelector((state: RootState) => state.holiday);
  const dispatch = useDispatch();
  
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [selectedTab, setSelectedTab] = useState<'requests' | 'balance'>('requests');

  // Mock data
  const mockRequests = [
    {
      id: '1',
      staffId: user?.id || '1',
      staffName: user?.name || 'Staff Member',
      startDate: '2025-02-15',
      endDate: '2025-02-22',
      days: 6,
      reason: 'Family vacation',
      status: 'pending' as const,
      submittedDate: '2025-01-15',
    },
    {
      id: '2',
      staffId: user?.id || '1',
      staffName: user?.name || 'Staff Member',
      startDate: '2024-12-23',
      endDate: '2024-12-30',
      days: 6,
      reason: 'Christmas holidays',
      status: 'approved' as const,
      submittedDate: '2024-11-20',
      approvedBy: 'Manager',
      approvedDate: '2024-11-22',
    },
    {
      id: '3',
      staffId: '2',
      staffName: 'Sarah Johnson',
      startDate: '2025-01-20',
      endDate: '2025-01-22',
      days: 3,
      reason: 'Personal matters',
      status: 'declined' as const,
      submittedDate: '2025-01-10',
      approvedBy: 'Manager',
      approvedDate: '2025-01-12',
      notes: 'Insufficient coverage during this period',
    },
  ];

  const mockBalance = {
    staffId: user?.id || '1',
    totalAllowance: 25,
    usedDays: 12,
    pendingDays: 6,
    remainingDays: 7,
  };

  const userRequests = user?.role === 'admin' 
    ? mockRequests 
    : mockRequests.filter(req => req.staffId === user?.id);

  const submitRequest = () => {
    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newRequest = {
      id: Date.now().toString(),
      staffId: user!.id,
      staffName: user!.name,
      startDate,
      endDate,
      days,
      reason: reason.trim(),
      status: 'pending' as const,
      submittedDate: new Date().toISOString().split('T')[0],
    };

    dispatch(addRequest(newRequest));
    setRequestModalVisible(false);
    setStartDate('');
    setEndDate('');
    setReason('');
    Alert.alert('Success', 'Holiday request submitted successfully');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#059669" />;
      case 'declined':
        return <XCircle size={16} color="#DC2626" />;
      default:
        return <Clock size={16} color="#EA580C" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#059669';
      case 'declined':
        return '#DC2626';
      default:
        return '#EA580C';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sun size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Holidays</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setRequestModalVisible(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'requests' && styles.activeTab]}
          onPress={() => setSelectedTab('requests')}
        >
          <Text style={[styles.tabText, selectedTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'balance' && styles.activeTab]}
          onPress={() => setSelectedTab('balance')}
        >
          <Text style={[styles.tabText, selectedTab === 'balance' && styles.activeTabText]}>
            Balance
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'balance' && (
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Plane size={24} color="#2563EB" />
                <Text style={styles.balanceTitle}>Holiday Allowance</Text>
              </View>
              
              <View style={styles.balanceGrid}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceValue}>{mockBalance.totalAllowance}</Text>
                  <Text style={styles.balanceLabel}>Total Days</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceValue, { color: '#DC2626' }]}>
                    {mockBalance.usedDays}
                  </Text>
                  <Text style={styles.balanceLabel}>Used</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceValue, { color: '#EA580C' }]}>
                    {mockBalance.pendingDays}
                  </Text>
                  <Text style={styles.balanceLabel}>Pending</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceValue, { color: '#059669' }]}>
                    {mockBalance.remainingDays}
                  </Text>
                  <Text style={styles.balanceLabel}>Remaining</Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(mockBalance.usedDays / mockBalance.totalAllowance) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'requests' && (
          <View style={styles.requestsSection}>
            {userRequests.map((request) => (
              <View key={`request-${request.id}`} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestDates}>
                      {new Date(request.startDate).toLocaleDateString('en-GB')} - {' '}
                      {new Date(request.endDate).toLocaleDateString('en-GB')}
                    </Text>
                    <Text style={styles.requestDays}>{request.days} days</Text>
                  </View>
                  <View style={styles.requestStatus}>
                    {getStatusIcon(request.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.requestReason}>{request.reason}</Text>

                <View style={styles.requestFooter}>
                  <Text style={styles.requestSubmitted}>
                    Submitted {new Date(request.submittedDate).toLocaleDateString('en-GB')}
                  </Text>
                </View>

                {request.notes && (
                  <View style={styles.requestNotes}>
                    <AlertCircle size={14} color="#EA580C" />
                    <Text style={styles.notesText}>{request.notes}</Text>
                  </View>
                )}
              </View>
            ))}

            {userRequests.length === 0 && (
              <View style={styles.noRequests}>
                <Sun size={48} color="#E5E7EB" />
                <Text style={styles.noRequestsTitle}>No holiday requests</Text>
                <Text style={styles.noRequestsText}>
                  You haven't submitted any holiday requests yet
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* New Request Modal */}
      <Modal
        visible={requestModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Holiday Request</Text>
            <TouchableOpacity onPress={submitRequest}>
              <Text style={styles.modalSave}>Submit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Please provide a reason for your holiday request..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.balanceInfo}>
              <Text style={styles.balanceInfoTitle}>Your Holiday Balance</Text>
              <Text style={styles.balanceInfoText}>
                Remaining: {mockBalance.remainingDays} days
              </Text>
              <Text style={styles.balanceInfoText}>
                Pending: {mockBalance.pendingDays} days
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statusBarSpacer: {
    height: Constants.statusBarHeight,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
  },
  balanceSection: {
    padding: 24,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  requestsSection: {
    padding: 24,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestDates: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  requestStaff: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  requestDays: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  requestReason: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestSubmitted: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#059669',
    gap: 4,
  },
  approveButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    gap: 4,
  },
  declineButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  requestNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    gap: 8,
  },
  notesText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    flex: 1,
  },
  noRequests: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  noRequestsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noRequestsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  modalContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  balanceInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  balanceInfoTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  balanceInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#3730A3',
    marginBottom: 2,
  },
});