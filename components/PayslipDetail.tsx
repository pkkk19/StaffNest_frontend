import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Download, Printer, Share2, Eye, FileText, PoundSterling, Calendar, User, Building } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

type PayslipDetail = {
  payslip_number: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  total_gross_pay: number;
  taxable_pay: number;
  total_deductions: number;
  paye_tax: number;
  national_insurance: number;
  employee_pension: number;
  employer_pension: number;
  student_loan: number;
  other_deductions: number;
  net_pay: number;
  status: string;
  notes?: string;
  employee_id: {
    first_name: string;
    last_name: string;
    identification?: {
      employee_ref?: string;
      ni_number?: string;
    };
    tax_info?: {
      tax_code?: string;
    };
    employment?: {
      department?: string;
    };
  };
  payments: Array<{
    description: string;
    units?: number;
    rate?: number;
    amount: number;
    is_taxable: boolean;
  }>;
  deductions: Array<{
    description: string;
    amount: number;
    is_pre_tax?: boolean;
  }>;
  tax_calculation?: {
    tax_code: string;
    tax_free_allowance: number;
    taxable_income: number;
    bands: Array<{
      rate: number;
      taxable_amount: number;
      tax_amount: number;
    }>;
    total_tax: number;
  };
  ni_calculation?: {
    ni_category: string;
    earnings_for_ni: number;
    bands: Array<{
      rate: number;
      earnings_amount: number;
      ni_amount: number;
    }>;
    total_ni: number;
  };
  ytd_totals?: {
    gross_pay: number;
    taxable_pay: number;
    tax_paid: number;
    ni_paid: number;
    employee_pension: number;
    employer_pension: number;
    net_pay: number;
  };
};

interface PayslipDetailProps {
  payslip: PayslipDetail;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  isAdmin?: boolean;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onMarkPaid?: () => void;
}

export default function PayslipDetail({
  payslip,
  onDownloadPDF,
  onPrint,
  onShare,
  isAdmin = false,
  onEdit,
  onApprove,
  onReject,
  onMarkPaid,
}: PayslipDetailProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

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

  const handleDownload = () => {
    if (onDownloadPDF) {
      onDownloadPDF();
    } else {
      Alert.alert('Download', 'PDF download functionality would be implemented here');
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      Alert.alert('Print', 'Print functionality would be implemented here');
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      Alert.alert('Share', 'Share functionality would be implemented here');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payslip</Text>
        <Text style={styles.payslipNumber}>{payslip.payslip_number}</Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payslip.status) + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor(payslip.status) }]}>
          {payslip.status.toUpperCase()}
        </Text>
      </View>

      {/* Employee Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employee Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <User size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {payslip.employee_id.first_name} {payslip.employee_id.last_name}
            </Text>
          </View>
          
          {payslip.employee_id.identification?.employee_ref && (
            <View style={styles.infoItem}>
              <FileText size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.infoLabel}>Employee Ref</Text>
              <Text style={styles.infoValue}>{payslip.employee_id.identification.employee_ref}</Text>
            </View>
          )}
          
          {payslip.employee_id.identification?.ni_number && (
            <View style={styles.infoItem}>
              <FileText size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.infoLabel}>NI Number</Text>
              <Text style={styles.infoValue}>{payslip.employee_id.identification.ni_number}</Text>
            </View>
          )}
          
          {payslip.employee_id.tax_info?.tax_code && (
            <View style={styles.infoItem}>
              <FileText size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.infoLabel}>Tax Code</Text>
              <Text style={styles.infoValue}>{payslip.employee_id.tax_info.tax_code}</Text>
            </View>
          )}
          
          {payslip.employee_id.employment?.department && (
            <View style={styles.infoItem}>
              <Building size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{payslip.employee_id.employment.department}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Pay Period */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pay Period</Text>
        <View style={styles.payPeriodContainer}>
          <View style={styles.payPeriodItem}>
            <Calendar size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.payPeriodLabel}>Period</Text>
            <Text style={styles.payPeriodValue}>
              {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
            </Text>
          </View>
          <View style={styles.payPeriodItem}>
            <Calendar size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.payPeriodLabel}>Pay Date</Text>
            <Text style={styles.payPeriodValue}>{formatDate(payslip.pay_date)}</Text>
          </View>
        </View>
      </View>

      {/* Earnings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, flex: 3 }}>Description</Text>
            <Text style={styles.tableHeaderCell}>Units</Text>
            <Text style={styles.tableHeaderCell}>Rate</Text>
            <Text style={styles.tableHeaderCell}>Amount</Text>
          </View>
          
          {payslip.payments.map((payment, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 3 }}>{payment.description}</Text>
              <Text style={styles.tableCell}>{payment.units || '-'}</Text>
              <Text style={styles.tableCell}>{payment.rate ? formatCurrency(payment.rate) : '-'}</Text>
              <Text style={styles.tableCell}>{formatCurrency(payment.amount)}</Text>
            </View>
          ))}
          
          <View style={styles.tableTotalRow}>
            <Text style={{ ...styles.tableTotalCell, flex: 3 }}>Total Gross Pay</Text>
            <Text style={styles.tableTotalCell}></Text>
            <Text style={styles.tableTotalCell}></Text>
            <Text style={styles.tableTotalCell}>{formatCurrency(payslip.total_gross_pay)}</Text>
          </View>
        </View>
      </View>

      {/* Deductions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deductions</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, flex: 4 }}>Description</Text>
            <Text style={styles.tableHeaderCell}>Amount</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, flex: 4 }}>PAYE Tax</Text>
            <Text style={styles.tableCell}>-{formatCurrency(payslip.paye_tax)}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, flex: 4 }}>National Insurance</Text>
            <Text style={styles.tableCell}>-{formatCurrency(payslip.national_insurance)}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, flex: 4 }}>Employee Pension</Text>
            <Text style={styles.tableCell}>-{formatCurrency(payslip.employee_pension)}</Text>
          </View>
          
          {payslip.student_loan > 0 && (
            <View style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 4 }}>Student Loan</Text>
              <Text style={styles.tableCell}>-{formatCurrency(payslip.student_loan)}</Text>
            </View>
          )}
          
          {payslip.other_deductions > 0 && (
            <View style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 4 }}>Other Deductions</Text>
              <Text style={styles.tableCell}>-{formatCurrency(payslip.other_deductions)}</Text>
            </View>
          )}
          
          <View style={styles.tableTotalRow}>
            <Text style={{ ...styles.tableTotalCell, flex: 4 }}>Total Deductions</Text>
            <Text style={styles.tableTotalCell}>-{formatCurrency(payslip.total_deductions)}</Text>
          </View>
        </View>
      </View>

      {/* Net Pay */}
      <View style={[styles.section, styles.netPaySection]}>
        <Text style={styles.sectionTitle}>Net Pay</Text>
        <View style={styles.netPayContainer}>
          <PoundSterling size={32} color="#10B981" />
          <Text style={styles.netPayAmount}>{formatCurrency(payslip.net_pay)}</Text>
        </View>
        <Text style={styles.netPayLabel}>Amount to be paid on {formatDate(payslip.pay_date)}</Text>
      </View>

      {/* Tax Calculation Details */}
      {payslip.tax_calculation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Calculation Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tax Code</Text>
              <Text style={styles.detailValue}>{payslip.tax_calculation.tax_code}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tax Free Allowance</Text>
              <Text style={styles.detailValue}>{formatCurrency(payslip.tax_calculation.tax_free_allowance)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Taxable Income</Text>
              <Text style={styles.detailValue}>{formatCurrency(payslip.tax_calculation.taxable_income)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Tax</Text>
              <Text style={styles.detailValue}>{formatCurrency(payslip.tax_calculation.total_tax)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Year to Date Totals */}
      {payslip.ytd_totals && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Year To Date Totals</Text>
          <View style={styles.ytdGrid}>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Gross Pay</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payslip.ytd_totals.gross_pay)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Tax Paid</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payslip.ytd_totals.tax_paid)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>NI Paid</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payslip.ytd_totals.ni_paid)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Net Pay</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payslip.ytd_totals.net_pay)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Notes */}
      {payslip.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{payslip.notes}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
          <Download size={20} color="#2563EB" />
          <Text style={styles.actionButtonText}>Download PDF</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
          <Printer size={20} color="#2563EB" />
          <Text style={styles.actionButtonText}>Print</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={20} color="#2563EB" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Actions */}
      {isAdmin && payslip.status === 'draft' && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={[styles.adminButton, styles.editButton]} onPress={onEdit}>
            <Eye size={20} color="#FFFFFF" />
            <Text style={styles.adminButtonText}>Review & Edit</Text>
          </TouchableOpacity>
        </View>
      )}

      {isAdmin && payslip.status === 'pending_review' && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={[styles.adminButton, styles.approveButton]} onPress={onApprove}>
            <Text style={styles.adminButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adminButton, styles.rejectButton]} onPress={onReject}>
            <Text style={styles.adminButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {isAdmin && payslip.status === 'approved' && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={[styles.adminButton, styles.paidButton]} onPress={onMarkPaid}>
            <Text style={styles.adminButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    payslipNumber: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginBottom: 24,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    section: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    infoGrid: {
      gap: 12,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginRight: 8,
      width: 100,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    payPeriodContainer: {
      gap: 12,
    },
    payPeriodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    payPeriodLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginRight: 8,
      width: 80,
    },
    payPeriodValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    table: {
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 8,
      overflow: 'hidden',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      flex: 1,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    tableCell: {
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
      textAlign: 'center',
      flex: 1,
    },
    tableTotalRow: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderTopWidth: 2,
      borderTopColor: isDark ? '#4B5563' : '#D1D5DB',
    },
    tableTotalCell: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      textAlign: 'center',
      flex: 1,
    },
    netPaySection: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    netPayContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    netPayAmount: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#10B981',
    },
    netPayLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    detailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    detailItem: {
      width: '48%',
    },
    detailLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    ytdGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    ytdItem: {
      width: '48%',
    },
    ytdLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    ytdValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    notesText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
      lineHeight: 20,
      fontStyle: 'italic',
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 24,
      marginBottom: 32,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#2563EB',
    },
    adminActions: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
    },
    adminButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 8,
      gap: 8,
    },
    editButton: {
      backgroundColor: '#2563EB',
    },
    approveButton: {
      backgroundColor: '#10B981',
    },
    rejectButton: {
      backgroundColor: '#EF4444',
    },
    paidButton: {
      backgroundColor: '#8B5CF6',
    },
    adminButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}