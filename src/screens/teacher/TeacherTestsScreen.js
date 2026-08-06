import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Plus,
  Award,
  Calendar,
  BookOpen,
  CheckCircle,
  FileText,
  UserCheck,
  Save,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

export default function TeacherTestsScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Test Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [totalMarks, setTotalMarks] = useState('100');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [creating, setCreating] = useState(false);

  // Enter Marks Modal State
  const [marksModalVisible, setMarksModalVisible] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [submittingMarks, setSubmittingMarks] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [testsData, batchesData] = await Promise.all([
        apiRequest('/tests').catch(() => []),
        apiRequest('/batches').catch(() => []),
      ]);

      setTests(Array.isArray(testsData) ? testsData : testsData.tests || []);
      const batchList = Array.isArray(batchesData) ? batchesData : batchesData.batches || [];
      setBatches(batchList);
      if (batchList.length > 0) setSelectedBatchId(batchList[0].id);
    } catch (err) {
      console.log('Error fetching tests data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateTest = async () => {
    if (!title.trim() || !totalMarks.trim() || !selectedBatchId) {
      Alert.alert('Validation Error', 'Please fill in Title, Total Marks, and select a Batch.');
      return;
    }

    try {
      setCreating(true);
      await apiRequest('/tests', {
        method: 'POST',
        body: {
          title: title.trim(),
          subject,
          totalMarks: parseInt(totalMarks, 10),
          batchIds: [selectedBatchId],
          questionGcsPath: `tests/questions/${Date.now()}-paper.pdf`,
        },
      });

      Alert.alert('Success', 'Test created successfully!');
      setCreateModalVisible(false);
      setTitle('');
      fetchInitialData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create test');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenMarksModal = async (test) => {
    setSelectedTest(test);
    setMarksModalVisible(true);

    try {
      // Fetch students for test grading
      const studentData = await apiRequest('/admin/students').catch(() => []);
      const allStudents = Array.isArray(studentData) ? studentData : studentData.students || [];
      setStudents(allStudents.slice(0, 10)); // Top batch students list

      // Initialize marks map
      const initialMap = {};
      allStudents.forEach((s) => {
        initialMap[s.sdc_id || s.id] = '';
      });
      setMarksMap(initialMap);
    } catch (err) {
      console.log('Error loading students for grading:', err);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedTest) return;

    const submissions = Object.entries(marksMap)
      .filter(([_, score]) => score !== '')
      .map(([studentSdcId, score]) => ({
        studentSdcId,
        marksObtained: parseFloat(score),
      }));

    if (submissions.length === 0) {
      Alert.alert('Info', 'Please enter score for at least one student.');
      return;
    }

    try {
      setSubmittingMarks(true);
      await apiRequest(`/tests/${selectedTest.id}/marks`, {
        method: 'POST',
        body: { submissions },
      });

      Alert.alert('Success', 'Student marks submitted successfully!');
      setMarksModalVisible(false);
      setSelectedTest(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit marks');
    } finally {
      setSubmittingMarks(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Test & Marks Manager</Text>
            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              style={styles.addTestHeaderBtn}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Tests List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInitialData(); }} colors={['#7C3AED']} />}
      >
        <TouchableOpacity style={styles.createBanner} onPress={() => setCreateModalVisible(true)}>
          <View style={styles.createBannerIcon}>
            <Award size={24} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createBannerTitle}>Schedule New Batch Test</Text>
            <Text style={styles.createBannerSub}>Create test paper & manage student scores</Text>
          </View>
          <Plus size={20} color="#7C3AED" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>All Conducted & Active Tests</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={{ marginVertical: 30 }} />
        ) : tests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Award size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Tests Created Yet</Text>
            <Text style={styles.emptySub}>Tap '+ Schedule New Batch Test' to create your first test.</Text>
          </View>
        ) : (
          tests.map((item) => (
            <View key={item.id} style={styles.testCard}>
              <View style={styles.testCardHeader}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>{item.subject || 'Physics'}</Text>
                </View>
                <Text style={styles.marksText}>{item.total_marks || item.totalMarks || 100} Marks</Text>
              </View>

              <Text style={styles.testTitle}>{item.title}</Text>

              <View style={styles.testMetaRow}>
                <View style={styles.metaItem}>
                  <BookOpen size={14} color="#64748B" />
                  <Text style={styles.metaText}>Status: {item.status || 'Active'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar size={14} color="#64748B" />
                  <Text style={styles.metaText}>
                    {new Date(item.created_at || Date.now()).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.gradeBtn}
                onPress={() => handleOpenMarksModal(item)}
              >
                <UserCheck size={16} color="#fff" />
                <Text style={styles.gradeBtnText}>Enter Student Marks</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Test Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule New Batch Test</Text>

            <Text style={styles.inputLabel}>Test Title / Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Unit Test 2 - Electrostatics"
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Subject:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Subject"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Total Marks:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Total Marks"
                  keyboardType="numeric"
                  value={totalMarks}
                  onChangeText={setTotalMarks}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Select Batch:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.batchSelector}>
              {batches.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.batchChip, selectedBatchId === b.id && styles.batchChipActive]}
                  onPress={() => setSelectedBatchId(b.id)}
                >
                  <Text style={[styles.batchChipText, selectedBatchId === b.id && styles.batchChipTextActive]}>
                    {b.name || b.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
                disabled={creating}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateTest}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Test</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enter Marks Modal */}
      {selectedTest && (
        <Modal visible={marksModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <Text style={styles.modalTitle}>Grade: {selectedTest.title}</Text>
              <Text style={styles.modalSubTitle}>Total Marks: {selectedTest.total_marks || selectedTest.totalMarks || 100}</Text>

              <FlatList
                data={students}
                keyExtractor={(item) => item.sdc_id || item.id}
                style={{ marginVertical: 12 }}
                renderItem={({ item }) => (
                  <View style={styles.studentGradeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{item.student_name || item.name || 'Student'}</Text>
                      <Text style={styles.studentRoll}>SDC ID: {item.sdc_id || item.id}</Text>
                    </View>

                    <TextInput
                      style={styles.scoreInput}
                      placeholder="Marks"
                      keyboardType="numeric"
                      value={marksMap[item.sdc_id || item.id] || ''}
                      onChangeText={(val) =>
                        setMarksMap((prev) => ({ ...prev, [item.sdc_id || item.id]: val }))
                      }
                    />
                  </View>
                )}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setMarksModalVisible(false); setSelectedTest(null); }}
                  disabled={submittingMarks}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSaveMarks}
                  disabled={submittingMarks}
                >
                  {submittingMarks ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Save size={16} color="#fff" />
                      <Text style={styles.submitBtnText}>Save Marks</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 16,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTestHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  createBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 12,
    marginBottom: 20,
  },
  createBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5B21B6',
  },
  createBannerSub: {
    fontSize: 12,
    color: '#7E22CE',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectBadgeText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
  },
  marksText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  testMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  gradeBtn: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  gradeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  batchSelector: {
    marginVertical: 8,
  },
  batchChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  batchChipActive: {
    backgroundColor: '#7C3AED',
  },
  batchChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  batchChipTextActive: {
    color: '#FFFFFF',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentGradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  studentRoll: {
    fontSize: 11,
    color: '#94A3B8',
  },
  scoreInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 80,
    textAlign: 'center',
    fontWeight: '700',
    color: '#1E293B',
  },
});
