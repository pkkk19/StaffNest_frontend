import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { ArrowLeft, Download, Eye, Filter } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';

export default function Payslips() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('2024');

  const styles = createStyles(theme);

  const payslips = [
    {
      id: 1,
      month: 'December 2024',
      grossPay: '£2,500.00',
      netPay: '£2,100.00',
      tax: '£300.00',
      ni: '£100.00',
      status: 'Paid',
      payDate: '2024-12-31'
    },
    {
      id: 2,
      month: 'November 2024',
      grossPay: '£2,500.00',
      netPay: '£2,100.00',
      tax: '£300.00',
      ni: '£100.00',
      status: 'Paid',
      payDate: '2024-11-30'
    },
    {
      id: 3,
      month: 'October 2024',
      grossPay: '£2,500.00',
      netPay: '£2,100.00',
      tax: '£300.00',
      ni: '£100.00',
      status: 'Paid',
      payDate: '2024-10-31'
    },
  ];

  const PayslipCard = ({ payslip }: { payslip: any }) => (
    <View style={styles.payslipCard}>
      <View style={styles.payslipHeader}>
        <Text style={styles.payslipMonth}>{payslip.month}</Text>
        <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
          <Text style={styles.statusText}>{payslip.status}</Text>
        </View>
      </View>
      
      <View style={styles.payslipDetails}>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>{t('grossPay')}</Text>
          <Text style={styles.payValue}>{payslip.grossPay}</Text>
        </View>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>{t('tax')}</Text>
          <Text style={styles.payValue}>-{payslip.tax}</Text>
        </View>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>{t('nationalInsurance')}</Text>
          <Text style={styles.payValue}>-{payslip.ni}</Text>
        </View>
        <View style={[styles.payRow, styles.netPayRow]}>
          <Text style={styles.netPayLabel}>{t('netPay')}</Text>
          <Text style={styles.netPayValue}>{payslip.netPay}</Text>
        </View>
      </View>

      <View style={styles.payslipActions}>
        <ForceTouchable style={styles.actionButton}>
          <Eye size={16} color="#2563EB" />
          <Text style={styles.actionButtonText}>{t('view')}</Text>
        </ForceTouchable>
        <ForceTouchable style={styles.actionButton}>
          <Download size={16} color="#2563EB" />
          <Text style={styles.actionButtonText}>{t('download')}</Text>
        </ForceTouchable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>{t('payslips')}</Text>
        <ForceTouchable>
          <Filter size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['2024', '2023', '2022'].map((year) => (
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

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('yearToDate')} {selectedYear}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>£30,000</Text>
              <Text style={styles.summaryLabel}>{t('totalGross')}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>£25,200</Text>
              <Text style={styles.summaryLabel}>{t('totalNet')}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>£3,600</Text>
              <Text style={styles.summaryLabel}>{t('totalTax')}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>£1,200</Text>
              <Text style={styles.summaryLabel}>{t('totalNI')}</Text>
            </View>
          </View>
        </View>

        {payslips.map(payslip => (
          <PayslipCard key={payslip.id} payslip={payslip} />
        ))}
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
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
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    yearButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      marginRight: 8,
      ...Platform.select({
        android: {
          elevation: 2,
        },
      }),
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
      padding: 20,
    },
    summaryCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      ...Platform.select({
        android: {
          elevation: 5,
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
      flexWrap: 'wrap',
      gap: 16,
    },
    summaryItem: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#2563EB',
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    payslipCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...Platform.select({
        android: {
          elevation: 3,
        },
      }),
    },
    payslipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    payslipMonth: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
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
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#2563EB',
    },
  });
}