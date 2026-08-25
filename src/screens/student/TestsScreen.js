import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as WebBrowser from 'expo-web-browser';
import { useUserSession } from '../../context/UserSessionContext';
import { apiRequest } from '../../services/api';
import {
  ClipboardCheck,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Award,
  Upload,
  RefreshCw,
  X,
  Eye,
} from 'lucide-react-native';

const SUBJECT_COLORS = {
  Physics: '#28388f',
  Chemistry: '#10B981',
  Mathematics: '#F59E0B',
  Biology: '#EF4444',
};

const TABS = ['Pending', 'Submitted', 'Graded'];

export default function TestsScreen() {
  const { userProfile } = useUserSession();
  const [activeTab, setActiveTab] = useState('Pending');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Submit-answer modal state
  const [submitTarget, setSubmitTarget] = useState(null); // the test being submitted
  const [answerFileName, setAnswerFileName] = useState('');
  const [answerGcsPath, setAnswerGcsPath] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);

  // Submission detail modal state
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewingQuestionId, setViewingQuestionId] = useState(null);
  const [viewingAnswer, setViewingAnswer] = useState(false);

  useEffect(() => {
    fetchTests();
  }, [userProfile?.batch_id]);

  const fetchTests = async () => {
    if (!userProfile?.batch_id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiRequest(`/tests?batchId=${userProfile.batch_id}`);
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tests', err.message);
      setErrorMsg('Unable to load tests right now.');
    } finally {
      setLoading(false);
    }
  };

  const categorized = useMemo(() => {
    const pending = [];
    const submitted = [];
    const graded = [];
    tests.forEach((t) => {
      if (t.released_at) graded.push(t);
      else if (t.submitted_at) submitted.push(t);
      else pending.push(t);
    });
    const byDue = (a, b) => new Date(a.due_at || 0) - new Date(b.due_at || 0);
    return {
      Pending: pending.sort(byDue),
      Submitted: submitted.sort(byDue),
      Graded: graded.sort(byDue),
    };
  }, [tests]);

  const visibleItems = categorized[activeTab] || [];

  const counts = {
    Pending: categorized.Pending.length,
    Submitted: categorized.Submitted.length,
    Graded: categorized.Graded.length,
  };

  const formatDue = (iso) => {
    if (!iso) return 'No due date';
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatShortDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const isPastDue = (test) => !!test.due_at && new Date(test.due_at) < new Date();

  // ---- Submit answer flow: real device file → signed GCS URL → record submission ----
  // Same 3-step pattern used for the teacher's question-paper upload:
  // 1) ask the backend for a signed write URL (POST /tests/:id/submissions/upload-url)
  // 2) PUT the actual file bytes straight to that URL (GCS, not our server)
  // 3) save the returned gcsPath on the submission (POST /tests/:id/submissions)
  const openSubmitModal = (test) => {
    setSubmitTarget(test);
    setAnswerFileName('');
    setAnswerGcsPath('');
  };

  const closeSubmitModal = () => {
    if (submitBusy || uploadingFile) return;
    setSubmitTarget(null);
  };

  const handleBrowseFile = async () => {
    if (!submitTarget) return;
    let picked;
    try {
      picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
    } catch (err) {
      console.error('document picker error', err.message);
      Alert.alert('Could not open file browser', err.message || 'Please try again.');
      return;
    }

    if (picked.canceled || !picked.assets?.length) return;
    const asset = picked.assets[0];
    const contentType = asset.mimeType || 'application/pdf';

    setUploadingFile(true);
    try {
      const { uploadUrl, gcsPath } = await apiRequest(`/tests/${submitTarget.id}/submissions/upload-url`, {
        method: 'POST',
        body: { filename: asset.name, contentType },
      });

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': contentType },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload to storage failed (status ${uploadResult.status})`);
      }

      setAnswerFileName(asset.name);
      setAnswerGcsPath(gcsPath || '');
    } catch (err) {
      console.error('file upload error', err.message);
      Alert.alert('Upload failed', err.message || 'Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleChangeFile = () => {
    setAnswerFileName('');
    setAnswerGcsPath('');
  };

  const handleConfirmSubmission = async () => {
    if (!submitTarget || !answerGcsPath.trim()) return;
    setSubmitBusy(true);
    try {
      await apiRequest(`/tests/${submitTarget.id}/submissions`, {
        method: 'POST',
        body: { answerGcsPath: answerGcsPath.trim() },
      });
      setSubmitTarget(null);
      Alert.alert('Submitted', 'Your answer has been recorded.');
      fetchTests();
    } catch (err) {
      console.error('submissions error', err.message);
      Alert.alert('Submission failed', err.message || 'Please try again.');
    } finally {
      setSubmitBusy(false);
    }
  };

  // ---- View the teacher's question paper: signed read URL, opened in browser ----
  const handleViewQuestion = async (test) => {
    setViewingQuestionId(test.id);
    try {
      const res = await apiRequest(`/tests/${test.id}/question-url`);
      if (res?.url) {
        await WebBrowser.openBrowserAsync(res.url);
      } else {
        Alert.alert('Unavailable', 'No question paper URL was returned.');
      }
    } catch (err) {
      console.error('view question error', err.message);
      Alert.alert('Could not open question paper', err.message || 'Please try again.');
    } finally {
      setViewingQuestionId(null);
    }
  };

  // ---- View my own submitted answer sheet ----
  const handleViewMyAnswer = async () => {
    if (!detailData?.id) return;
    setViewingAnswer(true);
    try {
      const res = await apiRequest(`/tests/submissions/${detailData.id}/answer-url`);
      if (res?.url) {
        await WebBrowser.openBrowserAsync(res.url);
      } else {
        Alert.alert('Unavailable', 'No answer sheet URL was returned.');
      }
    } catch (err) {
      console.error('view my answer error', err.message);
      Alert.alert('Could not open answer sheet', err.message || 'Please try again.');
    } finally {
      setViewingAnswer(false);
    }
  };

  // ---- Submission detail: GET /tests/:id/submissions/me ----
  const openDetail = async (test) => {
    setDetailTarget(test);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await apiRequest(`/tests/${test.id}/submissions/me`);
      setDetailData(res);
    } catch (err) {
      console.error('submissions/me error', err.message);
      setDetailData({ error: err.message || 'Unable to load submission.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailTarget(null);
    setDetailData(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <LinearGradient colors={['#2b58ed', '#1e3a8a']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greetingText}>Tests &amp; Assignments</Text>
              <Text style={styles.userNameText}>{userProfile?.student_name || 'Student'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {userProfile?.sdc_batch || 'Your Batch'}
                </Text>
              </View>
            </View>

            <View style={styles.headerIconWrap}>
              <ClipboardCheck size={24} color="#fff" />
            </View>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.glassBackground}
            />
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{counts.Pending}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{counts.Submitted}</Text>
                <Text style={styles.summaryLabel}>Submitted</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{counts.Graded}</Text>
                <Text style={styles.summaryLabel}>Graded</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Segmented Control */}
        <View style={styles.filterBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterButton,
                activeTab === tab ? styles.filterButtonActive : styles.filterButtonMuted,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeTab === tab ? styles.filterButtonTextActive : styles.filterButtonTextMuted,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#2b58ed" style={{ marginTop: 40 }} />
        ) : errorMsg ? (
          <View style={styles.emptyState}>
            <AlertCircle size={28} color="#94A3B8" />
            <Text style={styles.emptyStateText}>{errorMsg}</Text>
          </View>
        ) : visibleItems.length > 0 ? (
          <View style={styles.testList}>
            {visibleItems.map((test) => {
              const color = SUBJECT_COLORS[test.subject] || '#2b58ed';
              return (
                <View key={test.id} style={styles.testCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: `${color}1A` }]}>
                      <FileText size={22} color={color} />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.testTitle}>{test.title}</Text>
                      <Text style={[styles.testSubject, { color }]}>
                        {test.subject || 'General'} · {test.type === 'assignment' ? 'Assignment' : 'Test'}
                      </Text>
                    </View>
                    <StatusBadge test={test} />
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.infoItem}>
                      <Clock size={14} color="#64748B" />
                      <Text style={styles.infoText}>{formatDue(test.due_at)}</Text>
                    </View>
                    <View style={styles.verticalDividerSmall} />
                    <View style={styles.infoItem}>
                      <ClipboardCheck size={14} color="#64748B" />
                      <Text style={styles.infoText}>
                        {test.total_marks != null ? `${test.total_marks} marks` : 'Marks TBD'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => handleViewQuestion(test)}
                    disabled={viewingQuestionId === test.id}
                  >
                    {viewingQuestionId === test.id ? (
                      <ActivityIndicator color="#2b58ed" size="small" />
                    ) : (
                      <>
                        <FileText size={14} color="#2b58ed" />
                        <Text style={styles.actionBtnOutlineText}>View Question Paper</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {test.released_at ? (
                    <>
                      <View style={styles.resultCard}>
                        <View style={styles.resultCardTop}>
                          <View style={styles.resultCardScoreWrap}>
                            <Award size={16} color="#10B981" />
                            <Text style={styles.resultCardScore}>
                              {test.score != null ? test.score : '—'}
                              {test.total_marks != null ? `/${test.total_marks}` : ''}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, styles.statusBadgeGraded]}>
                            <Text style={styles.statusBadgeGradedText}>Graded</Text>
                          </View>
                        </View>
                        {!!test.remarks && (
                          <Text style={styles.resultCardRemarks} numberOfLines={2}>{test.remarks}</Text>
                        )}
                      </View>
                      <TouchableOpacity style={styles.actionBtnOutline} onPress={() => openDetail(test)}>
                        <Eye size={14} color="#2b58ed" />
                        <Text style={styles.actionBtnOutlineText}>View Submission</Text>
                      </TouchableOpacity>
                    </>
                  ) : test.submitted_at ? (
                    <>
                      <View style={styles.resultCard}>
                        <View style={styles.resultCardTop}>
                          <View style={styles.resultCardScoreWrap}>
                            <CheckCircle2 size={16} color="#2563EB" />
                            <Text style={styles.resultCardStatusText}>Submitted {formatShortDate(test.submitted_at)}</Text>
                          </View>
                          <View style={[styles.statusBadge, styles.statusBadgeSubmitted]}>
                            <Text style={styles.statusBadgeSubmittedText}>
                              {isPastDue(test) ? 'Locked' : 'Awaiting grading'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.dualActionRow}>
                        <TouchableOpacity style={[styles.actionBtnOutline, { flex: 1 }]} onPress={() => openDetail(test)}>
                          <Eye size={14} color="#2b58ed" />
                          <Text style={styles.actionBtnOutlineText}>View</Text>
                        </TouchableOpacity>
                        {!isPastDue(test) && (
                          <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => openSubmitModal(test)}>
                            <RefreshCw size={14} color="#2b58ed" />
                            <Text style={styles.actionBtnActiveText}>Resubmit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  ) : isPastDue(test) ? (
                    <View style={styles.resultCard}>
                      <View style={styles.resultCardTop}>
                        <View style={styles.resultCardScoreWrap}>
                          <AlertCircle size={16} color="#DC2626" />
                          <Text style={styles.expiredText}>Submission window closed</Text>
                        </View>
                        <View style={[styles.statusBadge, styles.statusBadgeExpired]}>
                          <Text style={styles.statusBadgeExpiredText}>Expired</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openSubmitModal(test)}>
                      <Upload size={14} color="#2b58ed" />
                      <Text style={styles.actionBtnActiveText}>Submit Answer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ClipboardCheck size={28} color="#94A3B8" />
            <Text style={styles.emptyStateText}>No {activeTab.toLowerCase()} tests right now.</Text>
          </View>
        )}
      </View>

      {/* Footer padding for tab bar */}
      <View style={{ height: 100 }} />

      {/* Submit Answer Modal */}
      <Modal visible={!!submitTarget} transparent animationType="fade" onRequestClose={closeSubmitModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {submitTarget?.submitted_at ? 'Resubmit' : 'Submit'} · {submitTarget?.title}
              </Text>
              <TouchableOpacity onPress={closeSubmitModal} disabled={submitBusy}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {!!submitTarget?.submitted_at && (
              <Text style={styles.modalHint}>
                You've already submitted an answer for this. Uploading a new file will replace it — this
                is only allowed before the due date.
              </Text>
            )}

            <Text style={styles.modalLabel}>Answer sheet (scanned PDF or photo)</Text>
            {answerGcsPath ? (
              <View style={styles.filePreparedRow}>
                <CheckCircle2 size={14} color="#10B981" />
                <Text style={styles.filePreparedText} numberOfLines={1}>{answerFileName}</Text>
                <TouchableOpacity onPress={handleChangeFile} disabled={uploadingFile || submitBusy}>
                  <RefreshCw size={14} color="#2b58ed" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.browseBtn, uploadingFile && styles.disabledOpacity]}
                onPress={handleBrowseFile}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <>
                    <ActivityIndicator color="#2b58ed" size="small" />
                    <Text style={styles.browseBtnText}>Uploading…</Text>
                  </>
                ) : (
                  <>
                    <Upload size={16} color="#2b58ed" />
                    <Text style={styles.browseBtnText}>Browse Files</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <Text style={styles.modalHint}>
              Scan your answer sheet into a PDF (or take a photo) first, then pick it here — it uploads
              straight to storage and gets recorded against this test.
            </Text>
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, (!answerGcsPath || submitBusy || uploadingFile) && styles.modalPrimaryBtnDisabled]}
              onPress={handleConfirmSubmission}
              disabled={!answerGcsPath || submitBusy || uploadingFile}
            >
              {submitBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalPrimaryBtnText}>Submit Answer</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Submission Detail Modal */}
      <Modal visible={!!detailTarget} transparent animationType="fade" onRequestClose={closeDetail}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {detailTarget?.title}
              </Text>
              <TouchableOpacity onPress={closeDetail}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <ActivityIndicator color="#2b58ed" style={{ marginVertical: 20 }} />
            ) : detailData?.error ? (
              <Text style={styles.modalHint}>{detailData.error}</Text>
            ) : (
              <>
                <DetailRow label="Submitted" value={detailData?.submitted_at ? new Date(detailData.submitted_at).toLocaleString('en-IN') : '—'} />
                <DetailRow label="Status" value={detailData?.released_at ? 'Graded' : 'Awaiting grading'} />
                {!!detailData?.released_at && (
                  <>
                    <DetailRow label="Score" value={detailData?.score != null ? String(detailData.score) : '—'} />
                    <DetailRow label="Remarks" value={detailData?.remarks || '—'} />
                  </>
                )}
                {!!detailData?.id && (
                  <TouchableOpacity
                    style={[styles.actionBtnOutline, { marginTop: 14 }]}
                    onPress={handleViewMyAnswer}
                    disabled={viewingAnswer}
                  >
                    {viewingAnswer ? (
                      <ActivityIndicator color="#2b58ed" size="small" />
                    ) : (
                      <>
                        <Eye size={14} color="#2b58ed" />
                        <Text style={styles.actionBtnOutlineText}>View My Answer Sheet</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ test }) {
  let label = 'Pending';
  let bg = '#FEF3C7';
  let fg = '#B45309';

  if (test.released_at) {
    label = 'Graded';
    bg = '#DCFCE7';
    fg = '#15803D';
  } else if (test.submitted_at) {
    label = 'Submitted';
    bg = '#DBEAFE';
    fg = '#1D4ED8';
  } else if (test.due_at && new Date(test.due_at) < new Date()) {
    label = 'Expired';
    bg = '#FEE2E2';
    fg = '#DC2626';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusBadgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 24,
  },
  greetingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  userNameText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -20,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonMuted: {
    backgroundColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#1E293B',
  },
  filterButtonTextMuted: {
    color: '#64748B',
  },
  testList: {
    gap: 16,
  },
  testCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  testSubject: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
  },
  verticalDividerSmall: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
  },
  resultCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  resultCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resultCardScoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  resultCardScore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  resultCardStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
    flexShrink: 1,
  },
  resultCardRemarks: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  expiredText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    flexShrink: 1,
  },
  statusBadgeGraded: { backgroundColor: '#DCFCE7' },
  statusBadgeGradedText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  statusBadgeSubmitted: { backgroundColor: '#DBEAFE' },
  statusBadgeSubmittedText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  statusBadgeExpired: { backgroundColor: '#FEE2E2' },
  statusBadgeExpiredText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  dualActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  actionBtnActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2b58ed',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2b58ed',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  filePreparedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  filePreparedText: { flex: 1, fontSize: 12, color: '#15803D', fontWeight: '600' },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 10,
  },
  browseBtnText: { color: '#2b58ed', fontSize: 14, fontWeight: '700' },
  disabledOpacity: { opacity: 0.5 },
  modalHint: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 16,
  },
  modalPrimaryBtn: {
    backgroundColor: '#2b58ed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryBtnDisabled: {
    backgroundColor: '#93A5EF',
  },
  modalPrimaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
