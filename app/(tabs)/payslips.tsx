import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FileText, Download, Eye, Calendar, DollarSign, TrendingUp, Filter, Search } from 'lucide-react-native';
import Constants from 'expo-constants';

interface Payslip {
  id: string;
  staffId: string;
  staffName: string;
  period: string;
  grossPay: number;
  netPay: number;
  tax: number;
  ni: number;
  pension: number;
  hoursWorked: number;
  hourlyRate: number;
  overtime: number;
  bonus: number;
  deductions: number;
  currency: string;
  generatedDate: string;
  status: 'draft' | 'sent' | 'viewed';
}

export default function Payslips() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all');

  // Mock payslip data
  const mockPayslips: Payslip[] = [
    {
      id: '1',
      staffId: user?.id || '1',
      staffName: user?.name || 'Staff Member',
      period: 'December 2024',
      grossPay: 2800,
      netPay: 2240,
      tax: 420,
      ni: 140,
      pension: 84,
      hoursWorked: 160,
      hourlyRate: 17.50,
      overtime: 0,
      bonus: 0,
      deductions: 0,
      currency: 'GBP',
      generatedDate: '2024-12-31',
      status: 'viewed',
    },
    {
      id: '2',
      staffId: user?.id || '1',
      staffName: user?.name || 'Staff Member',
      period: 'November 2024',
      grossPay: 2650,
      netPay: 2120,
      tax: 397.50,
      ni: 132.50,
      pension: 79.50,
      hoursWorked: 152,
      hourlyRate: 17.50,
      overtime: 0,
      bonus: 0,
      deductions: 0,
      currency: 'GBP',
      generatedDate: '2024-11-30',
      status: 'viewed',
    },
    {
      id: '3',
      staffId: user?.id || '1',
      staffName: user?.name || 'Staff Member',
      period: 'October 2024',
      grossPay: 2975,
      netPay: 2380,
      tax: 446.25,
      ni: 148.75,
      pension: 89.25,
      hoursWorked: 170,
      hourlyRate: 17.50,
      overtime: 8,
      bonus: 100,
      deductions: 0,
      currency: 'GBP',
      generatedDate: '2024-10-31',
      status: 'viewed',
    },
  ];

  const userPayslips = user?.role === 'admin' 
    ? mockPayslips 
    : mockPayslips.filter(p => p.staffId === user?.id);

  const viewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setModalVisible(true);
  };

  const downloadPayslip = (payslip: Payslip) => {
    Alert.alert('Download', `Downloading payslip for ${payslip.period}`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : 'Rs.';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const totalEarnings = userPayslips.reduce((total, payslip) => total + payslip.netPay, 0);
  const avgMonthlyPay = userPayslips.length > 0 ? totalEarnings / userPayslips.length : 0;

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Payslips</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <DollarSign size={24} color="#059669" />
              <Text style={styles.summaryValue}>
                {formatCurrency(totalEarnings, 'GBP')}
              </Text>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <TrendingUp size={24} color="#2563EB" />
              <Text style={styles.summaryValue}>
                {formatCurrency(avgMonthlyPay, 'GBP')}
              </Text>
              <Text style={styles.summaryLabel}>Avg Monthly</Text>
            </View>
          </View>
        </View>

        {/* Payslips List */}
        <View style={styles.payslipsSection}>
          <Text style={styles.sectionTitle}>Payslip History</Text>
          
          {userPayslips.map((payslip) => (
            <View key={`payslip-${payslip.id}`} style={styles.payslipCard}>
              <View style={styles.payslipHeader}>
                <View style={styles.payslipInfo}>
                  <Text style={styles.payslipPeriod}>{payslip.period}</Text>
                  <Text style={styles.payslipHours}>
                    {payslip.hoursWorked} hours worked
                  </Text>
                </View>
                <View style={styles.payslipAmount}>
                  <Text style={styles.grossPay}>
                    {formatCurrency(payslip.grossPay, payslip.currency)}
                  </Text>
                  <Text style={styles.netPay}>
                    Net: {formatCurrency(payslip.netPay, payslip.currency)}
                  </Text>
                </View>
              </View>

              <View style={styles.payslipActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => viewPayslip(payslip)}
                >
                  <Eye size={16} color="#2563EB" />
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => downloadPayslip(payslip)}
                >
                  <Download size={16} color="#059669" />
                  <Text style={styles.actionButtonText}>Download</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: 
                payslip.status === 'viewed' ? '#059669' : 
                payslip.status === 'sent' ? '#EA580C' : '#6B7280' 
              }]}>
                <Text style={styles.statusText}>
                  {payslip.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Payslip Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Payslip Details</Text>
            <TouchableOpacity onPress={() => selectedPayslip && downloadPayslip(selectedPayslip)}>
              <Download size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {selectedPayslip && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.payslipDetail}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>StaffNest Payslip</Text>
                  <Text style={styles.detailPeriod}>{selectedPayslip.period}</Text>
                  <Text style={styles.detailEmployee}>{selectedPayslip.staffName}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Earnings</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Basic Pay ({selectedPayslip.hoursWorked} hours)</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(selectedPayslip.hoursWorked * selectedPayslip.hourlyRate, selectedPayslip.currency)}
                    </Text>
                  </View>
                  {selectedPayslip.overtime > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Overtime</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(selectedPayslip.overtime, selectedPayslip.currency)}
                      </Text>
                    </View>
                  )}
                  {selectedPayslip.bonus > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Bonus</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(selectedPayslip.bonus, selectedPayslip.currency)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Gross Pay</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(selectedPayslip.grossPay, selectedPayslip.currency)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Deductions</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Income Tax</Text>
                    <Text style={styles.detailValue}>
                      -{formatCurrency(selectedPayslip.tax, selectedPayslip.currency)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>National Insurance</Text>
                    <Text style={styles.detailValue}>
                      -{formatCurrency(selectedPayslip.ni, selectedPayslip.currency)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pension</Text>
                    <Text style={styles.detailValue}>
                      -{formatCurrency(selectedPayslip.pension, selectedPayslip.currency)}
                    </Text>
                  </View>
                  {selectedPayslip.deductions > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Other Deductions</Text>
                      <Text style={styles.detailValue}>
                        -{formatCurrency(selectedPayslip.deductions, selectedPayslip.currency)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.detailSection, styles.netPaySection]}>
                  <View style={[styles.detailRow, styles.netPayRow]}>
                    <Text style={styles.netPayLabel}>Net Pay</Text>
                    <Text style={styles.netPayValue}>
                      {formatCurrency(selectedPayslip.netPay, selectedPayslip.currency)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailFooter}>
                  <Text style={styles.footerText}>
                    Generated on {new Date(selectedPayslip.generatedDate).toLocaleDateString('en-GB')}
                  </Text>
                  <Text style={styles.footerText}>
                    This is an official payslip from StaffNest
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  summarySection: {
    padding: 24,
    paddingBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  payslipsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  payslipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  payslipInfo: {
    flex: 1,
  },
  payslipPeriod: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  payslipStaff: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  payslipHours: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  payslipAmount: {
    alignItems: 'flex-end',
  },
  grossPay: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  netPay: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  payslipActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
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
  modalClose: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  payslipDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  detailPeriod: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailEmployee: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  netPaySection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  netPayRow: {
    paddingVertical: 0,
  },
  netPayLabel: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  netPayValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  detailFooter: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
});