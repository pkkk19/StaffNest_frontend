// import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
// import { Calendar, Plus, Filter, Check, X, MessageSquare } from 'lucide-react-native';
// import { useState } from 'react';
// import { useTheme } from '@/contexts/ThemeContext';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { useAuth } from '@/contexts/AuthContext';

// export default function Holidays() {
//   const { theme } = useTheme();
//   const { t } = useLanguage();
//   const { user } = useAuth();
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [showApprovalModal, setShowApprovalModal] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState<any>(null);
//   const [filter, setFilter] = useState('all');
//   const [rejectionReason, setRejectionReason] = useState('');

//   // New holiday request form
//   const [newRequest, setNewRequest] = useState({
//     startDate: '',
//     endDate: '',
//     reason: '',
//     type: 'annual'
//   });

//   const styles = createStyles(theme);

//   const holidayRequests = [
//     {
//       id: 1,
//       staffName: 'John Smith',
//       startDate: '2025-02-15',
//       endDate: '2025-02-19',
//       days: 5,
//       type: 'Annual Leave',
//       reason: 'Family vacation',
//       status: 'pending',
//       requestDate: '2025-01-10',
//       isOwnRequest: user?.fullName === 'John Smith'
//     },
//     {
//       id: 2,
//       staffName: 'Sarah Johnson',
//       startDate: '2025-01-25',
//       endDate: '2025-01-25',
//       days: 1,
//       type: 'Sick Leave',
//       reason: 'Medical appointment',
//       status: 'approved',
//       requestDate: '2025-01-15',
//       approvedBy: 'Manager',
//       isOwnRequest: user?.fullName === 'Sarah Johnson'
//     },
//     {
//       id: 3,
//       staffName: 'Mike Wilson',
//       startDate: '2025-03-01',
//       endDate: '2025-03-03',
//       days: 3,
//       type: 'Personal Leave',
//       reason: 'Moving house',
//       status: 'rejected',
//       requestDate: '2025-01-12',
//       rejectedBy: 'Manager',
//       rejectionReason: 'Insufficient coverage during busy period',
//       isOwnRequest: user?.fullName === 'Mike Wilson'
//     },
//   ];

//   const filteredRequests = holidayRequests.filter(request => {
//     if (user?.role === 'staff' && !request.isOwnRequest) return false;
    
//     switch (filter) {
//       case 'pending': return request.status === 'pending';
//       case 'approved': return request.status === 'approved';
//       case 'rejected': return request.status === 'rejected';
//       default: return true;
//     }
//   });

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'approved': return '#10B981';
//       case 'rejected': return '#EF4444';
//       case 'pending': return '#F59E0B';
//       default: return '#6B7280';
//     }
//   };

//   const handleSubmitRequest = () => {
//     if (!newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
//       Alert.alert(t('error'), t('fillAllFields'));
//       return;
//     }

//     Alert.alert(t('success'), t('holidayRequestSubmitted'));
//     setShowRequestModal(false);
//     setNewRequest({ startDate: '', endDate: '', reason: '', type: 'annual' });
//   };

//   const handleApproval = (requestId: number, approved: boolean) => {
//     if (!approved && !rejectionReason.trim()) {
//       Alert.alert(t('error'), t('rejectionReasonRequired'));
//       return;
//     }

//     const action = approved ? t('approved') : t('rejected');
//     Alert.alert(t('success'), `${t('holidayRequest')} ${action}`);
//     setShowApprovalModal(false);
//     setSelectedRequest(null);
//     setRejectionReason('');
//   };

//   const HolidayRequestCard = ({ request }: any) => (
//     <View style={styles.requestCard}>
//       <View style={styles.requestHeader}>
//         <View>
//           <Text style={styles.requestStaff}>{request.staffName}</Text>
//           <Text style={styles.requestDates}>
//             {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
//           </Text>
//         </View>
//         <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
//           <Text style={styles.statusText}>{t(request.status)}</Text>
//         </View>
//       </View>

//       <View style={styles.requestDetails}>
//         <Text style={styles.requestType}>{request.type} • {request.days} {t('days')}</Text>
//         <Text style={styles.requestReason}>{request.reason}</Text>
//         {request.rejectionReason && (
//           <View style={styles.rejectionContainer}>
//             <Text style={styles.rejectionLabel}>{t('rejectionReason')}:</Text>
//             <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
//           </View>
//         )}
//       </View>

//       {user?.role === 'admin' && request.status === 'pending' && (
//         <View style={styles.actionButtons}>
//           <TouchableOpacity 
//             style={styles.approveButton}
//             onPress={() => handleApproval(request.id, true)}
//           >
//             <Check size={16} color="#FFFFFF" />
//             <Text style={styles.approveButtonText}>{t('approve')}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.rejectButton}
//             onPress={() => {
//               setSelectedRequest(request);
//               setShowApprovalModal(true);
//             }}
//           >
//             <X size={16} color="#FFFFFF" />
//             <Text style={styles.rejectButtonText}>{t('reject')}</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>{t('holidays')}</Text>
//         {user?.role === 'staff' && (
//           <TouchableOpacity 
//             style={styles.addButton}
//             onPress={() => setShowRequestModal(true)}
//           >
//             <Plus size={24} color="#FFFFFF" />
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.filterContainer}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           {['all', 'pending', 'approved', 'rejected'].map((filterType) => (
//             <TouchableOpacity
//               key={filterType}
//               style={[
//                 styles.filterButton,
//                 filter === filterType && styles.filterButtonActive
//               ]}
//               onPress={() => setFilter(filterType)}
//             >
//               <Text style={[
//                 styles.filterButtonText,
//                 filter === filterType && styles.filterButtonTextActive
//               ]}>
//                 {t(filterType)}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </View>

//       <ScrollView style={styles.content}>
//         {user?.role === 'staff' && (
//           <View style={styles.balanceCard}>
//             <Text style={styles.balanceTitle}>{t('holidayBalance')}</Text>
//             <View style={styles.balanceGrid}>
//               <View style={styles.balanceItem}>
//                 <Text style={styles.balanceValue}>25</Text>
//                 <Text style={styles.balanceLabel}>{t('totalDays')}</Text>
//               </View>
//               <View style={styles.balanceItem}>
//                 <Text style={styles.balanceValue}>18</Text>
//                 <Text style={styles.balanceLabel}>{t('remaining')}</Text>
//               </View>
//               <View style={styles.balanceItem}>
//                 <Text style={styles.balanceValue}>7</Text>
//                 <Text style={styles.balanceLabel}>{t('used')}</Text>
//               </View>
//             </View>
//           </View>
//         )}

//         {filteredRequests.map(request => (
//           <HolidayRequestCard key={request.id} request={request} />
//         ))}
//       </ScrollView>

//       {/* New Holiday Request Modal */}
//       <Modal
//         visible={showRequestModal}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setShowRequestModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>{t('newHolidayRequest')}</Text>
//               <TouchableOpacity onPress={() => setShowRequestModal(false)}>
//                 <X size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
//               </TouchableOpacity>
//             </View>

//             <ScrollView style={styles.modalBody}>
//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>{t('startDate')}</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="YYYY-MM-DD"
//                   placeholderTextColor="#6B7280"
//                   value={newRequest.startDate}
//                   onChangeText={(text) => setNewRequest({...newRequest, startDate: text})}
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>{t('endDate')}</Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="YYYY-MM-DD"
//                   placeholderTextColor="#6B7280"
//                   value={newRequest.endDate}
//                   onChangeText={(text) => setNewRequest({...newRequest, endDate: text})}
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>{t('leaveType')}</Text>
//                 <View style={styles.typeButtons}>
//                   {['annual', 'sick', 'personal'].map((type) => (
//                     <TouchableOpacity
//                       key={type}
//                       style={[
//                         styles.typeButton,
//                         newRequest.type === type && styles.typeButtonActive
//                       ]}
//                       onPress={() => setNewRequest({...newRequest, type})}
//                     >
//                       <Text style={[
//                         styles.typeButtonText,
//                         newRequest.type === type && styles.typeButtonTextActive
//                       ]}>
//                         {t(type)}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>{t('reason')}</Text>
//                 <TextInput
//                   style={[styles.input, styles.textArea]}
//                   placeholder={t('enterReason')}
//                   placeholderTextColor="#6B7280"
//                   value={newRequest.reason}
//                   onChangeText={(text) => setNewRequest({...newRequest, reason: text})}
//                   multiline
//                   numberOfLines={4}
//                 />
//               </View>

//               <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRequest}>
//                 <Text style={styles.submitButtonText}>{t('submitRequest')}</Text>
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* Approval/Rejection Modal */}
//       <Modal
//         visible={showApprovalModal}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setShowApprovalModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>{t('reviewRequest')}</Text>
//               <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
//                 <X size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.modalBody}>
//               {selectedRequest && (
//                 <View style={styles.requestSummary}>
//                   <Text style={styles.summaryTitle}>{selectedRequest.staffName}</Text>
//                   <Text style={styles.summaryDates}>
//                     {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
//                   </Text>
//                   <Text style={styles.summaryReason}>{selectedRequest.reason}</Text>
//                 </View>
//               )}

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>{t('rejectionReason')} ({t('optional')})</Text>
//                 <TextInput
//                   style={[styles.input, styles.textArea]}
//                   placeholder={t('enterRejectionReason')}
//                   placeholderTextColor="#6B7280"
//                   value={rejectionReason}
//                   onChangeText={setRejectionReason}
//                   multiline
//                   numberOfLines={3}
//                 />
//               </View>

//               <View style={styles.approvalActions}>
//                 <TouchableOpacity 
//                   style={styles.approveButton}
//                   onPress={() => handleApproval(selectedRequest?.id, true)}
//                 >
//                   <Check size={16} color="#FFFFFF" />
//                   <Text style={styles.approveButtonText}>{t('approve')}</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   style={styles.rejectButton}
//                   onPress={() => handleApproval(selectedRequest?.id, false)}
//                 >
//                   <X size={16} color="#FFFFFF" />
//                   <Text style={styles.rejectButtonText}>{t('reject')}</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// function createStyles(theme: string) {
//   const isDark = theme === 'dark';
  
//   return StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: isDark ? '#111827' : '#F9FAFB',
//     },
//     header: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       padding: 20,
//       paddingTop: 60,
//       backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
//       borderBottomWidth: 1,
//       borderBottomColor: isDark ? '#374151' : '#E5E7EB',
//     },
//     title: {
//       fontSize: 24,
//       fontWeight: '700',
//       color: isDark ? '#F9FAFB' : '#111827',
//     },
//     addButton: {
//       backgroundColor: '#2563EB',
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     filterContainer: {
//       paddingHorizontal: 20,
//       paddingVertical: 16,
//       backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
//     },
//     filterButton: {
//       paddingHorizontal: 16,
//       paddingVertical: 8,
//       borderRadius: 20,
//       backgroundColor: isDark ? '#374151' : '#F3F4F6',
//       marginRight: 8,
//     },
//     filterButtonActive: {
//       backgroundColor: '#2563EB',
//     },
//     filterButtonText: {
//       fontSize: 14,
//       color: isDark ? '#9CA3AF' : '#6B7280',
//       fontWeight: '500',
//     },
//     filterButtonTextActive: {
//       color: '#FFFFFF',
//     },
//     content: {
//       flex: 1,
//       padding: 20,
//     },
//     balanceCard: {
//       backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
//       borderRadius: 16,
//       padding: 20,
//       marginBottom: 20,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: isDark ? 0.3 : 0.1,
//       shadowRadius: 8,
//       elevation: 5,
//     },
//     balanceTitle: {
//       fontSize: 18,
//       fontWeight: '600',
//       color: isDark ? '#F9FAFB' : '#111827',
//       marginBottom: 16,
//     },
//     balanceGrid: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//     },
//     balanceItem: {
//       alignItems: 'center',
//     },
//     balanceValue: {
//       fontSize: 24,
//       fontWeight: '700',
//       color: '#2563EB',
//       marginBottom: 4,
//     },
//     balanceLabel: {
//       fontSize: 12,
//       color: isDark ? '#9CA3AF' : '#6B7280',
//       textAlign: 'center',
//     },
//     requestCard: {
//       backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
//       borderRadius: 12,
//       padding: 16,
//       marginBottom: 12,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: isDark ? 0.3 : 0.1,
//       shadowRadius: 4,
//       elevation: 3,
//     },
//     requestHeader: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'flex-start',
//       marginBottom: 12,
//     },
//     requestStaff: {
//       fontSize: 16,
//       fontWeight: '600',
//       color: isDark ? '#F9FAFB' : '#111827',
//       marginBottom: 4,
//     },
//     requestDates: {
//       fontSize: 14,
//       color: isDark ? '#9CA3AF' : '#6B7280',
//     },
//     statusBadge: {
//       paddingHorizontal: 8,
//       paddingVertical: 4,
//       borderRadius: 6,
//     },
//     statusText: {
//       fontSize: 12,
//       fontWeight: '500',
//       color: '#FFFFFF',
//     },
//     requestDetails: {
//       marginBottom: 16,
//     },
//     requestType: {
//       fontSize: 14,
//       fontWeight: '500',
//       color: isDark ? '#F9FAFB' : '#111827',
//       marginBottom: 8,
//     },
//     requestReason: {
//       fontSize: 14,
//       color: isDark ? '#9CA3AF' : '#6B7280',
//       lineHeight: 20,
//     },
//     rejectionContainer: {
//       marginTop: 12,
//       padding: 12,
//       backgroundColor: isDark ? '#374151' : '#FEF2F2',
//       borderRadius: 8,
//       borderLeftWidth: 3,
//       borderLeftColor: '#EF4444',
//     },
//     rejectionLabel: {
//       fontSize: 12,
//       fontWeight: '600',
//       color: '#EF4444',
//       marginBottom: 4,
//     },
//     rejectionText: {
//       fontSize: 14,
//       color: isDark ? '#F9FAFB' : '#111827',
//       lineHeight: 18,
//     },
//     actionButtons: {
//       flexDirection: 'row',
//       gap: 12,
//     },
//     approveButton: {
//       flex: 1,
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: '#10B981',
//       borderRadius: 8,
//       paddingVertical: 12,
//       gap: 8,
//     },
//     approveButtonText: {
//       fontSize: 14,
//       fontWeight: '600',
//       color: '#FFFFFF',
//     },
//     rejectButton: {
//       flex: 1,
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: '#EF4444',
//       borderRadius: 8,
//       paddingVertical: 12,
//       gap: 8,
//     },
//     rejectButtonText: {
//       fontSize: 14,
//       fontWeight: '600',
//       color: '#FFFFFF',
//     },
//     modalOverlay: {
//       flex: 1,
//       backgroundColor: 'rgba(0, 0, 0, 0.5)',
//       justifyContent: 'center',
//       alignItems: 'center',
//     },
//     modalContent: {
//       backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
//       borderRadius: 20,
//       width: '90%',
//       maxHeight: '80%',
//     },
//     modalHeader: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       padding: 20,
//       borderBottomWidth: 1,
//       borderBottomColor: isDark ? '#374151' : '#E5E7EB',
//     },
//     modalTitle: {
//       fontSize: 18,
//       fontWeight: '600',
//       color: isDark ? '#F9FAFB' : '#111827',
//     },
//     modalBody: {
//       padding: 20,
//     },
//     inputGroup: {
//       marginBottom: 20,
//     },
//     inputLabel: {
//       fontSize: 14,
//       fontWeight: '500',
//       color: isDark ? '#F9FAFB' : '#111827',
//       marginBottom: 8,
//     },
//     input: {
//       backgroundColor: isDark ? '#374151' : '#FFFFFF',
//       borderRadius: 12,
//       paddingHorizontal: 16,
//       paddingVertical: 16,
//       fontSize: 16,
//       color: isDark ? '#F9FAFB' : '#111827',
//       borderWidth: 1,
//       borderColor: isDark ? '#4B5563' : '#E5E7EB',
//     },
//     textArea: {
//       height: 80,
//       textAlignVertical: 'top',
//     },
//     typeButtons: {
//       flexDirection: 'row',
//       gap: 8,
//     },
//     typeButton: {
//       flex: 1,
//       paddingVertical: 12,
//       paddingHorizontal: 16,
//       borderRadius: 8,
//       backgroundColor: isDark ? '#374151' : '#F3F4F6',
//       alignItems: 'center',
//     },
//     typeButtonActive: {
//       backgroundColor: '#2563EB',
//     },
//     typeButtonText: {
//       fontSize: 14,
//       fontWeight: '500',
//       color: isDark ? '#9CA3AF' : '#6B7280',
//     },
//     typeButtonTextActive: {
//       color: '#FFFFFF',
//     },
//     submitButton: {
//       backgroundColor: '#2563EB',
//       borderRadius: 12,
//       paddingVertical: 16,
//       alignItems: 'center',
//       marginTop: 20,
//     },
//     submitButtonText: {
//       fontSize: 16,
//       fontWeight: '600',
//       color: '#FFFFFF',
//     },
//     requestSummary: {
//       backgroundColor: isDark ? '#374151' : '#F3F4F6',
//       padding: 16,
//       borderRadius: 12,
//       marginBottom: 20,
//     },
//     summaryTitle: {
//       fontSize: 16,
//       fontWeight: '600',
//       color: isDark ? '#F9FAFB' : '#111827',
//       marginBottom: 4,
//     },
//     summaryDates: {
//       fontSize: 14,
//       color: isDark ? '#9CA3AF' : '#6B7280',
//       marginBottom: 8,
//     },
//     summaryReason: {
//       fontSize: 14,
//       color: isDark ? '#F9FAFB' : '#111827',
//       fontStyle: 'italic',
//     },
//     approvalActions: {
//       flexDirection: 'row',
//       gap: 12,
//       marginTop: 20,
//     },
//   });
// }