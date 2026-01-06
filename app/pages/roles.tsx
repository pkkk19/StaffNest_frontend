// roles.tsx - Improved UI with refresh and back button
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { rolesAPI, companiesAPI } from '@/services/api';
import { Plus, Edit2, Trash2, Users, Clock, ChevronLeft, Briefcase, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import { Role } from '../types/roles';

export default function RolesPage() {
  const { theme } = useTheme();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const styles = createStyles(theme);

  const loadRoles = async () => {
    try {
      const companyResponse = await companiesAPI.getMyCompany();
      
      if (!companyResponse.data) {
        Alert.alert('No Company', 'You need to setup a company first');
        router.back();
        return;
      }
      
      const rolesResponse = await rolesAPI.getRoles();
      setRoles(rolesResponse.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      Alert.alert('Error', 'Failed to load roles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRoles();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await rolesAPI.deleteRole(id);
              loadRoles();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete role');
            }
          }
        }
      ]
    );
  };

  const getRoleStats = (role: Role) => {
    const qualifiedUsers = role.qualified_users?.length || 0;
    const activeShifts = role.shifts?.filter(shift => shift.is_active).length || 0;
    const totalShifts = role.shifts?.length || 0;
    
    return { qualifiedUsers, activeShifts, totalShifts };
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#1E40AF'} />
        <Text style={styles.loadingText}>Loading roles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={theme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Roles Management</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <RefreshCw size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.headerContent}>
          <Briefcase size={32} color="#3B82F6" />
          <Text style={styles.title}>Roles & Positions</Text>
          <Text style={styles.subtitle}>
            {roles.length} role{roles.length !== 1 ? 's' : ''} defined • Manage job positions and schedules
          </Text>
        </View>
      </View>

      {/* Content Area */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor={theme === 'dark' ? '#fff' : '#3B82F6'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        {roles.length > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Users size={20} color="#3B82F6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {roles.reduce((acc, role) => acc + (role.qualified_users?.length || 0), 0)}
                </Text>
                <Text style={styles.statLabel}>Total Staff</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Clock size={20} color="#10B981" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  {roles.reduce((acc, role) => acc + (role.shifts?.length || 0), 0)}
                </Text>
                <Text style={styles.statLabel}>Total Shifts</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIconText}>👥</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{roles.length}</Text>
                <Text style={styles.statLabel}>Active Roles</Text>
              </View>
            </View>
          </View>
        )}

        {/* Add Role Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/pages/role-form')}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonIcon}>
            <Plus size={22} color="#fff" />
          </View>
          <Text style={styles.addButtonText}>Create New Role</Text>
        </TouchableOpacity>

        {/* Roles List */}
        {roles.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Briefcase size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Roles Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first role to start managing schedules and assignments
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/pages/role-form')}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.emptyButtonText}>Create First Role</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rolesList}>
            <Text style={styles.sectionTitle}>All Roles ({roles.length})</Text>
            
            {roles.map((role: Role) => {
              const stats = getRoleStats(role);
              
              return (
                <TouchableOpacity 
                  key={role._id} 
                  style={styles.roleCard}
                  onPress={() => router.push(`/pages/role-form?id=${role._id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.roleCardHeader}>
                    <View style={styles.roleTitleContainer}>
                      <Text style={styles.roleTitle}>{role.title}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: role.is_active ? '#10B98115' : '#EF444415' }
                      ]}>
                        {role.is_active ? (
                          <CheckCircle size={12} color="#10B981" />
                        ) : (
                          <XCircle size={12} color="#EF4444" />
                        )}
                        <Text style={[
                          styles.statusText,
                          { color: role.is_active ? '#10B981' : '#EF4444' }
                        ]}>
                          {role.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.roleActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push(`/pages/role-form?id=${role._id}`)}
                      >
                        <Edit2 size={18} color="#6B7280" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(role._id, role.title);
                        }}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {role.description && (
                    <Text style={styles.roleDescription} numberOfLines={2}>
                      {role.description}
                    </Text>
                  )}
                  
                  <View style={styles.roleStats}>
                    <View style={styles.statPill}>
                      <Users size={14} color="#3B82F6" />
                      <Text style={styles.statPillText}>
                        {stats.qualifiedUsers} staff
                      </Text>
                    </View>
                    
                    <View style={styles.statPill}>
                      <Clock size={14} color="#8B5CF6" />
                      <Text style={styles.statPillText}>
                        {stats.activeShifts}/{stats.totalShifts} shifts
                      </Text>
                    </View>
                    
                    {role.default_break_minutes && role.default_break_minutes > 0 && (
                      <View style={[styles.statPill, styles.breakPill]}>
                        <Text style={styles.breakIcon}>☕</Text>
                        <Text style={styles.breakText}>
                          {formatTime(role.default_break_minutes)} break
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {role.position && role.position > 0 && (
                    <View style={styles.positionIndicator}>
                      <Text style={styles.positionText}>
                        Position #{role.position}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.lastUpdated}>
                      Updated recently
                    </Text>
                    <View style={styles.arrowContainer}>
                      <Text style={styles.arrow}>→</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    fontWeight: '500',
  },
  
  // Header Styles
  header: {
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Content Area
  content: {
    flex: 1,
  },
  
  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme === 'dark' ? 0 : 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    marginHorizontal: 12,
  },
  statIconText: {
    fontSize: 20,
  },
  
  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#1E40AF' : '#3B82F6',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Roles List
  rolesList: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
    marginBottom: 16,
  },
  
  // Role Card
  roleCard: {
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme === 'dark' ? 0 : 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roleTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
    marginRight: 8,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  roleActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
  },
  deleteButton: {
    backgroundColor: theme === 'dark' ? '#450A0A' : '#FEF2F2',
    borderColor: theme === 'dark' ? '#7F1D1D' : '#FECACA',
  },
  roleDescription: {
    fontSize: 14,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  roleStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme === 'dark' ? '#94A3B8' : '#475569',
  },
  breakPill: {
    backgroundColor: theme === 'dark' ? '#1E3A2A' : '#F0FDF4',
  },
  breakIcon: {
    fontSize: 12,
  },
  breakText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme === 'dark' ? '#4ADE80' : '#16A34A',
  },
  positionIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    marginBottom: 16,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#334155' : '#E2E8F0',
  },
  lastUpdated: {
    fontSize: 12,
    color: theme === 'dark' ? '#64748B' : '#94A3B8',
    fontStyle: 'italic',
  },
  arrowContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 16,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    fontWeight: 'bold',
  },
  
  // Bottom Spacing
  bottomSpacing: {
    height: 40,
  },
});