import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const FILTERS = ['All', 'Present', 'Absent'];

export default function MarkAttendanceScreen({ navigation, route }) {
  const { lectureId, viewOnly = false } = route.params;

  const [lecture, setLecture] = useState(null);
  const [students, setStudents] = useState([]);
  const [absentIds, setAbsentIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const data = await apiRequest(`/attendance/${lectureId}`);
      setLecture(data.lecture);
      setStudents(data.students);
      setAbsentIds(new Set(data.absent_ids || []));
    } catch (err) {
      Alert.alert('Error', 'Failed to load attendance.');
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
    setSaving(true);
    try {
      await apiRequest(`/attendance/${lectureId}`, {
        method: 'PATCH',
        body: { absent_ids: [...absentIds] },
      });
      Alert.alert('Saved', 'Attendance updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.sdc_id.includes(search);
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
        <ActivityIndicator size="large" color="#28388f" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
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
          <Text style={[styles.summaryCount, absentCount > 0 && { color: '#EF4444' }]}>
            {absentCount}
          </Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{students.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={s => s.sdc_id}
        contentContainerStyle={styles.list}
        renderItem={({ item: s }) => {
          const isAbsent = absentIds.has(s.sdc_id);
          return (
            <TouchableOpacity
              style={[styles.studentRow, isAbsent && styles.studentRowAbsent]}
              onPress={() => toggleAbsent(s.sdc_id)}
              activeOpacity={viewOnly ? 1 : 0.7}
            >
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, isAbsent && styles.studentNameAbsent]}>
                  {s.name}
                </Text>
                <Text style={styles.studentId}>{s.sdc_id}</Text>
              </View>
              <View style={[styles.statusBadge, isAbsent ? styles.badgeAbsent : styles.badgePresent]}>
                <Text style={[styles.statusText, isAbsent ? styles.statusTextAbsent : styles.statusTextPresent]}>
                  {isAbsent ? 'Absent' : 'Present'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No students match your search.</Text>
        }
      />

      {/* Save Button */}
      {!viewOnly && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Attendance</Text>
            }
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  summaryBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  summaryLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#f1f5f9' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#f1f5f9',
  },
  filterChipActive: { backgroundColor: '#28388f' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  studentRowAbsent: { borderColor: '#fecaca', backgroundColor: '#fff5f5' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  studentNameAbsent: { color: '#EF4444' },
  studentId: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  badgePresent: { backgroundColor: '#dcfce7' },
  badgeAbsent: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextPresent: { color: '#16a34a' },
  statusTextAbsent: { color: '#EF4444' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  saveBtn: {
    backgroundColor: '#28388f', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});