
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Clock, Users, User, BookOpen } from 'lucide-react-native';
import WeeklyTimetable from '../../components/WeeklyTimetable';
import { apiRequest, getDecodedToken } from '../../services/api';
import { useUserSession } from '../../context/UserSessionContext';
import {useMemo} from 'react';

const BATCHES = [];
const LOCATIONS = ['Andheri', 'Dahisar', 'Goregaon', 'Kandivali'];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AdminTimetableScreen({ navigation }) {
  const [lectures, setLectures] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [adminLocation, setAdminLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));

  // const isBatchActive = (batchId) => {
  //   const batchLectures = lectures.filter(l => l.batch_id === batchId);
  //     if (batchLectures.length === 0) return false;
  //     return batchLectures.some(l => l.status === 'scheduled' || l.status === 'in_progress');
  //   };
    const isBatchActive = (batchId) => {
    if (loading) return true; // don't gray out while fetching
    const batchLectures = lectures.filter(l => l.batch_id === batchId);
    if (batchLectures.length === 0) return false;
    return batchLectures.some(l => l.status === 'scheduled' || l.status === 'in_progress');
  };
  React.useEffect(() => {
    getDecodedToken().then(decoded => {
      if (decoded?.location) setSelectedLocation(decoded.location);
    });
  }, []);

  React.useEffect(() => {
    apiRequest('/admin/lectures/batches')
      .then(data => setBatches(Array.isArray(data) ? data : []))
      .catch(err => console.log('Batches fetch failed:', err.message));
  }, []);




  const loadData = useCallback(async (ws = weekStart) => {
    setLoading(true);
    try {
      const from = ws.toISOString().split('T')[0];
      const toDate = new Date(ws);
      toDate.setDate(toDate.getDate() + 7);
      const to = toDate.toISOString().split('T')[0];
      
      const decoded = await getDecodedToken();
      setAdminLocation(decoded?.location);


      const lecturesData = await apiRequest(`/admin/lectures?from=${from}&to=${to}`)

      setLectures(Array.isArray(lecturesData) ? lecturesData : []);

    } catch (err) {
      Alert.alert('Unable to Load Timetable', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);


  React.useEffect(() => {
  const unsubscribe = navigation.addListener('focus', loadData);
  return unsubscribe;
}, [navigation, loadData]);


  React.useEffect(() => {
  if (adminLocation && !selectedLocation) {
    setSelectedLocation(adminLocation);
  }
}, [adminLocation]);

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
    loadData(d);
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
    loadData(d);
  };


const filteredLectures = lectures
  .filter(l => !selectedLocation || l.location === selectedLocation)
  .filter(l => !selectedBatchId || l.batch_id === selectedBatchId);

  const handleLecturePress = (lecture) => {
    setSelectedLecture(lecture);
    setSheetVisible(true);
  };

  const handleStartLecture = async () => {
    try {
      await apiRequest(`/admin/lectures/${selectedLecture.id}/start`, { method: 'PATCH' });
      setSheetVisible(false);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not start lecture.');
    }
  };

  const handleCompleteLecture = async () => {
    try {
      await apiRequest(`/admin/lectures/${selectedLecture.id}/complete`, { method: 'PATCH' });
      setSheetVisible(false);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not complete lecture.');
    }
  };

  const handleCancelLecture = () => {
    Alert.alert(
      'Cancel Lecture',
      'Are you sure you want to cancel this lecture? Students will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/admin/lectures/${selectedLecture.id}/cancel`, { method: 'PATCH' });
              setSheetVisible(false);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel lecture.');
            }
          },
        },
      ]
    );
  };

  const STATUS_STYLES = {
    scheduled:   { bg: '#e8eaf6', text: '#28388f', label: 'Scheduled' },
    in_progress: { bg: '#dcfce7', text: '#16a34a', label: 'Live' },
    conducted:   { bg: '#f1f5f9', text: '#94a3b8', label: 'Conducted' },
    cancelled:   { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);


const filterComponent = useMemo(() => (
  <View style={{ overflow: 'visible' }}>
    {/* Location dropdown row */}
    <View style={{ paddingHorizontal: 20, paddingTop: 10, zIndex: 100, overflow: 'visible' }}>
      <TouchableOpacity
        style={styles.locationDropdown}
        onPress={() => setLocationDropdownOpen(prev => !prev)}
      >
        <Text style={styles.locationDropdownText}>{selectedLocation || 'Select Location'}</Text>
        <Text style={styles.locationDropdownArrow}>{locationDropdownOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {locationDropdownOpen && (
        <View style={styles.locationDropdownMenu}>
          {LOCATIONS.map(loc => (
            <TouchableOpacity
              key={loc}
              style={[styles.locationDropdownItem, selectedLocation === loc && styles.locationDropdownItemActive]}
              onPress={() => {
                setSelectedLocation(loc);
                setSelectedBatchId(null);
                setLocationDropdownOpen(false);
              }}
            >
              <Text style={[styles.locationDropdownItemText, selectedLocation === loc && styles.locationDropdownItemTextActive]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
              onPress={() => active ? setSelectedBatchId(batch.id) : null}
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
          onPress={() => navigation.navigate('AddLecture')}
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
          onLecturePress={handleLecturePress}
          filterComponent={filterComponent}
          weekStart={weekStart}
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

            {selectedLecture && (() => {
              const statusStyle = STATUS_STYLES[selectedLecture.status] || STATUS_STYLES.scheduled;
              return (
                <>
                  <View style={styles.sheetTitleRow}>
                    <Text style={styles.sheetSubject}>{selectedLecture.subject}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  {selectedLecture.topic ? (
                    <Text style={styles.sheetTopic}>{selectedLecture.topic}</Text>
                  ) : null}

                  <View style={styles.sheetRow}>
                    <Clock size={15} color="#64748b" />
                    <Text style={styles.sheetRowText}>
                      {formatTime(selectedLecture.scheduled_at)} · {selectedLecture.duration_mins} min
                    </Text>
                  </View>

                  {selectedLecture.teacher_name ? (
                    <View style={styles.sheetRow}>
                      <User size={15} color="#64748b" />
                      <Text style={styles.sheetRowText}>{selectedLecture.teacher_name}</Text>
                    </View>
                  ) : null}

                  <View style={styles.sheetRow}>
                    <Users size={15} color="#64748b" />
                    <Text style={styles.sheetRowText}>{selectedLecture.batch_name}</Text>
                  </View>

                  <View style={styles.sheetDivider} />

                  {selectedLecture.status === 'scheduled' && (
                    <View style={styles.sheetActions}>
                      <TouchableOpacity style={[styles.sheetBtn, styles.btnPrimary]} onPress={handleStartLecture}>
                        <Text style={styles.btnPrimaryText}>Start Lecture</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sheetBtn, styles.btnSecondary]}
                        onPress={() => { setSheetVisible(false); navigation.navigate('EditLecture', { lecture: selectedLecture }); }}
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
                        onPress={() => { setSheetVisible(false); navigation.navigate('MarkAttendance', { lecture: selectedLecture }); }}
                      >
                        <Text style={styles.btnSecondaryText}>Mark Attendance</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedLecture.status === 'conducted' && (
                    <View style={styles.sheetActions}>
                      <TouchableOpacity
                        style={[styles.sheetBtn, styles.btnSecondary]}
                        onPress={() => { setSheetVisible(false); navigation.navigate('ViewAttendance', { lecture: selectedLecture }); }}
                      >
                        <Text style={styles.btnSecondaryText}>View Attendance</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedLecture.status === 'cancelled' && (
                    <View style={styles.sheetActions}>
                      <TouchableOpacity
                        style={[styles.sheetBtn, styles.btnSecondary]}
                        onPress={() => { setSheetVisible(false); navigation.navigate('AddLecture', { reschedule: selectedLecture }); }}
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  batchChipActive: {
    backgroundColor: '#28388f',
  },
  batchChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  batchChipTextActive: {
    color: '#fff',
  },
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
  sheetSubject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sheetTopic: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sheetRowText: {
    fontSize: 13,
    color: '#475569',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#28388f',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: '#f1f5f9',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  btnDanger: {
    backgroundColor: '#fee2e2',
  },
  btnDangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  batchChipDisabled: {
  backgroundColor: '#f8fafc',
  borderWidth: 1,
  borderColor: '#e2e8f0',
  },
  batchChipTextDisabled: {
    color: '#cbd5e1',
  },
  locationDropdown: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#f1f5f9',
  borderRadius: 20,
  paddingHorizontal: 14,
  paddingVertical: 6,
  minWidth: 130,
},
locationDropdownText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#1e293b',
},
locationDropdownArrow: {
  fontSize: 10,
  color: '#64748b',
  marginLeft: 6,
},
locationDropdownMenu: {
  position: 'absolute',
  top: 36,
  left: 0,
  backgroundColor: '#fff',
  borderRadius: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 5,
  minWidth: 150,
  zIndex: 100,
},
locationDropdownItem: {
  paddingHorizontal: 16,
  paddingVertical: 10,
},
locationDropdownItemActive: {
  backgroundColor: '#e8eaf6',
},
locationDropdownItemText: {
  fontSize: 13,
  color: '#1e293b',
},
locationDropdownItemTextActive: {
  color: '#28388f',
  fontWeight: '700',
},

});