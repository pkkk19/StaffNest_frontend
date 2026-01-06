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
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Edit, 
  Plus, 
  ChevronRight, 
  User,
  FileText,
  PoundSterling,
  Calendar,
  Download,
  File,
  Eye,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';
import { staffAPI, payslipAPI } from '@/services/api';
import * as WebBrowser from 'expo-web-browser';

type StaffMember = {
  _id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  email: string;
  pay_rates?: {
    default_hourly_rate?: number;
    default_salary?: number;
  };
  identification?: {
    employee_ref?: string;
  };
};

type EmployeeWithPayslips = StaffMember & {
  payslips: Payslip[];
  totalPayslips: number;
  recentPayslip?: Payslip;
};

type Payslip = {
  _id: string;
  payslip_number?: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  net_pay: number;
  status: string;
  downloadUrl?: string;
  pdf_url?: string;
  pdf_generated_at?: string;
  employee_id?: string | { _id: string };
};

export default function AdminPayslips() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<EmployeeWithPayslips[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithPayslips[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'withPayslips' | 'noPayslips'>('all');
  const [generatingPDFs, setGeneratingPDFs] = useState<Record<string, boolean>>({});
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);

  const styles = createStyles(theme);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Load all staff members
      const staffResponse = await staffAPI.getStaff();
      const staffMembers: StaffMember[] = staffResponse.data || [];
      
      // 2. Load all payslips
      const payslipsResponse = await payslipAPI.getPayslips();
      const allPayslips: Payslip[] = payslipsResponse.data || [];
      
      // 3. Group payslips by employee
      const payslipsByEmployee = new Map<string, Payslip[]>();
      
      allPayslips.forEach(payslip => {
        let employeeId: string | null = null;
        
        // Extract employee ID from different possible structures
        if (typeof payslip.employee_id === 'string') {
          employeeId = payslip.employee_id;
        } else if (payslip.employee_id && typeof payslip.employee_id === 'object') {
          employeeId = (payslip.employee_id as any)._id;
        }
        
        if (employeeId) {
          if (!payslipsByEmployee.has(employeeId)) {
            payslipsByEmployee.set(employeeId, []);
          }
          payslipsByEmployee.get(employeeId)!.push(payslip);
        }
      });
      
      // 4. Combine staff data with payslip data
      const employeesWithPayslips: EmployeeWithPayslips[] = staffMembers.map(employee => {
        const employeePayslips = payslipsByEmployee.get(employee._id) || [];
        const sortedPayslips = [...employeePayslips].sort((a, b) => 
          new Date(b.pay_period_start).getTime() - new Date(a.pay_period_start).getTime()
        );
        
        return {
          ...employee,
          payslips: sortedPayslips.slice(0, 3), // Show only recent 3 payslips
          totalPayslips: employeePayslips.length,
          recentPayslip: sortedPayslips[0],
        };
      });
      
      setEmployees(employeesWithPayslips);
      applyFilters(employeesWithPayslips, searchQuery, activeFilter);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load employees and payslips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (data: EmployeeWithPayslips[], query: string, filter: 'all' | 'withPayslips' | 'noPayslips') => {
    let filtered = [...data];
    
    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
        emp.email?.toLowerCase().includes(query.toLowerCase()) ||
        emp.position?.toLowerCase().includes(query.toLowerCase()) ||
        emp.identification?.employee_ref?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Apply category filter
    switch (filter) {
      case 'withPayslips':
        filtered = filtered.filter(emp => emp.totalPayslips > 0);
        break;
      case 'noPayslips':
        filtered = filtered.filter(emp => emp.totalPayslips === 0);
        break;
      case 'all':
      default:
        break;
    }
    
    setFilteredEmployees(filtered);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters(employees, searchQuery, activeFilter);
  }, [searchQuery, activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleViewEmployeePayslips = (employeeId: string, employeeName: string) => {
    router.push({
      pathname: '/pages/admin/payslips/[id]',
      params: { 
        id: employeeId,
        employeeName: employeeName 
      }
    } as any);
  };

  const handleCreatePayslip = (employee?: StaffMember) => {
    if (employee) {
      // Create payslip for specific employee
      router.push({
        pathname: '/pages/admin/edit-payslip/new',
        params: { 
          employeeId: employee._id, 
          employeeName: `${employee.first_name} ${employee.last_name}` 
        }
      } as any);
    } else {
      // Create payslip without pre-selected employee
      router.push('/pages/admin/edit-payslip/new' as any);
    }
  };

  const handleEditPayslip = (payslip: Payslip, employee: StaffMember) => {
    router.push({
      pathname: `/pages/admin/edit-payslip/${payslip._id}`,
      params: {
        id: payslip._id,
        employeeId: employee._id,
        employeeName: `${employee.first_name} ${employee.last_name}`
      }
    } as any);
  };

  const handleGeneratePDF = async (payslipId: string) => {
    try {
      setGeneratingPDFs(prev => ({ ...prev, [payslipId]: true }));
      
      const response = await payslipAPI.generatePDF(payslipId);
      
      if (response.data?.url) {
        Alert.alert(
          '✅ PDF Generated',
          'Payslip PDF has been generated successfully!',
          [{ text: 'OK' }]
        );
        
        // Refresh the data to show updated PDF status
        loadData();
      } else {
        Alert.alert('❌ Error', 'Failed to generate PDF');
      }
    } catch (error: any) {
      console.error('PDF generation failed:', error);
      Alert.alert(
        '❌ Error', 
        error.response?.data?.message || 'Failed to generate PDF. Please try again.'
      );
    } finally {
      setGeneratingPDFs(prev => ({ ...prev, [payslipId]: false }));
    }
  };

  const handlePDFOptions = (payslip: Payslip) => {
    if (!payslip.pdf_url) {
      Alert.alert(
        '📄 PDF Not Generated',
        'This payslip PDF has not been generated yet. Would you like to generate it now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Generate PDF', 
            onPress: () => handleGeneratePDF(payslip._id)
          }
        ]
      );
      return;
    }

    Alert.alert(
      '📄 Payslip PDF',
      'What would you like to do with this PDF?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '👁️ View in App', 
          onPress: () => {
            setSelectedPdfUrl(payslip.pdf_url!);
            setPdfModalVisible(true);
          }
        },
        { 
          text: '🌐 Open in Browser', 
          onPress: () => openInBrowser(payslip.pdf_url!)
        },
        { 
          text: '⬇️ Download PDF', 
          onPress: () => downloadPDF(payslip)
        },
      ]
    );
  };

  const openInBrowser = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening browser:', error);
      Alert.alert('Error', 'Could not open PDF in browser. You can try copying the URL instead.');
    }
  };

  const downloadPDF = (payslip: Payslip) => {
    // For now, we'll open in browser which allows download
    // In a real app, you would use FileSystem API to download
    Alert.alert(
      '⬇️ Download PDF',
      'Opening in browser where you can download the PDF.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => openInBrowser(payslip.pdf_url!)
        }
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not generated';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'paid':
        return '#10B981';
      case 'pending_review':
      case 'pending':
        return '#F59E0B';
      case 'draft':
        return '#6B7280';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getFullName = (employee: StaffMember) => {
    return `${employee.first_name} ${employee.last_name}`;
  };

  const getEmployeeId = (employee: StaffMember) => {
    return employee.identification?.employee_ref || employee.employee_id || 'N/A';
  };

  const renderEmployeeItem = ({ item }: { item: EmployeeWithPayslips }) => (
    <View style={styles.employeeCard}>
      <View style={styles.employeeHeader}>
        <View style={styles.employeeAvatar}>
          <User size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{getFullName(item)}</Text>
          <View style={styles.employeeDetails}>
            <Text style={styles.employeeId}>ID: {getEmployeeId(item)}</Text>
            {item.position && (
              <>
                <Text style={styles.employeeDot}>•</Text>
                <Text style={styles.employeePosition}>{item.position}</Text>
              </>
            )}
            {item.department && (
              <>
                <Text style={styles.employeeDot}>•</Text>
                <Text style={styles.employeeDepartment}>{item.department}</Text>
              </>
            )}
          </View>
          {item.pay_rates?.default_hourly_rate && (
            <Text style={styles.employeeRate}>
              Rate: £{item.pay_rates.default_hourly_rate.toFixed(2)}/hr
            </Text>
          )}
        </View>
        <ChevronRight size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      </View>

      <View style={styles.payslipsSection}>
        <View style={styles.payslipsHeader}>
          <Text style={styles.payslipsTitle}>
            Payslips ({item.totalPayslips})
          </Text>
          <ForceTouchable
            style={styles.createPayslipButton}
            onPress={() => handleCreatePayslip(item)}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.createPayslipText}>Create Payslip</Text>
          </ForceTouchable>
        </View>

        {item.totalPayslips === 0 ? (
          <View style={styles.noPayslips}>
            <FileText size={32} color={theme === 'dark' ? '#374151' : '#E5E7EB'} />
            <Text style={styles.noPayslipsText}>No payslips yet</Text>
            <ForceTouchable
              style={styles.createFirstButton}
              onPress={() => handleCreatePayslip(item)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createFirstButtonText}>Create First Payslip</Text>
            </ForceTouchable>
          </View>
        ) : (
          <>
            {item.recentPayslip && (
              <View style={styles.recentPayslip}>
                <View style={styles.recentPayslipHeader}>
                  <Text style={styles.recentPayslipTitle}>
                    Latest: #{item.recentPayslip.payslip_number || 'N/A'}
                  </Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(item.recentPayslip.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: getStatusColor(item.recentPayslip.status) }
                    ]}>
                      {item.recentPayslip.status?.charAt(0).toUpperCase() + item.recentPayslip.status?.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentPeriod}>
                  <Calendar size={12} color="#6B7280" />{' '}
                  {formatDate(item.recentPayslip.pay_period_start)} - {formatDate(item.recentPayslip.pay_period_end)}
                </Text>
                <Text style={styles.recentNetPay}>
                  <PoundSterling size={14} color="#10B981" />{' '}
                  {formatCurrency(item.recentPayslip.net_pay)}
                </Text>
                {item.recentPayslip.pdf_url && (
                  <TouchableOpacity onPress={() => handlePDFOptions(item.recentPayslip!)}>
                    <Text style={styles.pdfInfo}>
                      <Eye size={12} color="#2563EB" />{' '}
                      PDF generated: {formatDateTime(item.recentPayslip.pdf_generated_at || '')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {item.payslips.length > 0 && (
              <View style={styles.payslipsList}>
                {item.payslips.map((payslip, index) => (
                  <View key={payslip._id || index} style={styles.payslipItem}>
                    <View style={styles.payslipInfo}>
                      <View style={styles.payslipHeader}>
                        <Text style={styles.payslipNumber}>#{payslip.payslip_number || 'N/A'}</Text>
                        <View style={[
                          styles.payslipStatusBadge, 
                          { backgroundColor: getStatusColor(payslip.status) + '20' }
                        ]}>
                          <Text style={[
                            styles.payslipStatusText, 
                            { color: getStatusColor(payslip.status) }
                          ]}>
                            {payslip.status?.charAt(0).toUpperCase() + payslip.status?.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.payslipPeriod}>
                        {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
                      </Text>
                      <Text style={styles.payslipNetPay}>
                        Net: {formatCurrency(payslip.net_pay)}
                      </Text>
                      {payslip.pdf_url && (
                        <TouchableOpacity onPress={() => handlePDFOptions(payslip)}>
                          <Text style={styles.pdfGenerated}>
                            <Eye size={10} color="#10B981" /> Tap to view/download
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.payslipActions}>
                      <ForceTouchable
                        style={styles.payslipActionButton}
                        onPress={() => handleEditPayslip(payslip, item)}
                      >
                        <Edit size={14} color="#2563EB" />
                      </ForceTouchable>
                      <ForceTouchable
                        style={[
                          styles.payslipActionButton,
                          generatingPDFs[payslip._id] && styles.disabledButton
                        ]}
                        onPress={() => payslip.pdf_url ? handlePDFOptions(payslip) : handleGeneratePDF(payslip._id)}
                        disabled={generatingPDFs[payslip._id]}
                      >
                        {generatingPDFs[payslip._id] ? (
                          <ActivityIndicator size="small" color="#2563EB" />
                        ) : payslip.pdf_url ? (
                          <Eye size={14} color="#10B981" />
                        ) : (
                          <File size={14} color="#F59E0B" />
                        )}
                      </ForceTouchable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {item.totalPayslips > 3 && (
              <ForceTouchable
                style={styles.viewAllButton}
                onPress={() => handleViewEmployeePayslips(item._id, getFullName(item))}
              >
                <Text style={styles.viewAllText}>
                  View all {item.totalPayslips} payslips
                </Text>
                <ChevronRight size={16} color="#2563EB" />
              </ForceTouchable>
            )}
          </>
        )}
      </View>
    </View>
  );

  const handleBulkGeneratePDFs = async () => {
    Alert.alert(
      '📄 Bulk Generate PDFs',
      'Generate PDFs for all payslips without PDFs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: async () => {
            try {
              // Find all payslips without PDFs
              const payslipsWithoutPDF = employees.flatMap(emp => 
                emp.payslips.filter(p => !p.pdf_url)
              );
              
              if (payslipsWithoutPDF.length === 0) {
                Alert.alert('ℹ️ Info', 'All payslips already have PDFs generated.');
                return;
              }
              
              Alert.alert(
                '⚠️ Confirm',
                `Generate PDFs for ${payslipsWithoutPDF.length} payslip(s)?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Generate All', 
                    onPress: async () => {
                      // Generate PDFs one by one
                      for (const payslip of payslipsWithoutPDF) {
                        try {
                          await handleGeneratePDF(payslip._id);
                        } catch (error) {
                          console.error(`Failed to generate PDF for payslip ${payslip._id}:`, error);
                        }
                      }
                      Alert.alert('✅ Completed', 'Bulk PDF generation completed.');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Bulk generation failed:', error);
              Alert.alert('❌ Error', 'Failed to start bulk PDF generation.');
            }
          }
        }
      ]
    );
  };

  const PDFModal = () => (
    <Modal
      visible={pdfModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setPdfModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payslip PDF</Text>
            <ForceTouchable 
              style={styles.modalCloseButton}
              onPress={() => setPdfModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </ForceTouchable>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              The PDF is available for viewing or downloading.
            </Text>
            
            <View style={styles.pdfButtonsContainer}>
              <ForceTouchable
                style={styles.pdfButton}
                onPress={() => {
                  setPdfModalVisible(false);
                  if (selectedPdfUrl) openInBrowser(selectedPdfUrl);
                }}
              >
                <ExternalLink size={20} color="#FFFFFF" />
                <Text style={styles.pdfButtonText}>Open in Browser</Text>
              </ForceTouchable>
              
              <ForceTouchable
                style={[styles.pdfButton, styles.downloadButton]}
                onPress={() => {
                  setPdfModalVisible(false);
                  Alert.alert(
                    '⬇️ Download Started',
                    'The PDF will open in your browser where you can download it.',
                    [{ text: 'OK' }]
                  );
                  if (selectedPdfUrl) Linking.openURL(selectedPdfUrl);
                }}
              >
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.pdfButtonText}>Download PDF</Text>
              </ForceTouchable>
            </View>
            
            <View style={styles.pdfUrlContainer}>
              <Text style={styles.pdfUrlLabel}>PDF URL:</Text>
              <Text style={styles.pdfUrl} numberOfLines={2}>
                {selectedPdfUrl}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>Employee Payslips</Text>
        <ForceTouchable 
          style={styles.bulkGenerateButton}
          onPress={handleBulkGeneratePDFs}
        >
          <File size={16} color="#FFFFFF" />
        </ForceTouchable>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Search size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search employees..."
            placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ForceTouchable style={styles.filterButton}>
          <Filter size={20} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'withPayslips', 'noPayslips'] as const).map(filter => (
            <ForceTouchable
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === filter && styles.filterChipTextActive
              ]}>
                {filter === 'all' && 'All Employees'}
                {filter === 'withPayslips' && 'With Payslips'}
                {filter === 'noPayslips' && 'No Payslips'}
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
        {filteredEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color={theme === 'dark' ? '#374151' : '#E5E7EB'} />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No employees found' : 'No employees available'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Add employees to get started'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Overview</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{employees.length}</Text>
                  <Text style={styles.statLabel}>Total Employees</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {employees.filter(e => e.totalPayslips > 0).length}
                  </Text>
                  <Text style={styles.statLabel}>With Payslips</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {employees.reduce((sum, e) => sum + e.totalPayslips, 0)}
                  </Text>
                  <Text style={styles.statLabel}>Total Payslips</Text>
                </View>
              </View>
            </View>

            {/* PDF Stats */}
            <View style={styles.pdfStatsCard}>
              <Text style={styles.pdfStatsTitle}>PDF Status</Text>
              <View style={styles.pdfStatsGrid}>
                <View style={styles.pdfStatItem}>
                  <View style={[styles.pdfStatIcon, { backgroundColor: '#10B98120' }]}>
                    <File size={16} color="#10B981" />
                  </View>
                  <Text style={styles.pdfStatValue}>
                    {employees.reduce((sum, emp) => 
                      sum + emp.payslips.filter(p => p.pdf_url).length, 0
                    )}
                  </Text>
                  <Text style={styles.pdfStatLabel}>With PDF</Text>
                </View>
                <View style={styles.pdfStatItem}>
                  <View style={[styles.pdfStatIcon, { backgroundColor: '#F59E0B20' }]}>
                    <File size={16} color="#F59E0B" />
                  </View>
                  <Text style={styles.pdfStatValue}>
                    {employees.reduce((sum, emp) => 
                      sum + emp.payslips.filter(p => !p.pdf_url).length, 0
                    )}
                  </Text>
                  <Text style={styles.pdfStatLabel}>Without PDF</Text>
                </View>
                <ForceTouchable 
                  style={styles.generateAllButton}
                  onPress={handleBulkGeneratePDFs}
                >
                  <File size={14} color="#FFFFFF" />
                  <Text style={styles.generateAllButtonText}>Generate All</Text>
                </ForceTouchable>
              </View>
            </View>

            {filteredEmployees.map((employee, index) => (
              <React.Fragment key={employee._id}>
                {renderEmployeeItem({ item: employee })}
                {index < filteredEmployees.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </ScrollView>

      <PDFModal />
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
      marginTop: Platform.OS === 'android' ? 20 : 0,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    bulkGenerateButton: {
      backgroundColor: '#2563EB',
      borderRadius: 8,
      padding: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
      gap: 12,
    },
    searchInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchTextInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    filterButton: {
      padding: 12,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 12,
    },
    filterContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      marginRight: 8,
    },
    filterChipActive: {
      backgroundColor: '#2563EB',
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    summaryCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      margin: 16,
      marginBottom: 8,
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
    pdfStatsCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 16,
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
    pdfStatsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    pdfStatsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pdfStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    pdfStatIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    pdfStatValue: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    pdfStatLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    generateAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      marginLeft: 16,
    },
    generateAllButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    summaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#2563EB',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
    },
    employeeCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      overflow: 'hidden',
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
      }),
    },
    employeeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    employeeAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    employeeInfo: {
      flex: 1,
    },
    employeeName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    employeeDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    employeeId: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    employeeDot: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
      marginHorizontal: 6,
    },
    employeePosition: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    employeeDepartment: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    employeeRate: {
      fontSize: 12,
      color: '#10B981',
      fontWeight: '500',
    },
    payslipsSection: {
      padding: 16,
    },
    payslipsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    payslipsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    createPayslipButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 4,
    },
    createPayslipText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    noPayslips: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    noPayslipsText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 12,
      marginBottom: 16,
    },
    createFirstButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    createFirstButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    recentPayslip: {
      backgroundColor: isDark ? '#37415120' : '#F3F4F6',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    recentPayslipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    recentPayslipTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '500',
    },
    recentPeriod: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    recentNetPay: {
      fontSize: 14,
      fontWeight: '700',
      color: '#10B981',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    pdfInfo: {
      fontSize: 10,
      color: '#2563EB',
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    payslipsList: {
      marginTop: 8,
    },
    payslipItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#37415120' : '#E5E7EB20',
    },
    payslipInfo: {
      flex: 1,
      marginRight: 12,
    },
    payslipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    payslipNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginRight: 8,
    },
    payslipStatusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    payslipStatusText: {
      fontSize: 10,
      fontWeight: '500',
    },
    payslipPeriod: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 2,
    },
    payslipNetPay: {
      fontSize: 12,
      fontWeight: '500',
      color: '#10B981',
      marginBottom: 2,
    },
    pdfGenerated: {
      fontSize: 10,
      color: '#10B981',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    payslipActions: {
      flexDirection: 'row',
      gap: 8,
    },
    payslipActionButton: {
      padding: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 6,
    },
    disabledButton: {
      opacity: 0.5,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 8,
      gap: 4,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#2563EB',
    },
    divider: {
      height: 8,
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
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    modalCloseButton: {
      padding: 8,
    },
    modalCloseText: {
      fontSize: 18,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: 'bold',
    },
    modalContent: {
      padding: 20,
    },
    modalText: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 20,
      textAlign: 'center',
    },
    pdfButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 20,
    },
    pdfButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 10,
      padding: 16,
      gap: 8,
    },
    downloadButton: {
      backgroundColor: '#10B981',
    },
    pdfButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    pdfUrlContainer: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      padding: 12,
    },
    pdfUrlLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    pdfUrl: {
      fontSize: 10,
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
  });
}