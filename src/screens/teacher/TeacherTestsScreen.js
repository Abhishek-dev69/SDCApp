import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import {
  ClipboardList, Plus, X, Clock, CheckCircle2, Send, FileText, Pencil, Award, Eye,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

// Same subject palette used across the app (student TestsScreen, AddLectureScreen).
const SUBJECT_COLORS = {
  Physics: '#28388f',
  Chemistry: '#10B981',
  Mathematics: '#F59E0B',
  Biology: '#EF4444',
};
const FILTERS = ['All', 'Draft', 'Published'];

export default function TeacherTestsScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [publishingId, setPublishingId] = useState(null);

  // Grading modal — a single top-level Modal (safe: this screen is not itself
  // wrapped in another Modal, unlike the old in-page create form was).
  const [gradingTest, setGradingTest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [drafts, setDrafts] = useState({}); // submissionId -> { score, remarks }
  const [savingSubmissionId, setSavingSubmissionId] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [viewingSubmissionId, setViewingSubmissionId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/tests').catch(() => []);
      setTests(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    loadData();
    return unsubscribe;
  }, [navigation]);

  const visibleTests = useMemo(() => {
    if (activeFilter === 'Draft') return tests.filter((t) => t.status === 'draft');
    if (activeFilter === 'Published') return tests.filter((t) => t.status === 'published');
    return tests;
  }, [tests, activeFilter]);

  const counts = useMemo(() => ({
    draft: tests.filter((t) => t.status === 'draft').length,
    published: tests.filter((t) => t.status === 'published').length,
  }), [tests]);

  const formatDue = (iso) => {
    if (!iso) return 'No due date';
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const handlePublish = async (test) => {
    setPublishingId(test.id);
    try {
      await apiRequest(`/tests/${test.id}/publish`, { method: 'PATCH' });
      loadData();
    } catch (err) {
      console.error('publish error', err.message);
      Alert.alert('Could not publish', err.message || 'Please try again.');
    } finally {
      setPublishingId(null);
    }
  };

  // ---- Grading modal ----
  const openGrading = useCallback(async (test) => {
    setGradingTest(test);
    setGradingLoading(true);
    setDrafts({});
    try {
      const data = await apiRequest(`/tests/${test.id}/submissions`);
      const list = Array.isArray(data) ? data : [];
      setSubmissions(list);
      const initialDrafts = {};
      list.forEach((s) => {
        if (s.submission_id) {
          initialDrafts[s.submission_id] = {
            score: s.score != null ? String(s.score) : '',
            remarks: s.remarks || '',
          };
        }
      });
      setDrafts(initialDrafts);
    } catch (err) {
      console.error('load submissions error', err.message);
      Alert.alert('Could not load submissions', err.message || 'Please try again.');
    } finally {
      setGradingLoading(false);
    }
  }, []);

  const closeGrading = () => {
    setGradingTest(null);
    setSubmissions([]);
    setDrafts({});
  };

  const handleSaveGrade = async (submissionId) => {
    const draft = drafts[submissionId];
    if (!draft) return;
    setSavingSubmissionId(submissionId);
    try {
      await apiRequest(`/tests/submissions/${submissionId}`, {
        method: 'PATCH',
        body: {
          score: draft.score !== '' ? Number(draft.score) : undefined,
          remarks: draft.remarks || undefined,
        },
      });
      setSubmissions((prev) => prev.map((s) => (
        s.submission_id === submissionId
          ? { ...s, score: draft.score !== '' ? Number(draft.score) : s.score, remarks: draft.remarks }
          : s
      )));
    } catch (err) {
      console.error('grade save error', err.message);
      Alert.alert('Could not save grade', err.message || 'Please try again.');
    } finally {
      setSavingSubmissionId(null);
    }
  };

  // Fetch a fresh signed read URL for a submission's answer sheet and open it
  // in the device browser/PDF viewer — teachers shouldn't have to grade blind.
  const handleViewAnswer = async (submissionId) => {
    setViewingSubmissionId(submissionId);
    try {
      const res = await apiRequest(`/tests/submissions/${submissionId}/answer-url`);
      if (res?.url) {
        await WebBrowser.openBrowserAsync(res.url);
      } else {
        Alert.alert('Unavailable', 'No answer sheet URL was returned.');
      }
    } catch (err) {
      console.error('view answer error', err.message);
      Alert.alert('Could not open answer sheet', err.message || 'Please try again.');
    } finally {
      setViewingSubmissionId(null);
    }
  };

  const handleReleaseGrades = async () => {
    if (!gradingTest) return;
    setReleasing(true);
    try {
      const res = await apiRequest(`/tests/${gradingTest.id}/release`, { method: 'POST' });
      Alert.alert('Released', `${res?.releasedCount ?? 0} graded submission(s) are now visible to students.`);
      openGrading(gradingTest);
      loadData();
    } catch (err) {
      console.error('release error', err.message);
      Alert.alert('Could not release grades', err.message || 'Please try again.');
    } finally {
      setReleasing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={['#2446A7', '#2F66F4']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.kicker}>Manage</Text>
              <Text style={styles.headerTitle}>Tests &amp; Assignments</Text>
            </View>
            <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('TeacherTestForm')}>
              <Plus size={20} color="#2446A7" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{counts.draft}</Text>
              <Text style={styles.statLabel}>Draft</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{counts.published}</Text>
              <Text style={styles.statLabel}>Published</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Filter chips */}
      <View style={styles.filterWrap}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#2446A7" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {visibleTests.length === 0 ? (
            <View style={styles.emptyCard}>
              <ClipboardList size={24} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No tests here yet</Text>
              <Text style={styles.emptyText}>Tap the + button to create your first test or assignment.</Text>
            </View>
          ) : (
            visibleTests.map((test) => {
              const color = SUBJECT_COLORS[test.subject] || '#2446A7';
              const isDraft = test.status !== 'published';
              return (
                <View key={test.id} style={styles.testCard}>
                  <View style={styles.testCardHeader}>
                    <View style={[styles.testIcon, { backgroundColor: `${color}16` }]}>
                      <FileText size={20} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testTitle}>{test.title}</Text>
                      <Text style={[styles.testSubject, { color }]}>
                        {test.subject || 'General'} · {test.type === 'assignment' ? 'Assignment' : 'Test'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, isDraft ? styles.statusDraft : styles.statusPublished]}>
                      <Text style={[styles.statusBadgeText, isDraft ? styles.statusDraftText : styles.statusPublishedText]}>
                        {isDraft ? 'Draft' : 'Published'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.testMetaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={13} color="#64748B" />
                      <Text style={styles.metaText}>{formatDue(test.due_at)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <ClipboardList size={13} color="#64748B" />
                      <Text style={styles.metaText}>
                        {test.total_marks != null ? `${test.total_marks} marks` : 'Marks TBD'}
                      </Text>
                    </View>
                  </View>

                  {isDraft ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.secondaryActionBtn}
                        onPress={() => navigation.navigate('TeacherTestForm', { test })}
                      >
                        <Pencil size={14} color="#2446A7" />
                        <Text style={styles.secondaryActionBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { flex: 1 }]}
                        onPress={() => handlePublish(test)}
                        disabled={publishingId === test.id}
                      >
                        {publishingId === test.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Send size={14} color="#fff" />
                            <Text style={styles.primaryActionBtnText}>Publish to Batch</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <View style={styles.publishedRow}>
                        <CheckCircle2 size={14} color="#10B981" />
                        <Text style={styles.publishedText}>Visible to students</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { flex: 1 }]}
                        onPress={() => openGrading(test)}
                      >
                        <Award size={14} color="#fff" />
                        <Text style={styles.primaryActionBtnText}>Grade &amp; Release</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Grading & release modal */}
      <Modal visible={!!gradingTest} transparent animationType="slide" onRequestClose={closeGrading}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{gradingTest?.title}</Text>
              <TouchableOpacity onPress={closeGrading}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {gradingLoading ? (
              <ActivityIndicator color="#2446A7" style={{ marginVertical: 24 }} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.releaseBtn, releasing && styles.disabledOpacity]}
                  onPress={handleReleaseGrades}
                  disabled={releasing}
                >
                  {releasing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Send size={14} color="#fff" />
                      <Text style={styles.releaseBtnText}>Release Graded Scores to Students</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={styles.hint}>
                  Saving a score below only stores it — students won't see it until you release. Releasing
                  sends every graded-but-unreleased score for this test at once.
                </Text>

                <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
                  {submissions.length === 0 ? (
                    <Text style={styles.hint}>No students in the assigned batch(es) yet.</Text>
                  ) : (
                    submissions.map((s) => {
                      const submitted = !!s.submission_id;
                      const draft = drafts[s.submission_id] || { score: '', remarks: '' };
                      const released = !!s.released_at;
                      return (
                        <View key={s.student_sdc_id} style={styles.submissionRow}>
                          <View style={styles.submissionHeader}>
                            <Text style={styles.submissionName}>{s.student_name}</Text>
                            {released ? (
                              <View style={[styles.statusBadge, styles.statusPublished]}>
                                <Text style={[styles.statusBadgeText, styles.statusPublishedText]}>Released</Text>
                              </View>
                            ) : submitted ? (
                              <View style={[styles.statusBadge, styles.statusDraft]}>
                                <Text style={[styles.statusBadgeText, styles.statusDraftText]}>Submitted</Text>
                              </View>
                            ) : (
                              <View style={styles.statusBadgeMuted}>
                                <Text style={styles.statusBadgeMutedText}>Not submitted</Text>
                              </View>
                            )}
                          </View>

                          {submitted ? (
                            <>
                              <TouchableOpacity
                                style={styles.viewAnswerBtn}
                                onPress={() => handleViewAnswer(s.submission_id)}
                                disabled={viewingSubmissionId === s.submission_id}
                              >
                                {viewingSubmissionId === s.submission_id ? (
                                  <ActivityIndicator color="#2446A7" size="small" />
                                ) : (
                                  <>
                                    <Eye size={14} color="#2446A7" />
                                    <Text style={styles.viewAnswerBtnText}>View Answer Sheet</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            <View style={styles.gradeRow}>
                              <TextInput
                                style={styles.gradeInput}
                                placeholder="Score"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={draft.score}
                                onChangeText={(v) => setDrafts((prev) => ({
                                  ...prev,
                                  [s.submission_id]: { ...prev[s.submission_id], score: v.replace(/[^0-9]/g, '') },
                                }))}
                              />
                              <TextInput
                                style={[styles.gradeInput, { flex: 1 }]}
                                placeholder="Remarks (optional)"
                                placeholderTextColor="#94A3B8"
                                value={draft.remarks}
                                onChangeText={(v) => setDrafts((prev) => ({
                                  ...prev,
                                  [s.submission_id]: { ...prev[s.submission_id], remarks: v },
                                }))}
                              />
                              <TouchableOpacity
                                style={styles.saveGradeBtn}
                                onPress={() => handleSaveGrade(s.submission_id)}
                                disabled={savingSubmissionId === s.submission_id}
                              >
                                {savingSubmissionId === s.submission_id ? (
                                  <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                  <Text style={styles.saveGradeBtnText}>Save</Text>
                                )}
                              </TouchableOpacity>
                            </View>
                            </>
                          ) : (
                            <Text style={styles.hint}>Waiting for this student to submit.</Text>
                          )}
                        </View>
                      );
                    })
                  )}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    minHeight: 190,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerGradient: { ...StyleSheet.absoluteFillObject },
  headerSafeArea: { paddingHorizontal: 24, paddingBottom: 22 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
  },
  kicker: { color: 'rgba(255,255,255,0.78)', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6, maxWidth: 240 },
  newBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  statPill: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8,
  },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  filterWrap: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 24, marginTop: 18, marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: '#28388F' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  filterTextActive: { color: '#fff' },
  loadingState: { paddingTop: 80 },
  content: { padding: 24, paddingTop: 12 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 28,
    alignItems: 'center', marginTop: 20,
  },
  emptyTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptyText: { color: '#64748B', marginTop: 5, textAlign: 'center', fontSize: 13 },
  testCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  testCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  testIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  testTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  testSubject: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusDraft: { backgroundColor: '#FEF3C7' },
  statusPublished: { backgroundColor: '#DCFCE7' },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusDraftText: { color: '#B45309' },
  statusPublishedText: { color: '#15803D' },
  statusBadgeMuted: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#F1F5F9' },
  statusBadgeMutedText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  testMetaRow: {
    flexDirection: 'row', gap: 16, marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#64748B' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  primaryActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2446A7', borderRadius: 12, paddingVertical: 11,
  },
  primaryActionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  secondaryActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE',
  },
  secondaryActionBtnText: { color: '#2446A7', fontSize: 13, fontWeight: '700' },
  publishedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  publishedText: { fontSize: 12, fontWeight: '600', color: '#15803D' },
  disabledOpacity: { opacity: 0.5 },

  // Grading modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', flex: 1 },
  hint: { fontSize: 11, color: '#94A3B8', lineHeight: 16, marginTop: 8 },
  releaseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 12,
  },
  releaseBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  submissionRow: {
    backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 10,
  },
  submissionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  submissionName: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
  viewAnswerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE',
  },
  viewAnswerBtnText: { color: '#2446A7', fontSize: 12, fontWeight: '700' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  gradeInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: '#1e293b', width: 70,
  },
  saveGradeBtn: {
    backgroundColor: '#2446A7', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  saveGradeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
