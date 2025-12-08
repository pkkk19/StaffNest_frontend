import { View, Text, StyleSheet, Alert } from 'react-native';
import { Copy, Users, Download, Upload } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';

interface AdminToolsProps {
  onBulkAdd: () => void;
  onCopyWeek: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

export default function AdminTools({
  onBulkAdd,
  onCopyWeek,
  onExport,
  onImport,
}: AdminToolsProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleBulkAdd = () => {
    Alert.alert(
      'Bulk Add Shifts',
      'Add multiple shifts at once for different staff members',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: onBulkAdd }
      ]
    );
  };

  const handleCopyWeek = () => {
    Alert.alert(
      'Copy Previous Week',
      'Copy all shifts from the previous week to this week',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy', onPress: onCopyWeek }
      ]
    );
  };

  const handleExport = () => {
    Alert.alert('Export Rota', 'Export this week\'s rota to PDF/Excel');
    onExport?.();
  };

  const handleImport = () => {
    Alert.alert('Import Shifts', 'Import shifts from Excel/CSV file');
    onImport?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Tools</Text>
      
      <View style={styles.toolsGrid}>
        <ForceTouchable onPress={handleBulkAdd} style={styles.toolButton}>
          <View style={styles.toolIcon}>
            <Users size={24} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
          </View>
          <Text style={styles.toolText}>Bulk Add</Text>
        </ForceTouchable>

        <ForceTouchable onPress={handleCopyWeek} style={styles.toolButton}>
          <View style={styles.toolIcon}>
            <Copy size={24} color={theme === 'dark' ? '#10B981' : '#059669'} />
          </View>
          <Text style={styles.toolText}>Copy Week</Text>
        </ForceTouchable>

        <ForceTouchable onPress={handleExport} style={styles.toolButton}>
          <View style={styles.toolIcon}>
            <Download size={24} color={theme === 'dark' ? '#F59E0B' : '#D97706'} />
          </View>
          <Text style={styles.toolText}>Export</Text>
        </ForceTouchable>

        <ForceTouchable onPress={handleImport} style={styles.toolButton}>
          <View style={styles.toolIcon}>
            <Upload size={24} color={theme === 'dark' ? '#8B5CF6' : '#7C3AED'} />
          </View>
          <Text style={styles.toolText}>Import</Text>
        </ForceTouchable>
      </View>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 16,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  toolIcon: {
    padding: 8,
    backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    borderRadius: 6,
  },
  toolText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
    textAlign: 'center',
  },
});