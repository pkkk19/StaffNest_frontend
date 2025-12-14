import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { rolesAPI } from '@/services/api';
import { ArrowLeft } from 'lucide-react-native';

// Define the pay unit options
type PayUnit = 'hourly' | 'monthly' | 'weekly' | 'fortnightly';

export default function RoleForm() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const styles = createStyles(theme);

  const [form, setForm] = useState<{
    title: string;
    description: string;
    pay_amount: string;
    pay_unit: PayUnit;
  }>({
    title: '',
    description: '',
    pay_amount: '',
    pay_unit: 'hourly',
  });

  useEffect(() => {
    if (isEdit && id) {
      loadRole();
    }
  }, [id]);

  const loadRole = async () => {
    try {
      const response = await rolesAPI.getRoles();
      const allRoles: any[] = response.data;
      const roleToEdit = allRoles.find((r: any) => r._id === id);
      
      if (roleToEdit) {
        setForm({
          title: roleToEdit.title,
          description: roleToEdit.description || '',
          pay_amount: roleToEdit.pay_amount.toString(),
          pay_unit: roleToEdit.pay_unit as PayUnit,
        });
      } else {
        Alert.alert('Error', 'Role not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading role:', error);
      Alert.alert('Error', 'Failed to load role data');
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter role title');
      return;
    }

    const payAmount = Number(form.pay_amount);
    if (!form.pay_amount || isNaN(payAmount) || payAmount <= 0) {
      Alert.alert('Error', 'Please enter valid pay amount');
      return;
    }

    try {
      const roleData = {
        title: form.title,
        description: form.description,
        pay_amount: payAmount,
        pay_unit: form.pay_unit,
        is_active: true,
      };

      if (isEdit && id) {
        await rolesAPI.updateRole(id, roleData);
        Alert.alert('Success', 'Role updated successfully');
      } else {
        await rolesAPI.createRole(roleData);
        Alert.alert('Success', 'Role created successfully');
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving role:', error);
      Alert.alert('Error', 'Failed to save role');
    }
  };

  const handlePayUnitChange = (unit: PayUnit) => {
    setForm({...form, pay_unit: unit});
  };

  const PayUnitButton = ({ unit, label }: { unit: PayUnit; label: string }) => (
    <TouchableOpacity
      style={[
        styles.payUnitButton,
        form.pay_unit === unit && styles.payUnitButtonActive
      ]}
      onPress={() => handlePayUnitChange(unit)}
    >
      <Text style={[
        styles.payUnitText,
        form.pay_unit === unit && styles.payUnitTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEdit ? 'Edit Role' : 'Add New Role'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Role Title</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(text) => setForm({...form, title: text})}
            placeholder="e.g., Manager, Cashier"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={form.description}
            onChangeText={(text) => setForm({...form, description: text})}
            placeholder="Role description"
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pay Amount</Text>
          <TextInput
            style={styles.input}
            value={form.pay_amount}
            onChangeText={(text) => setForm({...form, pay_amount: text})}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pay Unit</Text>
          <View style={styles.payUnitGrid}>
            <PayUnitButton unit="hourly" label="Hourly" />
            <PayUnitButton unit="weekly" label="Weekly" />
            <PayUnitButton unit="fortnightly" label="Fortnightly" />
            <PayUnitButton unit="monthly" label="Monthly" />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>
            {isEdit ? 'Update Role' : 'Create Role'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme === 'dark' ? '#fff' : '#000',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme === 'dark' ? '#374151' : '#fff',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme === 'dark' ? '#fff' : '#000',
  },
  payUnitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  payUnitButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
  },
  payUnitButtonActive: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#fff',
    borderColor: '#3B82F6',
  },
  payUnitText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontWeight: '500',
  },
  payUnitTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});