import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { ArrowLeft, Download, Edit, FileText, Printer, Share2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';
import { payslipAPI } from '@/services/api';

type PayslipDetail = {
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
  earnings: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
  deductions: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
  employee: {
    name: string;
    employee_id: string;
    department: string;
  };
  company: {
    name: string;
    address: string;
    tax_id: string;
  };
};

export default function PayslipDetail() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = createStyles(theme);

  useEffect(() => {
    loadPayslip();
  }, [id]);

  const loadPayslip = async () => {
    try {
      const response = await payslipAPI.getPayslip(id as string);
      setPayslip(response.data);
    } catch (error) {
      console.error('Failed to load payslip:', error);
      Alert.alert('Error', 'Failed to load payslip details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Only admin can edit - redirect to admin edit page
    if (user?.role === 'admin') {
      router.push(`/pages/admin/edit-payslip/${id}` as any);
    }
  };

  const handleDownload = async () => {
    try {
      Alert.alert('Download', 'Generating PDF...');
      const response = await payslipAPI.generatePDF(id as string);
      
      if (response.data.url) {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading payslip...</Text>
      </View>
    );
  }

  if (!payslip) {
    return (
      <View style={[styles.container, styles.center]}>
        <FileText size={48} color="#6B7280" />
        <Text style={styles.errorText}>Payslip not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>Payslip Details</Text>
        <View style={styles.headerActions}>
          {user?.role === 'admin' && (
            <ForceTouchable style={styles.iconButton} onPress={handleEdit}>
              <Edit size={20} color="#2563EB" />
            </ForceTouchable>
          )}
          {payslip.downloadUrl && (
            <ForceTouchable style={styles.iconButton} onPress={handleDownload}>
              <Download size={20} color="#2563EB" />
            </ForceTouchable>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Payslip #{payslip.payslip_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
              <Text style={[styles.statusText, { color: '#10B981' }]}>
                {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Pay Period</Text>
            <Text style={styles.infoText}>
              {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
            </Text>
            <Text style={styles.sectionSubtitle}>Pay Date: {formatDate(payslip.pay_date)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Employee Information</Text>
            <Text style={styles.infoText}>{payslip.employee.name}</Text>
            <Text style={styles.infoSubtext}>ID: {payslip.employee.employee_id}</Text>
            <Text style={styles.infoSubtext}>Department: {payslip.employee.department}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            <Text style={styles.infoText}>{payslip.company.name}</Text>
            <Text style={styles.infoSubtext}>{payslip.company.address}</Text>
            <Text style={styles.infoSubtext}>Tax ID: {payslip.company.tax_id}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings</Text>
          {payslip.earnings.map((earning, index) => (
            <View key={index} style={styles.lineItem}>
              <Text style={styles.lineItemLabel}>{earning.name}</Text>
              <Text style={styles.lineItemValue}>{formatCurrency(earning.amount)}</Text>
            </View>
          ))}
          <View style={styles.lineItemTotal}>
            <Text style={styles.lineItemLabel}>Total Gross Pay</Text>
            <Text style={styles.lineItemTotalValue}>{formatCurrency(payslip.total_gross_pay)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Deductions</Text>
          {payslip.deductions.map((deduction, index) => (
            <View key={index} style={styles.lineItem}>
              <Text style={styles.lineItemLabel}>{deduction.name}</Text>
              <Text style={[styles.lineItemValue, { color: '#EF4444' }]}>
                -{formatCurrency(deduction.amount)}
              </Text>
            </View>
          ))}
          <View style={styles.lineItemTotal}>
            <Text style={styles.lineItemLabel}>Total Deductions</Text>
            <Text style={[styles.lineItemTotalValue, { color: '#EF4444' }]}>
              -{formatCurrency(payslip.total_deductions)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, styles.netPayCard]}>
          <View style={styles.lineItemTotal}>
            <Text style={styles.netPayLabel}>Net Pay</Text>
            <Text style={styles.netPayValue}>{formatCurrency(payslip.net_pay)}</Text>
          </View>
          <Text style={styles.netPaySubtext}>
            Amount payable on {formatDate(payslip.pay_date)}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {payslip.downloadUrl && (
            <>
              <ForceTouchable style={styles.actionButton} onPress={handleDownload}>
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Download PDF</Text>
              </ForceTouchable>
              <ForceTouchable style={[styles.actionButton, styles.secondaryButton]}>
                <Share2 size={20} color="#2563EB" />
                <Text style={styles.secondaryButtonText}>Share</Text>
              </ForceTouchable>
            </>
          )}
        </View>
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
    errorText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 16,
      marginBottom: 24,
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
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      padding: 4,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      ...Platform.select({
        android: {
          elevation: 3,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    infoSection: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#D1D5DB' : '#4B5563',
      marginBottom: 4,
    },
    infoText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    },
    infoSubtext: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      marginVertical: 16,
    },
    lineItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#F3F4F6',
    },
    lineItemLabel: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    lineItemValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    lineItemTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    lineItemTotalValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    netPayCard: {
      backgroundColor: isDark ? '#05966920' : '#10B98120',
      borderWidth: 1,
      borderColor: isDark ? '#05966940' : '#10B98140',
    },
    netPayLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    netPayValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#10B981',
    },
    netPaySubtext: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
      textAlign: 'center',
    },
    backButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    backButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 8,
      paddingVertical: 16,
      gap: 8,
    },
    secondaryButton: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2563EB',
    },
  });
}