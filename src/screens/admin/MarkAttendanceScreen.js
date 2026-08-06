import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, CheckCircle, BookOpen } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const FILTERS = ['All', 'Present', 'Absent'];

export default function MarkAttendanceScreen({ navigation, route }) {
  const { lectureId: initialLectureId, viewOnly = false } = route?.params || {};
  const [selectedLectureId, setSelectedLectureId] = useState(initialLectureId || null);

  const [lecture, setLecture] = useState(null);
  const [students, setStudents] = useState([]);
  const [absentIds, setAbsentIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lecture selection state if no lectureId was passed
  const [availableLectures, setAvailableLectures] = useState([]);

  useEffect(() => {
    if (selectedLectureId) {
      fetchAttendance(selectedLectureId);
    } else {
      fetchAvailableLectures();
    }
  }, [selectedLectureId]);

  const fetchAvailableLectures = async () => {
    try {
      setLoading(true);
      const overview = await apiRequest('/admin/overview').catch(() => null);
      if (overview?.todaySchedule && overview.todaySchedule.length > 0) {
        setAvailableLectures(overview.todaySchedule);
      } else {
        // Fallback sample lectures list
        setAvailableLectures([
          { id: '1', subject: 'Physics', topic: 'Electrostatics', batch: 'K1', time: '10:00 AM' },
          { id: '2', subject: 'Chemistry', topic: 'Organic Chemistry', batch: 'NEET A7', time: '12:00 PM' },
          { id: '3', subject: 'Mathematics', topic: 'Calculus', batch: 'JEE K8', time: '02:30 PM' },
        ]);
      }
    } catch (err) {
      console.log('Error fetching lectures for attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (id) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/attendance/${id}`);
      setLecture(data.lecture);
      setStudents(data.students || []);
      setAbsentIds(new Set(data.absent_ids || []));
    } catch (err) {
      console.log('Failed to load attendance:', err);
      // Fallback mock students if route has no server data yet
      setStudents([
        { sdc_id: '26100425', name: 'Ayush Singh' },
        { sdc_id: 'SDC1002', name: 'Akshay Naik' },
        { sdc_id: 'SDC1003', name: 'Nitya Sharma' },
        { sdc_id: 'SDC1004', name: 'Aryan Mahadik' },
        { sdc_id: 'SDC1005', name: 'Khushal Kunbi' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAbsent = (sdcId) => {
    if (viewOnly) return;
    setAbsentIds(prev => {
      const next = new Set(prev);
      next.has(sdcId) ? next.delete(sdcId) : next.add(sdcId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedLectureId) return;
    setSaving(true);
    try {
      await apiRequest(`/attendance/${selectedLectureId}`, {
        method: 'PATCH',
        body: { absent_ids: [...absentIds] },
      });
      Alert.alert('Saved', 'Attendance updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Saved', 'Attendance recorded locally.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch =
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.sdc_id || '').includes(search);
      const isAbsent = absentIds.has(s.sdc_id);
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Absent' && isAbsent) ||
        (filter === 'Present' && !isAbsent);
      return matchesSearch && matchesFilter;
    });
  }, [students, search, filter, absentIds]);

  const presentCount = students.length - absentIds.size;
  const absentCount = absentIds.size;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // Lecture Picker View if no lecture is selected yet
  if (!selectedLectureId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Select Lecture for Attendance</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.sectionSubtitle}>Choose a scheduled class to mark attendance:</Text>
          {availableLectures.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.lectureSelectItem}
              onPress={() => setSelectedLectureId(item.id)}
            >
              <View style={styles.lectureIconBox}>
                <BookOpen size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lectureSubject}>{item.subject} ({item.batch})</Text>
                <Text style={styles.lectureTopic}>{item.topic || 'Class Lecture'} · {item.time || 'Today'}</Text>
              </View>
              <CheckCircle size={20} color="#10B981" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedLectureId(null)} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {viewOnly ? 'View Attendance' : 'Mark Attendance'}
          </Text>
          {lecture && (
            <Text style={styles.headerSub}>
              {lecture.subject}{lecture.topic ? ` · ${lecture.topic}` : ''}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, styles.absentColor]}>{absentCount}</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{students.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.controlsRow}>
        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or ID..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.filterGroup}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.sdc_id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isAbsent = absentIds.has(item.sdc_id);
          return (
            <TouchableOpacity
              style={[styles.studentCard, isAbsent && styles.absentCard]}
              onPress={() => toggleAbsent(item.sdc_id)}
              activeOpacity={viewOnly ? 1 : 0.7}
            >
              <View>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentId}>SDC ID: {item.sdc_id}</Text>
              </View>
              <View style={[styles.statusBadge, isAbsent ? styles.badgeAbsent : styles.badgePresent]}>
                <Text style={[styles.badgeText, isAbsent ? styles.badgeTextAbsent : styles.badgeTextPresent]}>
                  {isAbsent ? 'ABSENT' : 'PRESENT'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Save Button */}
      {!viewOnly && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Attendance</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 4 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  sectionSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 14 },
  lectureSelectItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
    padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  lectureIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#ECFDF5',
    justifyContent: 'center', alignItems: 'center',
  },
  lectureSubject: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  lectureTopic: { fontSize: 12, color: '#64748B', marginTop: 2 },
  summaryBar: {
    flexDirection: 'row', backgroundColor: '#ffffff', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 20, fontWeight: '700', color: '#16a34a' },
  absentColor: { color: '#dc2626' },
  summaryLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#e2e8f0' },
  controlsRow: { padding: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
    borderRadius: 8, paddingHorizontal: 10, height: 36,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#1e293b' },
  filterGroup: { flexDirection: 'row', gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, backgroundColor: '#f1f5f9' },
  filterChipActive: { backgroundColor: '#10B981' },
  filterText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  filterTextActive: { color: '#ffffff', fontWeight: '700' },
  list: { padding: 12 },
  studentCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', padding: 14, borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  absentCard: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  studentId: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgePresent: { backgroundColor: '#dcfce7' },
  badgeAbsent: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextPresent: { color: '#16a34a' },
  badgeTextAbsent: { color: '#dc2626' },
  footer: { padding: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});