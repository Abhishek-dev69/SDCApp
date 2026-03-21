import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Image
} from 'react-native';
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

const { width } = Dimensions.get('window');

const MOCK_BATCHES = [
  { id: '1', name: 'NEET A7', class: 'Class 12th', studentCount: 42, teacherCount: 5, timing: '08:00 AM - 12:00 PM' },
  { id: '2', name: 'JEE K8', class: 'Class 11th', studentCount: 38, teacherCount: 4, timing: '12:30 PM - 04:30 PM' },
  { id: '3', name: 'Foundation B3', class: 'Class 10th', studentCount: 25, teacherCount: 3, timing: '05:00 PM - 07:00 PM' },
];

const MOCK_STUDENTS = [
  { id: '1', name: 'Manasvi Gawli', rollNo: '1204', status: 'Present', attendance: '94%' },
  { id: '2', name: 'Aarav Patel', rollNo: '1208', status: 'Absent', attendance: '88%' },
  { id: '3', name: 'Ishita Sharma', rollNo: '1215', status: 'Present', attendance: '91%' },
  { id: '4', name: 'Kabir Singh', rollNo: '1222', status: 'Present', attendance: '85%' },
];

const MOCK_TEACHERS = [
  { id: '1', name: 'Dr. Vivek Sharma', subject: 'Physics', experience: '12 Years', status: 'On Duty' },
  { id: '2', name: 'Prof. Anjali Roy', subject: 'Chemistry', experience: '8 Years', status: 'On Duty' },
  { id: '3', name: 'Sanjay Gupta', subject: 'Biology', experience: '15 Years', status: 'Leave' },
];

export default function AdminBatchesScreen() {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeSegment, setActiveSegment] = useState('students'); // 'students' or 'teachers'

  const renderBatchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.batchCard}
      onPress={() => setSelectedBatch(item)}
    >
      <View style={styles.batchInfo}>
        <View style={styles.batchHeaderRow}>
          <Text style={styles.batchName}>{item.name}</Text>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{item.class}</Text>
          </View>
        </View>
        
        <View style={styles.batchDetailRow}>
          <View style={styles.batchDetailItem}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.batchDetailText}>{item.timing}</Text>
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
        <Text style={styles.personSubtext}>Roll No: {item.rollNo} • Attendance: {item.attendance}</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'Present' ? styles.presentBadge : styles.absentBadge]}>
        <Text style={[styles.statusBadgeText, item.status === 'Present' ? styles.presentText : styles.absentText]}>{item.status}</Text>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedBatch(null)} style={styles.backButton}>
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{selectedBatch.name}</Text>
            <Text style={styles.headerSubtitle}>{selectedBatch.class} • {selectedBatch.timing}</Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
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

        <FlatList
          data={activeSegment === 'students' ? MOCK_STUDENTS : MOCK_TEACHERS}
          keyExtractor={item => item.id}
          renderItem={activeSegment === 'students' ? renderStudentItem : renderTeacherItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Batches</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Search size={24} color="#1e293b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Plus size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={MOCK_BATCHES}
        keyExtractor={item => item.id}
        renderItem={renderBatchItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
});
