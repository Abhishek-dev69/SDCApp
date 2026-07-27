import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Plus, User, Users } from 'lucide-react-native';
import WeeklyTimetable from '../../components/WeeklyTimetable';
import { useUserSession } from '../../context/UserSessionContext';
import { apiRequest } from '../../services/api';

const STATUS_STYLES = {
  scheduled: { bg: '#e8eaf6', text: '#28388f', label: 'Scheduled' },
  live: { bg: '#dcfce7', text: '#16a34a', label: 'Live' },
  completed: { bg: '#f1f5f9', text: '#64748b', label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
};

function getWeekStart(date) {
  const value = new Date(date);
  const day = value.getDay();
  value.setDate(value.getDate() - day + (day === 0 ? -6 : 1));
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AdminTimetableScreen({ navigation }) {
  const { userProfile } = useUserSession();
  const [lectures, setLectures] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(userProfile?.location || null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));

  const locations = useMemo(
    () => [...new Set(batches.map((batch) => batch.location).filter(Boolean))].sort(),
    [batches]
  );

  const loadBatches = useCallback(async () => {
    try {
      const data = await apiRequest('/admin/lectures/batches');
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Unable to Load Batches', err.message || 'Please try again.');
    }
  }, []);

  const loadData = useCallback(async (requestedWeek = weekStart) => {
    setLoading(true);
    try {
      const from = requestedWeek.toISOString().split('T')[0];
      const end = new Date(requestedWeek);
      end.setDate(end.getDate() + 7);
      const to = end.toISOString().split('T')[0];
      const data = await apiRequest(`/admin/lectures?from=${from}&to=${to}`);
      setLectures(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Unable to Load Timetable', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  React.useEffect(() => {
  const unsubscribe = navigation.addListener('focus',() => loadData(weekStart));
  loadData(weekStart);
  return unsubscribe;
}, []);


  useEffect(() => {
    if (selectedLocation || locations.length === 0) return;
    setSelectedLocation(
      locations.includes(userProfile?.location) ? userProfile.location : locations[0]
    );
  }, [locations, selectedLocation, userProfile?.location]);

  const filteredLectures = lectures
    .filter((lecture) => !selectedLocation || lecture.location === selectedLocation)
    .filter(
      (lecture) => !selectedBatchId || Number(lecture.batch_id) === Number(selectedBatchId)
    );

  const isBatchActive = (batchId) => {
    if (loading) return true;
    const batchLectures = lectures.filter(
      (lecture) => Number(lecture.batch_id) === Number(batchId)
    );
    return batchLectures.some((lecture) => ['scheduled', 'live'].includes(lecture.status));
  };

  const changeWeek = (days) => {
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(nextWeek.getDate() + days);
    setWeekStart(nextWeek);
    loadData(nextWeek);
  };

  const runLectureAction = async (action, fallbackMessage) => {
    try {
      await apiRequest(`/admin/lectures/${selectedLecture.id}/${action}`, { method: 'PATCH' });
      setSheetVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Unable to Update Lecture', err.message || fallbackMessage);
    }
  };

  const cancelLecture = () => {
    Alert.alert('Cancel Lecture', 'Are you sure you want to cancel this lecture?', [
      { text: 'Keep Lecture', style: 'cancel' },
      {
        text: 'Cancel Lecture',
        style: 'destructive',
        onPress: () => runLectureAction('cancel', 'Could not cancel lecture.'),
      },
    ]);
  };

  const filterComponent = useMemo(() => (
    <View style={styles.filterArea}>
      <View style={styles.locationRow}>
        <TouchableOpacity
          style={styles.locationDropdown}
          onPress={() => setLocationDropdownOpen((open) => !open)}
        >
          <Text style={styles.locationDropdownText}>
            {selectedLocation || 'All locations'}
          </Text>
          <Text style={styles.locationDropdownArrow}>
            {locationDropdownOpen ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {locationDropdownOpen && (
          <View style={styles.locationDropdownMenu}>
            {locations.map((location) => (
              <TouchableOpacity
                key={location}
                style={[
                  styles.locationDropdownItem,
                  selectedLocation === location && styles.locationDropdownItemActive,
                ]}
                onPress={() => {
                  setSelectedLocation(location);
                  setSelectedBatchId(null);
                  setLocationDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.locationDropdownItemText,
                    selectedLocation === location && styles.locationDropdownItemTextActive,
                  ]}
                >
                  {location}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.batchList}
      >
        <TouchableOpacity
          style={[styles.batchChip, !selectedBatchId && styles.batchChipActive]}
          onPress={() => setSelectedBatchId(null)}
        >
          <Text style={[styles.batchChipText, !selectedBatchId && styles.batchChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {batches
          .filter((batch) => !selectedLocation || batch.location === selectedLocation)
          .map((batch) => {
            const active = isBatchActive(batch.id);
            const selected = Number(selectedBatchId) === Number(batch.id);
            return (
              <TouchableOpacity
                key={batch.id}
                style={[
                  styles.batchChip,
                  selected && styles.batchChipActive,
                  !active && styles.batchChipDisabled,
                ]}
                onPress={() => active && setSelectedBatchId(batch.id)}
                disabled={!active}
              >
                <Text
                  style={[
                    styles.batchChipText,
                    selected && styles.batchChipTextActive,
                    !active && styles.batchChipTextDisabled,
                  ]}
                >
                  {batch.name}
                </Text>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>

    {/* Batch chips row */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexDirection: 'row' }}
    >
      {batches
        .filter(b => b.location === selectedLocation)
        .map(batch => {
          const active = isBatchActive(batch.id);
          return (
            <TouchableOpacity
              key={batch.id}
              style={[
                styles.batchChip,
                selectedBatchId === batch.id && styles.batchChipActive,
                !active && styles.batchChipDisabled,
              ]}
              onPress={() => active ? setSelectedBatchId(prev => prev === batch.id ? null : batch.id) : null}
            >
              <Text style={[
                styles.batchChipText,
                selectedBatchId === batch.id && styles.batchChipTextActive,
                !active && styles.batchChipTextDisabled,
              ]}>
                {batch.name}
              </Text>
            </TouchableOpacity>
          );
        })}
    </ScrollView>
  </View>
), [selectedLocation, selectedBatchId, batches, locationDropdownOpen, lectures]);


return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Timetable</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddLecture', {batches})}
        >
          <Plus size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#28388f" />
        </View>
      ) : (
        <WeeklyTimetable
          lectures={filteredLectures}
          onLecturePress={(lecture) => {
            setSelectedLecture(lecture);
            setSheetVisible(true);
          }}
          filterComponent={filterComponent}
          weekStart={weekStart}
          loading={loading}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      )}

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSheetVisible(false)}
        >
          <TouchableOpacity style={styles.bottomSheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            {selectedLecture && (
              <>
                <View style={styles.sheetTitleRow}>
                  <Text style={styles.sheetSubject}>{selectedLecture.subject}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_STYLES[selectedLecture.status]?.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: STATUS_STYLES[selectedLecture.status]?.text },
                      ]}
                    >
                      {STATUS_STYLES[selectedLecture.status]?.label || selectedLecture.status}
                    </Text>
                  </View>
                </View>
                {!!selectedLecture.topic && (
                  <Text style={styles.sheetTopic}>{selectedLecture.topic}</Text>
                )}
                <View style={styles.sheetRow}>
                  <Clock size={15} color="#64748b" />
                  <Text style={styles.sheetRowText}>
                    {formatTime(selectedLecture.scheduled_at)} · {selectedLecture.duration_mins} min
                  </Text>
                </View>
                {!!selectedLecture.teacher_name && (
                  <View style={styles.sheetRow}>
                    <User size={15} color="#64748b" />
                    <Text style={styles.sheetRowText}>{selectedLecture.teacher_name}</Text>
                  </View>

                  <View style={styles.sheetDivider} />

                  {selectedLecture.status === 'scheduled' && (
                    <View style={styles.sheetActions}>
                      <TouchableOpacity style={[styles.sheetBtn, styles.btnPrimary]} onPress={handleStartLecture}>
                        <Text style={styles.btnPrimaryText}>Start Lecture</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sheetBtn, styles.btnSecondary]}
                        onPress={() => { setSheetVisible(false); navigation.navigate('AddLecture', { lecture: selectedLecture, batches }); }}
                      >
                        <Text style={styles.btnSecondaryText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.sheetBtn, styles.btnDanger]} onPress={handleCancelLecture}>
                        <Text style={styles.btnDangerText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedLecture.status === 'in_progress' && (
                    <View style={styles.sheetActions}>
                      <TouchableOpacity style={[styles.sheetBtn, styles.btnPrimary]} onPress={handleCompleteLecture}>
                        <Text style={styles.btnPrimaryText}>Mark Conducted</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sheetBtn, styles.btnSecondary]}
                        onPress={() => { setSheetVisible(false); navigation.navigate('MarkAttendance', { lectureId: selectedLecture.id, viewOnly: false }); }}
                      >
                        <Text style={styles.btnSecondaryText}>Mark Attendance</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedLecture.status === 'conducted' && (
                    <View style={styles.sheetActions}>
                      <TouchableOpacity
                        style={[styles.sheetBtn, styles.btnSecondary]}
                        onPress={() => { setSheetVisible(false); navigation.navigate('MarkAttendance', { lectureId: selectedLecture.id, viewOnly: true }); }}
                      >
                        <Text style={styles.btnSecondaryText}>View Attendance</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedLecture.status === 'cancelled' && (
                    <View style={styles.sheetActions}>
                      <TouchableOpacity
                        style={[styles.sheetBtn, styles.btnSecondary]}
                        onPress={() => { setSheetVisible(false); navigation.navigate('AddLecture', { reschedule: selectedLecture, batches }); }}
                      >
                        <Text style={styles.btnSecondaryText}>Reschedule</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterArea: { overflow: 'visible' },
  locationRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 100,
    overflow: 'visible',
  },
  locationDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 150,
  },
  locationDropdownText: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  locationDropdownArrow: { fontSize: 10, color: '#64748b', marginLeft: 6 },
  locationDropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 150,
    zIndex: 100,
  },
  locationDropdownItem: { paddingHorizontal: 16, paddingVertical: 10 },
  locationDropdownItemActive: { backgroundColor: '#e8eaf6' },
  locationDropdownItemText: { fontSize: 13, color: '#1e293b' },
  locationDropdownItemTextActive: { color: '#28388f', fontWeight: '700' },
  batchList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  batchChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  batchChipActive: { backgroundColor: '#28388f' },
  batchChipDisabled: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  batchChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  batchChipTextActive: { color: '#fff' },
  batchChipTextDisabled: { color: '#cbd5e1' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetSubject: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  sheetTopic: { fontSize: 13, color: '#64748b', marginBottom: 14 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sheetRowText: { fontSize: 13, color: '#475569' },
  sheetDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#28388f' },
  btnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  btnSecondary: { backgroundColor: '#f1f5f9' },
  btnSecondaryText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  btnDanger: { backgroundColor: '#fee2e2' },
  btnDangerText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
});
