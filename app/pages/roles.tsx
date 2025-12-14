import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { rolesAPI, companiesAPI } from '@/services/api';
import { Plus, Edit2, Trash2, Building } from 'lucide-react-native';
import { Role } from '../types/roles';

export default function RolesPage() {
  const { theme } = useTheme();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = createStyles(theme);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      // First, get company ID to verify user has company
      const companyResponse = await companiesAPI.getMyCompany();
      
      if (!companyResponse.data) {
        Alert.alert('No Company', 'You need to setup a company first');
        router.back();
        return;
      }
      
      // Then get roles for that company
      const rolesResponse = await rolesAPI.getRoles();
      setRoles(rolesResponse.data);
    } catch (error) {
      console.error('Error loading roles:', error);
      Alert.alert('Error', 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    Alert.alert(
      'Delete Role',
      `Delete ${title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await rolesAPI.deleteRole(id);
              loadRoles(); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete role');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Roles</Text>
        <Text style={styles.subtitle}>Job positions in your company</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/pages/role-form')}
        >
          <Plus size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Role</Text>
        </TouchableOpacity>

        {roles.length === 0 ? (
          <View style={styles.empty}>
            <Building size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No roles yet</Text>
            <Text style={styles.emptySubtext}>Add your first role</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {roles.map((role: Role) => (
              <View key={role._id} style={styles.roleCard}>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.rolePay}>
                    ${role.pay_amount}/{role.pay_unit}
                  </Text>
                  {role.description && (
                    <Text style={styles.roleDesc}>{role.description}</Text>
                  )}
                </View>
                
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/pages/role-form?id=${role._id}`)}
                  >
                    <Edit2 size={18} color="#4B5563" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDelete(role._id, role.title)}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: theme === 'dark' ? '#fff' : '#000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme === 'dark' ? '#fff' : '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#fff' : '#000',
  },
  rolePay: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 4,
  },
  roleDesc: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});