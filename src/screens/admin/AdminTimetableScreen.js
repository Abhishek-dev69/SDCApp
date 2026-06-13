// import React, { useEffect, useState } from 'react';
// import { 
//   ActivityIndicator,
//   Alert,
//   View, 
//   Text, 
//   StyleSheet, 
//   FlatList, 
//   TouchableOpacity, 
//   Dimensions,
//   Image
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { 
//   ChevronLeft, 
//   Search, 
//   Plus, 
//   Users, 
//   UserCheck, 
//   BookOpen,
//   ChevronRight,
//   Clock,
//   Calendar
// } from 'lucide-react-native';
// import { apiRequest } from '../../services/api';

// const { width } = Dimensions.get('window');

// export default function AdminTimetableScreen({ navigation }) {
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [activeSegment, setActiveSegment] = useState('students'); // 'students' or 'teachers'
//   const [batches, setBatches] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [teachers, setTeachers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [detailLoading, setDetailLoading] = useState(false);

//   const loadBatches = async () => {
//     setLoading(true);
//     try {
//       const data = await apiRequest('/admin/batches');
//       setBatches(Array.isArray(data) ? data : []);
//     } catch (err) {
//       Alert.alert('Unable to Load Batches', err.message || 'Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadBatchPeople = async (batch) => {
//     setDetailLoading(true);
//     try {
//       const data = await apiRequest(`/admin/batches/${encodeURIComponent(batch.id)}/people`);
//       setStudents(data.students || []);
//       setTeachers(data.teachers || []);
//     } catch (err) {
//       Alert.alert('Unable to Load Batch Details', err.message || 'Please try again.');
//       setStudents([]);
//       setTeachers([]);
//     } finally {
//       setDetailLoading(false);
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = navigation.addListener('focus', loadBatches);
//     loadBatches();
//     return unsubscribe;
//   }, [navigation]);

//   useEffect(() => {
//     if (selectedBatch) {
//       loadBatchPeople(selectedBatch);
//     }
//   }, [selectedBatch]);

//   const handleCreateBatch = () => {
//     navigation.navigate('AddBatch');
//   };

//   const renderBatchItem = ({ item }) => (
//     <TouchableOpacity 
//       style={styles.batchCard}
//       onPress={() => setSelectedBatch(item)}
//     >
//       <View style={styles.batchInfo}>
//         <View style={styles.batchHeaderRow}>
//           <Text style={styles.batchName}>{item.name}</Text>
//           <View style={styles.classBadge}>
//             <Text style={styles.classBadgeText}>{item.stream || item.program}</Text>
//           </View>
//         </View>
        
//         <View style={styles.batchDetailRow}>
//           <View style={styles.batchDetailItem}>
//             <Clock size={14} color="#64748b" />
//             <Text style={styles.batchDetailText}>{item.timing || `${item.branch} • ${item.program}`}</Text>
//           </View>
//         </View>

//         <View style={styles.batchStatsRow}>
//           <View style={styles.statItem}>
//             <Users size={16} color="#3B82F6" />
//             <Text style={styles.statText}>{item.studentCount} Students</Text>
//           </View>
//           <View style={styles.statItem}>
//             <UserCheck size={16} color="#10B981" />
//             <Text style={styles.statText}>{item.teacherCount} Teachers</Text>
//           </View>
//         </View>
//       </View>
//       <ChevronRight size={20} color="#94a3b8" />
//     </TouchableOpacity>
//   );

//   const renderStudentItem = ({ item }) => (
//     <View style={styles.personCard}>
//       <View style={styles.personAvatar}>
//         <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
//       </View>
//         <View style={styles.personInfo}>
//           <Text style={styles.personName}>{item.name}</Text>
//         <Text style={styles.personSubtext}>Roll No: {item.rollNo || 'N/A'} • Batch: {item.batch}</Text>
//       </View>
//       <View style={[styles.statusBadge, item.status === 'Active' ? styles.presentBadge : styles.absentBadge]}>
//         <Text style={[styles.statusBadgeText, item.status === 'Active' ? styles.presentText : styles.absentText]}>{item.status}</Text>
//       </View>
//     </View>
//   );

//   const renderTeacherItem = ({ item }) => (
//     <View style={styles.personCard}>
//       <View style={[styles.personAvatar, { backgroundColor: '#E0E7FF' }]}>
//         <Text style={[styles.avatarText, { color: '#4338CA' }]}>{item.name.charAt(0)}</Text>
//       </View>
//       <View style={styles.personInfo}>
//         <Text style={styles.personName}>{item.name}</Text>
//         <Text style={styles.personSubtext}>{item.subject} • {item.experience}</Text>
//       </View>
//       <View style={[styles.statusBadge, item.status === 'On Duty' ? styles.presentBadge : styles.absentBadge]}>
//         <Text style={[styles.statusBadgeText, item.status === 'On Duty' ? styles.presentText : styles.absentText]}>{item.status}</Text>
//       </View>
//     </View>
//   );

//   if (selectedBatch) {
//     return (
//       <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => setSelectedBatch(null)} style={styles.backButton}>
//             <ChevronLeft size={24} color="#1e293b" />
//           </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <Text style={styles.headerTitle}>{selectedBatch.name}</Text>
//             <Text style={styles.headerSubtitle}>{selectedBatch.branch} • {selectedBatch.program}</Text>
//         </View>
//           <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate(activeSegment === 'students' ? 'AddStudent' : 'AddTeacher')}>
//             <Plus size={24} color="#1e293b" />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.segmentContainer}>
//           <TouchableOpacity 
//             style={[styles.segmentButton, activeSegment === 'students' && styles.activeSegment]}
//             onPress={() => setActiveSegment('students')}
//           >
//             <Text style={[styles.segmentText, activeSegment === 'students' && styles.activeSegmentText]}>Students</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={[styles.segmentButton, activeSegment === 'teachers' && styles.activeSegment]}
//             onPress={() => setActiveSegment('teachers')}
//           >
//             <Text style={[styles.segmentText, activeSegment === 'teachers' && styles.activeSegmentText]}>Teachers</Text>
//           </TouchableOpacity>
//         </View>

//         {detailLoading ? (
//           <View style={styles.centerState}>
//             <ActivityIndicator color="#28388f" />
//           </View>
//         ) : (
//           <FlatList
//             data={activeSegment === 'students' ? students : teachers}
//             keyExtractor={item => item.id}
//             renderItem={activeSegment === 'students' ? renderStudentItem : renderTeacherItem}
//             contentContainerStyle={styles.listContent}
//             showsVerticalScrollIndicator={false}
//             ListEmptyComponent={<Text style={styles.emptyText}>No {activeSegment} assigned yet.</Text>}
//           />
//         )}
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
//       <View style={styles.header}>
//         <Text style={styles.mainTitle}>Batches</Text>
//         <View style={styles.headerActions}>
//           <TouchableOpacity style={styles.actionButton}>
//             <Search size={24} color="#1e293b" />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.actionButton} onPress={handleCreateBatch}>
//             <Plus size={24} color="#1e293b" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {loading ? (
//         <View style={styles.centerState}>
//           <ActivityIndicator color="#28388f" />
//         </View>
//       ) : (
//         <FlatList
//           data={batches}
//           keyExtractor={item => item.id}
//           renderItem={renderBatchItem}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//           ListEmptyComponent={<Text style={styles.emptyText}>No batches found. Create your first batch.</Text>}
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#f1f5f9',
//   },
//   mainTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   headerActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   actionButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f1f5f9',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerTitleContainer: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: '#64748b',
//     marginTop: 2,
//   },
//   listContent: {
//     padding: 20,
//     paddingBottom: 100,
//   },
//   batchCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 20,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.05,
//     shadowRadius: 10,
//     elevation: 3,
//   },
//   batchInfo: {
//     flex: 1,
//   },
//   batchHeaderRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     marginBottom: 8,
//   },
//   batchName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   classBadge: {
//     backgroundColor: '#f1f5f9',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   classBadgeText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#64748b',
//   },
//   batchDetailRow: {
//     marginBottom: 16,
//   },
//   batchDetailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   batchDetailText: {
//     fontSize: 14,
//     color: '#64748b',
//   },
//   batchStatsRow: {
//     flexDirection: 'row',
//     gap: 20,
//   },
//   statItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   statText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1e293b',
//   },
//   segmentContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#f1f5f9',
//     marginHorizontal: 20,
//     marginTop: 20,
//     borderRadius: 12,
//     padding: 4,
//   },
//   segmentButton: {
//     flex: 1,
//     paddingVertical: 10,
//     alignItems: 'center',
//     borderRadius: 8,
//   },
//   activeSegment: {
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   segmentText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#64748b',
//   },
//   activeSegmentText: {
//     color: '#28388f',
//   },
//   personCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 5,
//     elevation: 2,
//   },
//   personAvatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#f1f5f9',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   avatarText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#64748b',
//   },
//   personInfo: {
//     flex: 1,
//   },
//   personName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1e293b',
//   },
//   personSubtext: {
//     fontSize: 12,
//     color: '#64748b',
//     marginTop: 2,
//   },
//   statusBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 20,
//   },
//   statusBadgeText: {
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   presentBadge: {
//     backgroundColor: '#dcfce7',
//   },
//   presentText: {
//     color: '#16a34a',
//   },
//   absentBadge: {
//     backgroundColor: '#fee2e2',
//   },
//   absentText: {
//     color: '#dc2626',
//   },
//   centerState: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 32,
//   },
//   emptyText: {
//     textAlign: 'center',
//     color: '#64748b',
//     paddingVertical: 40,
//     fontSize: 14,
//   },
// });



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
import { apiRequest } from '../../services/api';

const BATCHES = [];

export default function AdminTimetableScreen({ navigation }) {
  const [lectures, setLectures] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lecturesData, batchesData] = await Promise.all([
        apiRequest('/admin/lectures'),
        apiRequest('/admin/batches'),
      ]);
      setLectures(Array.isArray(lecturesData) ? lecturesData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
    } catch (err) {
      Alert.alert('Unable to Load Timetable', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    loadData();
    return unsubscribe;
  }, [navigation, loadData]);

  const filteredLectures = selectedBatchId
    ? lectures.filter(l => l.batch_id === selectedBatchId)
    : lectures;

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

  const filterComponent = (
    <>
      <TouchableOpacity
        style={[styles.batchChip, selectedBatchId === null && styles.batchChipActive]}
        onPress={() => setSelectedBatchId(null)}
      >
        <Text style={[styles.batchChipText, selectedBatchId === null && styles.batchChipTextActive]}>
          All Batches
        </Text>
      </TouchableOpacity>
      {batches.map(batch => (
        <TouchableOpacity
          key={batch.id}
          style={[styles.batchChip, selectedBatchId === batch.id && styles.batchChipActive]}
          onPress={() => setSelectedBatchId(batch.id)}
        >
          <Text style={[styles.batchChipText, selectedBatchId === batch.id && styles.batchChipTextActive]}>
            {batch.name}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );

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
});