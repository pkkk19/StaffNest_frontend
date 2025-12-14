import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { ArrowLeft, Download, Eye, Filter, Calendar, FileText, PoundSterling } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';
import { payslipAPI } from '@/services/api';

type Payslip = {
  _id: string;
  payslip_number: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  total_gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  pdf_url?: string;
  downloadUrl?: string;
  company_id: {
    name: string;
    logo_url?: string;
  };
};

export default function EmployeePayslips() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const styles = createStyles(theme);

  const loadPayslips = async () => {
    try {
      const response = await payslipAPI.getMyPayslips({ year: selectedYear });
      setPayslips(response.data);
    } catch (error) {
      console.error('Failed to load payslips:', error);
      Alert.alert('Error', 'Failed to load payslips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, [selectedYear]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayslips();
  };

  const handleViewPayslip = (payslip: Payslip) => {
    router.push(`/pages/payslips/${payslip._id}` as any);
  };

  const handleDownloadPDF = async (payslipId: string) => {
    try {
      Alert.alert('Download', 'Generating PDF...');
      const response = await payslipAPI.generatePDF(payslipId);
      
      if (response.data.url) {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return '#10B981';
      case 'pending_review':
        return '#F59E0B';
      case 'draft':
        return '#6B7280';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading payslips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>My Payslips</Text>
        <ForceTouchable>
          <Filter size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
      </View>

      <View style={styles.filterContainer}>
        <Calendar size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
          {years.map(year => (
            <ForceTouchable
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.yearButtonActive
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text style={[
                styles.yearButtonText,
                selectedYear === year && styles.yearButtonTextActive
              ]}>
                {year}
              </Text>
            </ForceTouchable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor={theme === 'dark' ? '#F9FAFB' : '#2563EB'}
          />
        }
      >
        {payslips.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color={theme === 'dark' ? '#374151' : '#E5E7EB'} />
            <Text style={styles.emptyStateText}>No payslips found</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedYear === new Date().getFullYear().toString()
                ? 'Your payslips will appear here once generated'
                : 'No payslips for selected year'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Year {selectedYear} Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <PoundSterling size={24} color="#2563EB" />
                  <Text style={styles.summaryValue}>
                    {formatCurrency(payslips.reduce((sum, p) => sum + p.total_gross_pay, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Gross</Text>
                </View>
                <View style={styles.summaryItem}>
                  <PoundSterling size={24} color="#10B981" />
                  <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                    {formatCurrency(payslips.reduce((sum, p) => sum + p.net_pay, 0))}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Net</Text>
                </View>
              </View>
            </View>

            {payslips.map(payslip => (
              <View key={payslip._id} style={styles.payslipCard}>
                <View style={styles.payslipHeader}>
                  <View>
                    <Text style={styles.payslipNumber}>{payslip.payslip_number}</Text>
                    <Text style={styles.payslipPeriod}>
                      {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
                    </Text>
                    <Text style={styles.payslipPayDate}>Pay Date: {formatDate(payslip.pay_date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payslip.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(payslip.status) }]}>
                      {getStatusText(payslip.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.payslipDetails}>
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Gross Pay</Text>
                    <Text style={styles.payValue}>{formatCurrency(payslip.total_gross_pay)}</Text>
                  </View>
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Deductions</Text>
                    <Text style={[styles.payValue, { color: '#EF4444' }]}>
                      -{formatCurrency(payslip.total_deductions)}
                    </Text>
                  </View>
                  <View style={[styles.payRow, styles.netPayRow]}>
                    <Text style={styles.netPayLabel}>Net Pay</Text>
                    <Text style={styles.netPayValue}>{formatCurrency(payslip.net_pay)}</Text>
                  </View>
                </View>

                <View style={styles.payslipActions}>
                  <ForceTouchable
                    style={styles.actionButton}
                    onPress={() => handleViewPayslip(payslip)}
                  >
                    <Eye size={16} color="#2563EB" />
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </ForceTouchable>
                  
                  {(payslip.status === 'approved' || payslip.status === 'paid') && payslip.downloadUrl ? (
                    <ForceTouchable
                      style={[styles.actionButton, styles.downloadButton]}
                      onPress={() => handleDownloadPDF(payslip._id)}
                    >
                      <Download size={16} color="#FFFFFF" />
                      <Text style={styles.downloadButtonText}>Download PDF</Text>
                    </ForceTouchable>
                  ) : null}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    filterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    yearScroll: {
      marginLeft: 12,
    },
    yearButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      marginRight: 8,
    },
    yearButtonActive: {
      backgroundColor: '#2563EB',
    },
    yearButtonText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    yearButtonTextActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    summaryCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      margin: 16,
      marginBottom: 8,
      ...Platform.select({
        android: {
          elevation: 5,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
      }),
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#2563EB',
      marginVertical: 8,
    },
    summaryLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    payslipCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      ...Platform.select({
        android: {
          elevation: 3,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
      }),
    },
    payslipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    payslipNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    payslipPeriod: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    },
    payslipPayDate: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    payslipDetails: {
      marginBottom: 16,
    },
    payRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    payLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    payValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    netPayRow: {
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
      paddingTop: 8,
      marginTop: 8,
    },
    netPayLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    netPayValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#10B981',
    },
    payslipActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      paddingVertical: 12,
      gap: 8,
    },
    downloadButton: {
      backgroundColor: '#2563EB',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#2563EB',
    },
    downloadButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      marginTop: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 16,
      fontWeight: '500',
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
  });
}