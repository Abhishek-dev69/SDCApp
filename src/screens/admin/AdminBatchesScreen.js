import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator,
  Alert,
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Search, 
  Plus, 
  Users, 
  UserCheck, 
  BookOpen,
  ChevronRight,
  Clock,
  Calendar
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');

export default function AdminBatchesScreen({ navigation }) {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeSegment, setActiveSegment] = useState('students'); // 'students' or 'teachers'
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/batches');
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Unable to Load Batches', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadBatchPeople = async (batch) => {
    setDetailLoading(true);
    try {
      const data = await apiRequest(`/admin/batches/${encodeURIComponent(batch.id)}/people`);
      setStudents(data.students || []);
      setTeachers(data.teachers || []);
    } catch (err) {
      Alert.alert('Unable to Load Batch Details', err.message || 'Please try again.');
      setStudents([]);
      setTeachers([]);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadBatches);
    loadBatches();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (selectedBatch) {
      loadBatchPeople(selectedBatch);
    }
  }, [selectedBatch]);

  const handleCreateBatch = () => {
    navigation.navigate('AddBatch');
  };

  const renderBatchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.batchCard}
      onPress={() => setSelectedBatch(item)}
    >
      <View style={styles.batchInfo}>
        <View style={styles.batchHeaderRow}>
          <Text style={styles.batchName}>{item.name}</Text>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{item.stream || item.program}</Text>
          </View>
        </View>
        
        <View style={styles.batchDetailRow}>
          <View style={styles.batchDetailItem}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.batchDetailText}>{item.timing || `${item.branch} • ${item.program}`}</Text>
          </View>
        </View>

        <View style={styles.batchStatsRow}>
          <View style={styles.statItem}>
            <Users size={16} color="#3B82F6" />
            <Text style={styles.statText}>{item.studentCount} Students</Text>
          </View>
          <View style={styles.statItem}>
            <UserCheck size={16} color="#10B981" />
            <Text style={styles.statText}>{item.teacherCount} Teachers</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  const renderStudentItem = ({ item }) => (
    <View style={styles.personCard}>
      <View style={styles.personAvatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{item.name}</Text>
        <Text style={styles.personSubtext}>Roll No: {item.rollNo || 'N/A'} • Batch: {item.batch}</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'Active' ? styles.presentBadge : styles.absentBadge]}>
        <Text style={[styles.statusBadgeText, item.status === 'Active' ? styles.presentText : styles.absentText]}>{item.status}</Text>
      </View>
    </View>
  );

  const renderTeacherItem = ({ item }) => (
    <View style={styles.personCard}>
      <View style={[styles.personAvatar, { backgroundColor: '#E0E7FF' }]}>
        <Text style={[styles.avatarText, { color: '#4338CA' }]}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.name}</Text>
        <Text style={styles.personSubtext}>{item.subject} • {item.experience}</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'On Duty' ? styles.presentBadge : styles.absentBadge]}>
        <Text style={[styles.statusBadgeText, item.status === 'On Duty' ? styles.presentText : styles.absentText]}>{item.status}</Text>
      </View>
    </View>
  );

  if (selectedBatch) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedBatch(null)} style={styles.backButton}>
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{selectedBatch.name}</Text>
            <Text style={styles.headerSubtitle}>{selectedBatch.branch} • {selectedBatch.program}</Text>
        </View>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate(activeSegment === 'students' ? 'AddStudent' : 'AddTeacher')}>
            <Plus size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentButton, activeSegment === 'students' && styles.activeSegment]}
            onPress={() => setActiveSegment('students')}
          >
            <Text style={[styles.segmentText, activeSegment === 'students' && styles.activeSegmentText]}>Students</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentButton, activeSegment === 'teachers' && styles.activeSegment]}
            onPress={() => setActiveSegment('teachers')}
          >
            <Text style={[styles.segmentText, activeSegment === 'teachers' && styles.activeSegmentText]}>Teachers</Text>
          </TouchableOpacity>
        </View>

        {detailLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#28388f" />
          </View>
        ) : (
          <FlatList
            data={activeSegment === 'students' ? students : teachers}
            keyExtractor={item => item.id}
            renderItem={activeSegment === 'students' ? renderStudentItem : renderTeacherItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No {activeSegment} assigned yet.</Text>}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Batches</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Search size={24} color="#1e293b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateBatch}>
            <Plus size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#28388f" />
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={item => item.id}
          renderItem={renderBatchItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No batches found. Create your first batch.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  batchInfo: {
    flex: 1,
  },
  batchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  batchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  classBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  batchDetailRow: {
    marginBottom: 16,
  },
  batchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  batchStatsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeSegment: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeSegmentText: {
    color: '#28388f',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  personSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  presentBadge: {
    backgroundColor: '#dcfce7',
  },
  presentText: {
    color: '#16a34a',
  },
  absentBadge: {
    backgroundColor: '#fee2e2',
  },
  absentText: {
    color: '#dc2626',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    paddingVertical: 40,
    fontSize: 14,
  },
});
