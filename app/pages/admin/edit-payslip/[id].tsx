import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  PoundSterling,
  User,
  Building,
  Clock,
  Search,
  Filter,
  Check,
  X,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';
import { payslipAPI, staffAPI, rotaAPI, shiftsAPI } from '@/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  tax_info?: {
    tax_code?: string;
  };
  payment_method?: {
    account_number?: string;
    sort_code?: string;
  };
  deduction_types?: Array<{
    name: string;
    code: string;
    type: string;
    calculation_type?: string;
    default_amount?: number;
    is_pre_tax?: boolean;
  }>;
};

type Shift = {
  _id: string;
  title?: string;
  start_time: string;
  end_time: string;
  status: string;
  hours_worked?: number;
  employee_id?: string | { _id: string };
  employee_name?: string;
  date?: string;
};

type Earning = {
  name: string;
  amount: number;
  type: string;
  shift_id?: string;
  hours?: number;
  rate?: number;
  code?: string;
  is_taxable?: boolean;
  is_ni_eligible?: boolean;
};

type Deduction = {
  name: string;
  amount: number;
  type: string;
  code?: string;
  is_pre_tax?: boolean;
  rate?: number;
};

type PayslipForm = {
  employee_id: string;
  staff_member: StaffMember | null;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  shifts: Shift[];
  earnings: Earning[];
  deductions: Deduction[];
  notes?: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paid';
  total_hours: number;
  overtime_hours: number;
  overtime_settings: {
    overtime_threshold: number;
    max_overtime_hours: number;
    overtime_rate_multiplier: number;
  };
};

export default function EditPayslip() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ 
    id: string; 
    employeeId?: string;
    employeeName?: string;
  }>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | 'pay' | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showOvertimeSettings, setShowOvertimeSettings] = useState(false);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  
  const [form, setForm] = useState<PayslipForm>({
    employee_id: '',
    staff_member: null,
    pay_period_start: new Date().toISOString().split('T')[0],
    pay_period_end: new Date().toISOString().split('T')[0],
    pay_date: new Date().toISOString().split('T')[0],
    shifts: [],
    earnings: [],
    deductions: [],
    status: 'draft',
    total_hours: 0,
    overtime_hours: 0,
    overtime_settings: {
      overtime_threshold: 8,
      max_overtime_hours: 12,
      overtime_rate_multiplier: 1.5,
    },
  });

  const styles = createStyles(theme);

  useEffect(() => {
  loadStaffList();
}, []);

// Add this function to load staff list
const loadStaffList = async () => {
  try {
    const response = await staffAPI.getStaff();
    setStaffList(response.data || []);
  } catch (error) {
    console.error('Failed to load staff list:', error);
    Alert.alert('Error', 'Failed to load staff list');
  }
};

  useEffect(() => {
    // If we're editing an existing payslip
    if (params.id && params.id !== 'new') {
      loadPayslip();
    } else {
      // If we're creating a new payslip, check for employeeId parameter
      if (params.employeeId) {
        // Find and set the pre-selected employee from staffList if available
        if (staffList.length > 0) {
          const selectedEmployee = staffList.find(emp => emp._id === params.employeeId);
          if (selectedEmployee) {
            setForm(prev => ({
              ...prev,
              staff_member: selectedEmployee,
              employee_id: params.employeeId!,
            }));
          } else {
            // If not found in staffList, fetch it individually
            loadPreSelectedEmployee(params.employeeId);
          }
        } else {
          // Staff list not loaded yet, fetch individual employee
          loadPreSelectedEmployee(params.employeeId);
        }
      }
      setLoading(false);
    }
  }, [params.id, params.employeeId, staffList]);

   useEffect(() => {
    if (form.staff_member && form.staff_member.deduction_types) {
      const staffDeductions: Deduction[] = form.staff_member.deduction_types.map(deduction => ({
        name: deduction.name,
        amount: deduction.default_amount || 0,
        type: deduction.type,
        code: deduction.code,
        is_pre_tax: deduction.is_pre_tax || false,
        rate: deduction.calculation_type === 'percentage' ? deduction.default_amount : undefined,
      }));
      
      // Keep any existing manual deductions, add staff deductions that aren't already there
      const existingDeductionCodes = form.deductions.map(d => d.code);
      const newStaffDeductions = staffDeductions.filter(d => 
        d.code && !existingDeductionCodes.includes(d.code)
      );
      
      if (newStaffDeductions.length > 0) {
        setForm(prev => ({
          ...prev,
          deductions: [...prev.deductions, ...newStaffDeductions]
        }));
      }
    }
  }, [form.staff_member]);

  const loadPreSelectedEmployee = async (employeeId: string) => {
    try {
      const response = await staffAPI.getStaffMember(employeeId);
      if (response.data) {
        setForm(prev => ({
          ...prev,
          staff_member: response.data,
          employee_id: employeeId,
        }));
      }
    } catch (error) {
      console.error('Failed to load pre-selected employee:', error);
    } finally {
      setLoading(false);
    }
  };

const loadPayslip = async () => {
  try {
    const response = await payslipAPI.getPayslip(params.id as string);
    const data = response.data;
    
    if (data.staff_member) {
      try {
        const staffResponse = await staffAPI.getStaffMember(data.staff_member._id);
        data.staff_member = staffResponse.data;
      } catch (error) {
        console.error('Failed to fetch latest staff data:', error);
      }
    }
    
    // Process payments/earnings
    const earnings: Earning[] = (data.payments || []).map((payment: any) => ({
      name: payment.description || '',
      amount: typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount || 0),
      type: payment.type || 'regular',
      shift_id: payment.custom_field?.shift_id,
      hours: typeof payment.units === 'number' ? payment.units : parseFloat(payment.units || 0),
      rate: typeof payment.rate === 'number' ? payment.rate : parseFloat(payment.rate || 0),
      code: payment.code,
      is_taxable: payment.is_taxable ?? true,
      is_ni_eligible: payment.is_ni_eligible ?? true,
    }));

    // Process deductions - remove duplicates
    const deductionMap = new Map<string, Deduction>();
    (data.deductions || []).forEach((deduction: any) => {
      const code = deduction.code || deduction.custom_field?.code || deduction.type;
      if (code && !deductionMap.has(code)) {
        deductionMap.set(code, {
          name: deduction.description || deduction.custom_field?.name || deduction.type,
          amount: typeof deduction.amount === 'number' ? deduction.amount : parseFloat(deduction.amount || 0),
          type: deduction.type,
          code: code,
          is_pre_tax: deduction.is_pre_tax || false,
          rate: deduction.rate ? parseFloat(deduction.rate) : undefined,
        });
      }
    });
    
    const uniqueDeductions = Array.from(deductionMap.values());

    setForm({
      employee_id: data.employee_id || data.staff_member?._id || '',
      staff_member: data.staff_member || null,
      pay_period_start: data.pay_period_start?.split('T')[0] || new Date().toISOString().split('T')[0],
      pay_period_end: data.pay_period_end?.split('T')[0] || new Date().toISOString().split('T')[0],
      pay_date: data.pay_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      shifts: data.shifts || [],
      earnings: earnings,
      deductions: uniqueDeductions,
      notes: data.notes,
      status: data.status || 'draft',
      total_hours: data.total_hours || data.regular_hours + data.overtime_hours || 0,
      overtime_hours: data.overtime_hours || 0,
      overtime_settings: {
        overtime_threshold: 8,
        max_overtime_hours: 12,
        overtime_rate_multiplier: 1.5,
      },
    });
    setLoading(false);
  } catch (error) {
    console.error('Failed to load payslip:', error);
    Alert.alert('Error', 'Failed to load payslip data');
    setLoading(false);
  }
};

const fetchShiftsForPeriod = async () => {
  if (!form.staff_member || !form.pay_period_start || !form.pay_period_end) {
    Alert.alert('Error', 'Please select employee and pay period first');
    return;
  }

  setShiftsLoading(true);
  try {
    const startDate = new Date(form.pay_period_start);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(form.pay_period_end);
    endDate.setHours(23, 59, 59, 999);
    
    console.log('Fetching shifts for:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      employeeId: form.staff_member._id,
      employeeName: `${form.staff_member.first_name} ${form.staff_member.last_name}`
    });
    
    // Try multiple approaches to fetch shifts
    let shifts = [];
    
    try {
      // First, try fetching all completed shifts in the period
      const response = await shiftsAPI.getShifts({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'completed'
      });
      
      shifts = response.data || [];
      console.log(`API returned ${shifts.length} completed shifts`);
      
    } catch (apiError) {
      console.warn('Could not fetch with status filter, trying without:', apiError);
      
      // If that fails, try without status filter
      const response = await shiftsAPI.getShifts({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      
      shifts = response.data || [];
      console.log(`API returned ${shifts.length} shifts (without status filter)`);
    }
    
    // Debug: Log what we found
    console.log('All shifts found:', shifts.map((s: any) => ({
      id: s._id,
      title: s.title,
      user_id: s.user_id,
      start_time: s.start_time,
      status: s.status
    })));
    
    // Filter by employee ID - handle different possible user_id structures
    const employeeId = form.staff_member._id;
    const filteredShifts = shifts.filter((shift: any) => {
      if (!shift.user_id) return false;
      
      // Case 1: user_id is a string that matches employeeId
      if (typeof shift.user_id === 'string') {
        return shift.user_id === employeeId;
      }
      
      // Case 2: user_id is an object with _id property
      if (shift.user_id && typeof shift.user_id === 'object' && shift.user_id._id) {
        return shift.user_id._id === employeeId;
      }
      
      // Case 3: user_id is an object with $oid (MongoDB ObjectId)
      if (shift.user_id && shift.user_id.$oid) {
        return shift.user_id.$oid === employeeId;
      }
      
      return false;
    });
    
    console.log(`Filtered to ${filteredShifts.length} shifts for employee`);
    
    // Also filter by completed status if not already done
    const completedShifts = filteredShifts.filter((shift: any) => 
      shift.status === 'completed' || shift.status === 'approved'
    );
    
    // Calculate hours for each shift
    const shiftsWithHours = completedShifts.map((shift: any) => {
      // Determine hours worked
      let hoursWorked = 0;
      
      // Priority 1: Use actual clock in/out times
      if (shift.clock_in_time && shift.clock_out_time) {
        const start = new Date(shift.clock_in_time);
        const end = new Date(shift.clock_out_time);
        hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      // Priority 2: Use scheduled times
      else if (shift.start_time && shift.end_time) {
        const start = new Date(shift.start_time);
        const end = new Date(shift.end_time);
        hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      
      // Calculate overtime (convert minutes to hours)
      const overtimeMinutes = shift.overtime_minutes || 0;
      const overtimeHours = overtimeMinutes / 60;
      
      return {
        ...shift,
        hours_worked: parseFloat(hoursWorked.toFixed(2)),
        overtime_hours: parseFloat(overtimeHours.toFixed(2)),
        total_hours: parseFloat((hoursWorked + overtimeHours).toFixed(2)),
        date: shift.start_time ? new Date(shift.start_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });
    
    // Sort by date (most recent first)
    shiftsWithHours.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setForm(prev => ({
      ...prev,
      shifts: shiftsWithHours,
    }));

    // Auto-calculate earnings if we have shifts
    if (shiftsWithHours.length > 0) {
      calculateEarningsFromShifts(shiftsWithHours);
      Alert.alert('Success', `Found ${shiftsWithHours.length} completed shifts for ${form.staff_member.first_name} in the selected period.`);
    } else {
      // Provide more detailed error message
      Alert.alert(
        'No Shifts Found', 
        `No completed shifts found for ${form.staff_member.first_name} ${form.staff_member.last_name} between ${form.pay_period_start} and ${form.pay_period_end}.`
      );
    }
    
  } catch (error) {
    console.error('Failed to fetch shifts:', error);
    Alert.alert(
      'Error', 
      'Failed to fetch shifts. Please check:\n1. Your internet connection\n2. Server status\n3. API endpoint availability'
    );
  } finally {
    setShiftsLoading(false);
  }
};

const calculateEarningsFromShifts = (shifts: any[]) => {
  if (!form.staff_member) return;

  const hourlyRate = form.staff_member.pay_rates?.default_hourly_rate || 0;
  const { overtime_threshold, overtime_rate_multiplier } = form.overtime_settings;
  
  let totalHours = 0;
  let overtimeHours = 0;
  const earnings: Earning[] = [];

  // Calculate earnings for each shift
  shifts.forEach((shift: any) => {
    const hours = shift.hours_worked || 0;
    const shiftOvertimeHours = shift.overtime_hours || 0;
    totalHours += hours;
    
    let regularHours = hours - shiftOvertimeHours;
    
    // Check if shift has pre-calculated overtime
    if (shiftOvertimeHours > 0) {
      overtimeHours += shiftOvertimeHours;
      regularHours = hours - shiftOvertimeHours;
    } 
    // Otherwise calculate overtime based on threshold
    else if (hours > overtime_threshold) {
      regularHours = overtime_threshold;
      const calculatedOvertimeHours = hours - overtime_threshold;
      
      // Apply max overtime limit
      const actualOvertimeHours = Math.min(calculatedOvertimeHours, form.overtime_settings.max_overtime_hours);
      overtimeHours += actualOvertimeHours;
      regularHours = hours - actualOvertimeHours;
    }
    
    // Regular hours earnings
    const regularAmount = regularHours * hourlyRate;
    earnings.push({
      name: `Regular Hours - ${shift.date || 'Shift'}`,
      amount: parseFloat(regularAmount.toFixed(2)),
      type: 'regular',
      shift_id: shift._id,
      hours: parseFloat(regularHours.toFixed(2)),
      rate: hourlyRate,
      code: 'REG',
      is_taxable: true,
      is_ni_eligible: true,
    });
    
    // Overtime hours earnings (if any)
    const shiftTotalOvertime = shiftOvertimeHours || (hours - overtime_threshold > 0 ? hours - overtime_threshold : 0);
    if (shiftTotalOvertime > 0) {
      const actualOvertime = Math.min(shiftTotalOvertime, form.overtime_settings.max_overtime_hours);
      const overtimeRate = hourlyRate * overtime_rate_multiplier;
      const overtimeAmount = actualOvertime * overtimeRate;
      earnings.push({
        name: `Overtime Hours - ${shift.date || 'Shift'}`,
        amount: parseFloat(overtimeAmount.toFixed(2)),
        type: 'overtime',
        shift_id: shift._id,
        hours: parseFloat(actualOvertime.toFixed(2)),
        rate: overtimeRate,
        code: 'OT',
        is_taxable: true,
        is_ni_eligible: true,
      });
    }
  });

  // Calculate total gross pay for deduction calculations
  const totalGrossPay = earnings.reduce((sum, earning) => sum + earning.amount, 0);

  // Create a map to track unique deductions by code
  const deductionMap = new Map<string, Deduction>();
  
  // Add staff member's default deductions
  if (form.staff_member.deduction_types) {
    form.staff_member.deduction_types.forEach(deductionType => {
      if (deductionType.code && !deductionMap.has(deductionType.code)) {
        let calculatedAmount = deductionType.default_amount || 0;
        
        // If it's percentage-based, calculate from total gross pay
        if (deductionType.calculation_type === 'percentage' && deductionType.default_amount) {
          calculatedAmount = (totalGrossPay * deductionType.default_amount) / 100;
        }
        
        deductionMap.set(deductionType.code, {
          name: deductionType.name,
          amount: parseFloat(calculatedAmount.toFixed(2)),
          type: deductionType.type,
          code: deductionType.code,
          is_pre_tax: deductionType.is_pre_tax || false,
          rate: deductionType.calculation_type === 'percentage' ? deductionType.default_amount : undefined,
        });
      }
    });
  }

  // Add tax deduction if tax code exists - with proper calculation
  if (form.staff_member.tax_info?.tax_code) {
    // Use the actual calculation from your database structure
    const taxFreeAllowance = 12570 / 12; // Monthly allowance
    const taxableIncome = Math.max(0, totalGrossPay - taxFreeAllowance);
    const estimatedTax = taxableIncome * 0.20; // 20% basic rate
    
    if (!deductionMap.has('TAX')) {
      deductionMap.set('TAX', {
        name: 'PAYE Tax',
        amount: parseFloat(estimatedTax.toFixed(2)),
        type: 'tax',
        code: 'TAX',
        is_pre_tax: true,
      });
    }
  }

  // Convert map back to array
  const deductions = Array.from(deductionMap.values());

  // Keep any existing bonus/allowance earnings
  const existingBonusEarnings = form.earnings.filter(e => 
    e.type === 'bonus' || e.type === 'allowance'
  );

  setForm(prev => ({
    ...prev,
    earnings: [...existingBonusEarnings, ...earnings],
    deductions,
    total_hours: parseFloat(totalHours.toFixed(2)),
    overtime_hours: parseFloat(overtimeHours.toFixed(2)),
  }));
};

  const handleStaffSelect = (staff: StaffMember) => {
  setForm(prev => ({
    ...prev,
    staff_member: staff,
    employee_id: staff._id,
  }));
  setShowStaffPicker(false);
  
  // Clear any existing data when staff changes
  setForm(prev => ({
    ...prev,
    shifts: [],
    earnings: [],
    deductions: [],
    total_hours: 0,
    overtime_hours: 0,
  }));
  
  // Make sure the staff is in the staffList
  if (!staffList.find(s => s._id === staff._id)) {
    setStaffList(prev => [...prev, staff]);
  }
};

  const handleDateChange = (event: any, selectedDate?: Date, type: 'start' | 'end' | 'pay' = 'start') => {
    setShowDatePicker(null);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setForm(prev => ({
        ...prev,
        ...(type === 'start' && { pay_period_start: dateString }),
        ...(type === 'end' && { pay_period_end: dateString }),
        ...(type === 'pay' && { pay_date: dateString }),
      }));
    }
  };

const addEarning = () => {
  setForm(prev => ({
    ...prev,
    earnings: [{ name: '', amount: 0, type: 'bonus' }, ...prev.earnings],
  }));
};

  const addDeduction = () => {
    setForm(prev => ({
      ...prev,
      deductions: [...prev.deductions, { name: '', amount: 0, type: 'other' }],
    }));
  };

  const handleEarningChange = (index: number, field: keyof Earning, value: string | number) => {
    const newEarnings = [...form.earnings];
    newEarnings[index] = {
      ...newEarnings[index],
      [field]: field === 'amount' ? Number(value) : value,
    };
    setForm(prev => ({ ...prev, earnings: newEarnings }));
  };

  const handleDeductionChange = (index: number, field: keyof Deduction, value: string | number) => {
    const newDeductions = [...form.deductions];
    newDeductions[index] = {
      ...newDeductions[index],
      [field]: field === 'amount' ? Number(value) : value,
    };
    setForm(prev => ({ ...prev, deductions: newDeductions }));
  };

  const removeEarning = (index: number) => {
    const newEarnings = form.earnings.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, earnings: newEarnings }));
  };

  const removeDeduction = (index: number) => {
    const newDeductions = form.deductions.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, deductions: newDeductions }));
  };

const calculateTotals = () => {
  const totalEarnings = form.earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = form.deductions.reduce((sum, item) => sum + item.amount, 0);
  const netPay = totalEarnings - totalDeductions;
  
  return { totalEarnings, totalDeductions, netPay };
};

  const handleStatusChange = (status: PayslipForm['status']) => {
    setForm(prev => ({ ...prev, status }));
  };

  const handleOvertimeSettingChange = (field: keyof PayslipForm['overtime_settings'], value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setForm(prev => ({
        ...prev,
        overtime_settings: {
          ...prev.overtime_settings,
          [field]: numValue,
        },
      }));
    }
  };

  const handleSave = async () => {
    // Validate form
    if (!form.staff_member) {
      Alert.alert('Error', 'Please select an employee');
      return;
    }

    if (new Date(form.pay_period_end) < new Date(form.pay_period_start)) {
      Alert.alert('Error', 'Pay period end must be after start date');
      return;
    }

    if (form.earnings.length === 0) {
      Alert.alert('Warning', 'No earnings added. Continue anyway?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: savePayslip },
      ]);
      return;
    }

    savePayslip();
  };

const savePayslip = async () => {
  setSaving(true);
  try {
    const { totalEarnings, totalDeductions, netPay } = calculateTotals();
    
    // Format data for the backend
    const payload = {
      employee_id: form.staff_member!._id,
      pay_period_start: form.pay_period_start,
      pay_period_end: form.pay_period_end,
      pay_date: form.pay_date,
      include_shifts: form.shifts.length > 0, // Include shifts if we have them
      payments: form.earnings.map(earning => ({
        type: earning.type || 'regular',
        code: earning.code || earning.type?.toUpperCase() || 'BASIC',
        description: earning.name,
        units: earning.hours?.toString() || '0',
        rate: earning.rate?.toString() || '0',
        amount: earning.amount.toString(),
        is_taxable: earning.is_taxable ?? true,
        is_ni_eligible: earning.is_ni_eligible ?? true,
        custom_field: {
          shift_id: earning.shift_id,
          hours: earning.hours
        }
      })),
      deductions: form.deductions.map(deduction => ({
        type: deduction.type || 'other',
        code: deduction.code || deduction.type?.toUpperCase() || 'OTHER',
        description: deduction.name,
        amount: deduction.amount.toString(),
        is_pre_tax: deduction.is_pre_tax || false,
        rate: deduction.rate?.toString() || '0'
      })),
      total_hours: form.total_hours,
      overtime_hours: form.overtime_hours,
      notes: form.notes,
      overtime_settings: form.overtime_settings
    };

    console.log('Sending payslip data:', JSON.stringify(payload, null, 2));

    if (params.id === 'new') {
      await payslipAPI.createPayslip(payload);
      Alert.alert('Success', 'Payslip created successfully');
    } else {
      await payslipAPI.updatePayslip(params.id as string, payload);
      Alert.alert('Success', 'Payslip updated successfully');
    }
    
    router.back();
  } catch (error: any) {
    console.error('Failed to save payslip:', error);
    console.error('Error response:', error.response?.data);
    Alert.alert('Error', error.response?.data?.message || 'Failed to save payslip');
  } finally {
    setSaving(false);
  }
};

  const handleDelete = async () => {
    if (params.id === 'new') return;
    
    Alert.alert(
      'Delete Payslip',
      'Are you sure you want to delete this payslip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await payslipAPI.deletePayslip(params.id as string);
              Alert.alert('Success', 'Payslip deleted successfully');
              router.back();
            } catch (error) {
              console.error('Failed to delete payslip:', error);
              Alert.alert('Error', 'Failed to delete payslip');
            }
          },
        },
      ]
    );
  };

  const navigateToStaffDetails = () => {
    if (form.staff_member) {
      router.push(`/staff-details?id=${form.staff_member._id}`);
    }
  };

 const getEmployeeDisplayId = () => {
  const employeeRef = form.staff_member?.identification?.employee_ref;
  const employeeId = form.staff_member?.employee_id;
  
  // Convert to string to ensure we're not rendering an object
  if (employeeRef) return String(employeeRef);
  if (employeeId) return String(employeeId);
  return 'N/A';
};

  const getEmployeeFullName = () => {
    if (!form.staff_member) return 'Select employee...';
    return `${form.staff_member.first_name} ${form.staff_member.last_name}`;
  };

  const filteredStaff = staffList.filter(staff =>
    `${staff.first_name} ${staff.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.identification?.employee_ref?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { totalEarnings, totalDeductions, netPay } = calculateTotals();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>
          {params.id === 'new' ? 'Create Payslip' : 'Edit Payslip'}
        </Text>
        <ForceTouchable onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size={24} color="#2563EB" />
          ) : (
            <Save size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          )}
        </ForceTouchable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Employee Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Employee Information</Text>
            {form.staff_member && (
              <ForceTouchable 
                style={styles.editStaffButton}
                onPress={navigateToStaffDetails}
              >
                <Text style={styles.editStaffButtonText}>Edit Staff Details</Text>
                <ChevronRight size={16} color="#2563EB" />
              </ForceTouchable>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Employee *</Text>
            <ForceTouchable 
              style={styles.staffSelector}
              onPress={() => setShowStaffPicker(true)}
            >
              <User size={16} color="#6B7280" />
              <Text style={styles.staffSelectorText}>
                {getEmployeeFullName()}
              </Text>
            </ForceTouchable>
          </View>

          {form.staff_member && (
            <View style={styles.staffInfoCard}>
              <View style={styles.staffInfoRow}>
                <View style={styles.staffInfoItem}>
                  <Text style={styles.staffInfoLabel}>Employee ID</Text>
                  <Text style={styles.staffInfoValue}>
                    {getEmployeeDisplayId()}
                  </Text>
                </View>
                <View style={styles.staffInfoItem}>
                  <Text style={styles.staffInfoLabel}>Position</Text>
                  <Text style={styles.staffInfoValue}>
                    {form.staff_member.position || 'Not set'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.staffInfoRow}>
                <View style={styles.staffInfoItem}>
                  <Text style={styles.staffInfoLabel}>Department</Text>
                  <Text style={styles.staffInfoValue}>
                    {form.staff_member.department || 'Not set'}
                  </Text>
                </View>
                <View style={styles.staffInfoItem}>
                  <Text style={styles.staffInfoLabel}>Hourly Rate</Text>
                  <Text style={styles.staffInfoValue}>
                    {form.staff_member.pay_rates?.default_hourly_rate 
                      ? `£${form.staff_member.pay_rates.default_hourly_rate.toFixed(2)}/hr`
                      : 'Not set'}
                  </Text>
                </View>
              </View>

              {form.staff_member.tax_info?.tax_code && (
                <View style={styles.staffInfoRow}>
                  <View style={styles.staffInfoItem}>
                    <Text style={styles.staffInfoLabel}>Tax Code</Text>
                    <Text style={styles.staffInfoValue}>
                      {form.staff_member.tax_info.tax_code}
                    </Text>
                  </View>
                </View>
              )}

              {form.staff_member.payment_method?.account_number && (
                <View style={styles.staffInfoRow}>
                  <View style={styles.staffInfoItem}>
                    <Text style={styles.staffInfoLabel}>Bank Account</Text>
                    <Text style={styles.staffInfoValue}>
                      {form.staff_member.payment_method.account_number}
                      {form.staff_member.payment_method.sort_code && 
                        ` (Sort: ${form.staff_member.payment_method.sort_code})`}
                    </Text>
                  </View>
                </View>
              )}

              {(!form.staff_member.tax_info?.tax_code || !form.staff_member.payment_method?.account_number) && (
                <View style={styles.missingInfoAlert}>
                  <Info size={16} color="#F59E0B" />
                  <Text style={styles.missingInfoText}>
                    Some payroll information is missing. Edit staff details to add missing fields.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Pay Period Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pay Period</Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.label}>Pay Period Start</Text>
              <ForceTouchable 
                style={styles.dateButton}
                onPress={() => setShowDatePicker('start')}
              >
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.dateText}>{form.pay_period_start}</Text>
              </ForceTouchable>
            </View>

            <View style={styles.dateInput}>
              <Text style={styles.label}>Pay Period End</Text>
              <ForceTouchable 
                style={styles.dateButton}
                onPress={() => setShowDatePicker('end')}
              >
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.dateText}>{form.pay_period_end}</Text>
              </ForceTouchable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pay Date</Text>
            <ForceTouchable 
              style={styles.dateButton}
              onPress={() => setShowDatePicker('pay')}
            >
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.dateText}>{form.pay_date}</Text>
            </ForceTouchable>
          </View>

          {form.staff_member && (
            <ForceTouchable
              style={[
                styles.fetchButton,
                shiftsLoading && styles.fetchButtonDisabled
              ]}
              onPress={fetchShiftsForPeriod}
              disabled={shiftsLoading}
            >
              {shiftsLoading ? (
                <ActivityIndicator size={16} color="#FFFFFF" />
              ) : (
                <Clock size={16} color="#FFFFFF" />
              )}
              <Text style={styles.fetchButtonText}>
                {shiftsLoading ? 'Fetching Shifts...' : 'Fetch Shifts for Period'}
              </Text>
            </ForceTouchable>
          )}

          {form.staff_member && (
            <ForceTouchable
              style={styles.overtimeSettingsButton}
              onPress={() => setShowOvertimeSettings(true)}
            >
              <Clock size={16} color="#2563EB" />
              <Text style={styles.overtimeSettingsButtonText}>
                Configure Overtime Settings
              </Text>
            </ForceTouchable>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={new Date(form[showDatePicker === 'start' ? 'pay_period_start' : showDatePicker === 'end' ? 'pay_period_end' : 'pay_date'])}
              mode="date"
              display="default"
              onChange={(event, date) => handleDateChange(event, date, showDatePicker)}
            />
          )}
        </View>

        {/* Shifts Card */}
        {form.shifts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Shifts ({form.shifts.length} found)
              </Text>
              <ForceTouchable
                style={styles.refreshButton}
                onPress={fetchShiftsForPeriod}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </ForceTouchable>
            </View>
            
            <View style={styles.shiftSummary}>
              <View style={styles.shiftStat}>
                <Text style={styles.shiftStatLabel}>Total Hours</Text>
                <Text style={styles.shiftStatValue}>{form.total_hours.toFixed(2)}</Text>
              </View>
              <View style={styles.shiftStat}>
                <Text style={styles.shiftStatLabel}>Overtime Hours</Text>
                <Text style={styles.shiftStatValue}>{form.overtime_hours.toFixed(2)}</Text>
              </View>
              <View style={styles.shiftStat}>
                <Text style={styles.shiftStatLabel}>Regular Hours</Text>
                <Text style={styles.shiftStatValue}>
                  {(form.total_hours - form.overtime_hours).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.shiftsList}>
              {form.shifts.slice(0, 5).map((shift, index) => (
                <View key={shift._id || index} style={styles.shiftItem}>
                  <View>
                    <Text style={styles.shiftDate}>
                      {new Date(shift.date || shift.start_time).toLocaleDateString()}
                    </Text>
                    <Text style={styles.shiftTime}>
                      {new Date(shift.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {new Date(shift.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  </View>
                  <Text style={styles.shiftHours}>
                    {shift.hours_worked?.toFixed(2)} hours
                    {shift.hours_worked && shift.hours_worked > form.overtime_settings.overtime_threshold && (
                      <Text style={styles.overtimeBadge}>
                        {' '}(+{(shift.hours_worked - form.overtime_settings.overtime_threshold).toFixed(2)} OT)
                      </Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>

            {form.shifts.length > 5 && (
              <Text style={styles.moreShiftsText}>
                + {form.shifts.length - 5} more shifts...
              </Text>
            )}
          </View>
        )}

        {/* Earnings Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Earnings</Text>
            <ForceTouchable style={styles.addButton} onPress={addEarning}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Bonus/Allowance</Text>
            </ForceTouchable>
          </View>

          {form.earnings.length === 0 ? (
            <View style={styles.emptySection}>
              <Clock size={32} color="#6B7280" />
              <Text style={styles.emptySectionText}>
                No earnings added yet. Fetch shifts or add manually.
              </Text>
            </View>
          ) : (
            <>
              {form.earnings.map((earning, index) => (
                <View key={index} style={styles.lineItemRow}>
                  <View style={styles.lineItemInputs}>
                    <TextInput
                      style={[styles.input, styles.lineItemName]}
                      value={earning.name}
                      onChangeText={(text) => handleEarningChange(index, 'name', text)}
                      placeholder="Earning name"
                      placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                      editable={earning.type !== 'regular' && earning.type !== 'overtime'}
                    />
                    <TextInput
                      style={[styles.input, styles.lineItemAmount]}
                      value={earning.amount.toString()}
                      onChangeText={(text) => handleEarningChange(index, 'amount', text.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                      keyboardType="decimal-pad"
                      editable={earning.type !== 'regular' && earning.type !== 'overtime'}
                    />
                  </View>
                  {(earning.type === 'bonus' || earning.type === 'allowance') && (
                    <ForceTouchable 
                      style={styles.removeButton}
                      onPress={() => removeEarning(index)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </ForceTouchable>
                  )}
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Earnings</Text>
                <Text style={styles.totalAmount}>£{totalEarnings.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Deductions Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Deductions</Text>
            <ForceTouchable style={styles.addButton} onPress={addDeduction}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </ForceTouchable>
          </View>

          {form.deductions.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                No deductions added. Add default deductions in staff details.
              </Text>
            </View>
          ) : (
            <>
              {form.deductions.map((deduction, index) => (
                <View key={index} style={styles.lineItemRow}>
                  <View style={styles.lineItemInputs}>
                    <TextInput
                      style={[styles.input, styles.lineItemName]}
                      value={deduction.name}
                      onChangeText={(text) => handleDeductionChange(index, 'name', text)}
                      placeholder="Deduction name"
                      placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                    />
                    <TextInput
                      style={[styles.input, styles.lineItemAmount]}
                      value={deduction.amount.toString()}
                      onChangeText={(text) => handleDeductionChange(index, 'amount', text.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <ForceTouchable 
                    style={styles.removeButton}
                    onPress={() => removeDeduction(index)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </ForceTouchable>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Deductions</Text>
                <Text style={[styles.totalAmount, { color: '#EF4444' }]}>
                  £{totalDeductions.toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Gross Pay</Text>
            <Text style={styles.summaryValue}>£{totalEarnings.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Deductions</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              -£{totalDeductions.toFixed(2)}
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.netPayRow]}>
            <Text style={styles.netPayLabel}>Net Pay</Text>
            <Text style={styles.netPayValue}>£{netPay.toFixed(2)}</Text>
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusButtons}>
              {(['draft', 'pending_review', 'approved', 'rejected', 'paid'] as const).map((status) => (
                <ForceTouchable
                  key={status}
                  style={[
                    styles.statusButton,
                    form.status === status && styles.statusButtonActive,
                  ]}
                  onPress={() => handleStatusChange(status)}
                >
                  <Text style={[
                    styles.statusButtonText,
                    form.status === status && styles.statusButtonTextActive,
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </Text>
                </ForceTouchable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.notes}
              onChangeText={(text) => setForm(prev => ({ ...prev, notes: text }))}
              placeholder="Add any notes..."
              placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <ForceTouchable
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size={20} color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {params.id === 'new' ? 'Create Payslip' : 'Save Changes'}
                </Text>
              </>
            )}
          </ForceTouchable>

          {params.id !== 'new' && (
            <ForceTouchable
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete Payslip</Text>
            </ForceTouchable>
          )}
        </View>
      </ScrollView>

      {/* Staff Picker Modal */}
      {showStaffPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Employee</Text>
              <ForceTouchable onPress={() => setShowStaffPicker(false)}>
                <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
              </ForceTouchable>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              />
            </View>
            
            <ScrollView style={styles.staffList}>
              {filteredStaff.length === 0 ? (
                <Text style={styles.emptyText}>No staff members found</Text>
              ) : (
                filteredStaff.map((staff) => (
                  <ForceTouchable
                    key={staff._id}
                    style={styles.staffItem}
                    onPress={() => handleStaffSelect(staff)}
                  >
                    <View style={styles.staffItemContent}>
                      <View>
                        <Text style={styles.staffName}>
                          {staff.first_name} {staff.last_name}
                        </Text>
                        <Text style={styles.staffId}>
                          ID: {staff.identification?.employee_ref || staff.employee_id || 'N/A'}
                        </Text>
                        <Text style={styles.staffPosition}>
                          {staff.position || 'No position'} • {staff.department || 'No department'}
                        </Text>
                        {staff.pay_rates?.default_hourly_rate && (
                          <Text style={styles.staffRate}>
                            £{staff.pay_rates.default_hourly_rate.toFixed(2)}/hr
                          </Text>
                        )}
                      </View>
                      {form.staff_member?._id === staff._id && (
                        <Check size={20} color="#10B981" />
                      )}
                    </View>
                  </ForceTouchable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Overtime Settings Modal */}
      {showOvertimeSettings && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showOvertimeSettings}
          onRequestClose={() => setShowOvertimeSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Overtime Settings</Text>
                <ForceTouchable onPress={() => setShowOvertimeSettings(false)}>
                  <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
                </ForceTouchable>
              </View>

              <View style={styles.settingsContent}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Overtime Threshold (hours)</Text>
                  <Text style={styles.settingDescription}>
                    Hours per shift after which overtime applies
                  </Text>
                  <TextInput
                    style={styles.settingInput}
                    value={form.overtime_settings.overtime_threshold.toString()}
                    onChangeText={(text) => handleOvertimeSettingChange('overtime_threshold', text)}
                    keyboardType="decimal-pad"
                    placeholder="8"
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Max Overtime Hours</Text>
                  <Text style={styles.settingDescription}>
                    Maximum overtime hours allowed per shift
                  </Text>
                  <TextInput
                    style={styles.settingInput}
                    value={form.overtime_settings.max_overtime_hours.toString()}
                    onChangeText={(text) => handleOvertimeSettingChange('max_overtime_hours', text)}
                    keyboardType="decimal-pad"
                    placeholder="12"
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Overtime Rate Multiplier</Text>
                  <Text style={styles.settingDescription}>
                    Overtime rate multiplier (e.g., 1.5 for time-and-a-half)
                  </Text>
                  <TextInput
                    style={styles.settingInput}
                    value={form.overtime_settings.overtime_rate_multiplier.toString()}
                    onChangeText={(text) => handleOvertimeSettingChange('overtime_rate_multiplier', text)}
                    keyboardType="decimal-pad"
                    placeholder="1.5"
                  />
                </View>

                <ForceTouchable
                  style={styles.saveSettingsButton}
                  onPress={() => {
                    setShowOvertimeSettings(false);
                    if (form.shifts.length > 0) {
                      calculateEarningsFromShifts(form.shifts);
                    }
                  }}
                >
                  <Text style={styles.saveSettingsButtonText}>Apply Settings</Text>
                </ForceTouchable>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    editStaffButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    editStaffButtonText: {
      fontSize: 12,
      color: '#2563EB',
      fontWeight: '500',
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#4B5563',
      marginBottom: 8,
    },
    staffSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    staffSelectorText: {
      flex: 1,
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    staffInfoCard: {
      backgroundColor: isDark ? '#37415120' : '#F3F4F6',
      borderRadius: 8,
      padding: 16,
      marginTop: 12,
    },
    staffInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    staffInfoItem: {
      flex: 1,
    },
    staffInfoLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    staffInfoValue: {
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
      fontWeight: '500',
    },
    missingInfoAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      padding: 12,
      borderRadius: 6,
      marginTop: 8,
      gap: 8,
    },
    missingInfoText: {
      flex: 1,
      fontSize: 12,
      color: '#92400E',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    },
    dateInput: {
      flex: 1,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    dateText: {
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    fetchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 8,
      paddingVertical: 12,
      marginTop: 12,
      gap: 8,
    },
    fetchButtonDisabled: {
      opacity: 0.7,
    },
    fetchButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    overtimeSettingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#37415120' : '#F3F4F6',
      borderRadius: 8,
      paddingVertical: 12,
      marginTop: 8,
      gap: 8,
      borderWidth: 1,
      borderColor: '#2563EB20',
    },
    overtimeSettingsButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#2563EB',
    },
    refreshButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    refreshButtonText: {
      fontSize: 12,
      color: '#2563EB',
      fontWeight: '500',
    },
    shiftSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    shiftStat: {
      alignItems: 'center',
      flex: 1,
    },
    shiftStatLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    shiftStatValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#2563EB',
    },
    shiftsList: {
      marginBottom: 8,
    },
    shiftItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#37415120' : '#E5E7EB20',
    },
    shiftDate: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    shiftTime: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    shiftHours: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    overtimeBadge: {
      fontSize: 12,
      color: '#F59E0B',
    },
    moreShiftsText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
    },
    addButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    emptySection: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    emptySectionText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginTop: 8,
    },
    lineItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    lineItemInputs: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
    },
    lineItemName: {
      flex: 2,
    },
    lineItemAmount: {
      flex: 1,
    },
    removeButton: {
      padding: 8,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    totalAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: '#10B981',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    netPayRow: {
      paddingTop: 12,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    netPayLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    netPayValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#10B981',
    },
    statusSection: {
      marginTop: 20,
      marginBottom: 16,
    },
    statusButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    statusButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 6,
    },
    statusButtonActive: {
      backgroundColor: '#2563EB',
    },
    statusButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    statusButtonTextActive: {
      color: '#FFFFFF',
    },
    input: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    actionsContainer: {
      marginBottom: 32,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingVertical: 16,
      marginBottom: 12,
      gap: 8,
    },
    saveButton: {
      backgroundColor: '#2563EB',
    },
    deleteButton: {
      backgroundColor: '#EF4444',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    staffList: {
      maxHeight: 400,
    },
    staffItem: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#37415120' : '#E5E7EB20',
    },
    staffItemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    staffName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    staffId: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 2,
    },
    staffPosition: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
      marginBottom: 2,
    },
    staffRate: {
      fontSize: 12,
      color: '#10B981',
      fontWeight: '500',
    },
    emptyText: {
      textAlign: 'center',
      padding: 20,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    settingsContent: {
      padding: 20,
    },
    settingItem: {
      marginBottom: 20,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
    },
    settingInput: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    saveSettingsButton: {
      backgroundColor: '#2563EB',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    saveSettingsButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}