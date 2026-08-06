import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, PlusCircle, CheckSquare, Square, RefreshCw } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

export default function TeacherRemarksScreen({ navigation }) {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedStudentAuthId, setSelectedStudentAuthId] = useState(null);
  const [category, setCategory] = useState('General');
  const [remarkText, setRemarkText] = useState('');
  
  // Visibility checkboxes
  const [visibleToStudent, setVisibleToStudent] = useState(true);
  const [visibleToParent, setVisibleToParent] = useState(true);

  // Dropdown open states (simple inline selectors)
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const categories = ['General', 'Lecture Missed', 'Test Scored', 'Discipline', 'Homework Pending'];

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [batchesRes, remarksRes] = await Promise.all([
        apiRequest('/operations/teacher/batches').catch(() => []),
        apiRequest('/operations/remarks').catch(() => [])
      ]);
      setBatches(batchesRes);
      setRemarks(remarksRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadInitialData);
    loadInitialData();
    return unsubscribe;
  }, [navigation]);

  const selectBatch = async (batch) => {
    setSelectedBatchId(batch.id);
    setSelectedStudentAuthId(null);
    setShowBatchDropdown(false);
    
    // Fetch students in this batch
    try {
      const studentsRes = await apiRequest(`/operations/teacher/batches/${batch.id}/students`);
      setStudents(studentsRes);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch students in this batch');
    }
  };

  const handlePostRemark = async () => {
    if (!selectedStudentAuthId) {
      Alert.alert('Error', 'Please select a student.');
      return;
    }
    if (!remarkText.trim()) {
      Alert.alert('Error', 'Please write a remark.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/operations/remarks', {
        method: 'POST',
        body: {
          student_auth_id: selectedStudentAuthId,
          category,
          remark_text: remarkText.trim(),
          visible_to_student: visibleToStudent,
          visible_to_parent: visibleToParent,
          visible_to_admin: true
        }
      });
      
      Alert.alert('Success', 'Teacher remark logged successfully!');
      setRemarkText('');
      Keyboard.dismiss();
      
      // Reload remarks
      const remarksRes = await apiRequest('/operations/remarks').catch(() => []);
      setRemarks(remarksRes);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit remark.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRemarkItem = ({ item }) => {
    const dateStr = new Date(item.created_at || item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.remarkCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentLabel}>{item.student_name || 'Student'}</Text>
          <Text style={styles.dateLabel}>{dateStr}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          <View style={styles.visibilityBadge}>
            <Text style={styles.visibilityText}>
              Visible to: {item.visible_to_student ? 'Student ' : ''}{item.visible_to_parent ? 'Parent' : ''}
            </Text>
          </View>
        </View>
        <Text style={styles.remarkBody}>{item.remark_text}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28388F" />
      </View>
    );
  }

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const selectedStudent = students.find(s => s.auth_id === selectedStudentAuthId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Remarks Manager</Text>
        <TouchableOpacity onPress={loadInitialData} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#28388F" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={remarks}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRemarkItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Log New Remark</Text>

            {/* Batch Select */}
            <Text style={styles.fieldLabel}>Select Batch</Text>
            <TouchableOpacity 
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowBatchDropdown(!showBatchDropdown);
                setShowStudentDropdown(false);
                setShowCategoryDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>
                {selectedBatch ? selectedBatch.name : 'Choose a Batch'}
              </Text>
            </TouchableOpacity>
            {showBatchDropdown && (
              <View style={styles.dropdownMenu}>
                {batches.map(b => (
                  <TouchableOpacity key={b.id} style={styles.menuItem} onPress={() => selectBatch(b)}>
                    <Text style={styles.menuItemText}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Student Select */}
            {selectedBatchId && (
              <>
                <Text style={styles.fieldLabel}>Select Student</Text>
                <TouchableOpacity 
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    setShowStudentDropdown(!showStudentDropdown);
                    setShowBatchDropdown(false);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {selectedStudent ? selectedStudent.name : 'Choose a Student'}
                  </Text>
                </TouchableOpacity>
                {showStudentDropdown && (
                  <View style={styles.dropdownMenu}>
                    {students.map(s => (
                      <TouchableOpacity 
                        key={s.auth_id} 
                        style={styles.menuItem} 
                        onPress={() => {
                          setSelectedStudentAuthId(s.auth_id);
                          setShowStudentDropdown(false);
                        }}
                      >
                        <Text style={styles.menuItemText}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Category Select */}
            <Text style={styles.fieldLabel}>Category</Text>
            <TouchableOpacity 
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowBatchDropdown(false);
                setShowStudentDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>{category}</Text>
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={styles.dropdownMenu}>
                {categories.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={styles.menuItem} 
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={styles.menuItemText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Remark Text */}
            <Text style={styles.fieldLabel}>Remark / Feedback Comments</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter remarks details..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={remarkText}
              onChangeText={setRemarkText}
            />

            {/* Visibility Settings */}
            <Text style={styles.fieldLabel}>Visibility</Text>
            <View style={styles.visibilityRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setVisibleToStudent(!visibleToStudent)}
              >
                {visibleToStudent ? (
                  <CheckSquare size={20} color="#28388F" />
                ) : (
                  <Square size={20} color="#94A3B8" />
                )}
                <Text style={styles.checkboxLabel}>Student</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setVisibleToParent(!visibleToParent)}
              >
                {visibleToParent ? (
                  <CheckSquare size={20} color="#28388F" />
                ) : (
                  <Square size={20} color="#94A3B8" />
                )}
                <Text style={styles.checkboxLabel}>Parent</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handlePostRemark}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <PlusCircle size={20} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Post Student Remark</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Previous Remarks Feed</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>No remarks logged yet by you.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  dropdownTrigger: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  dropdownText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    color: '#0F172A',
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#28388F',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  remarkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  dateLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#EEEFFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#28388F',
    fontSize: 11,
    fontWeight: '800',
  },
  visibilityBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  visibilityText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  remarkBody: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
});
