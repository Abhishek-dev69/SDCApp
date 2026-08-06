<<<<<<< Updated upstream
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, MessageCircle, TrendingUp } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const FILTERS = ['All', 'open', 'answered', 'closed'];

function formatStatus(status) {
  if (!status) return 'open';
  return status.replace(/_/g, ' ');
}

export default function TeacherDoubtsScreen() {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [doubts, setDoubts] = useState([]);

  const loadDoubts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/operations/doubts').catch(() => []);
      setDoubts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
=======
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  Paperclip,
  User,
  BookOpen,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const SUBJECT_FILTERS = ['All', 'Physics', 'Chemistry', 'Math', 'Biology'];
const STATUS_FILTERS = ['All', 'pending', 'resolved'];

export default function TeacherDoubtsScreen({ navigation }) {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubject, setActiveSubject] = useState('All');
  const [activeStatus, setActiveStatus] = useState('pending');
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (activeSubject !== 'All') queryParams.append('subject', activeSubject);
      if (activeStatus !== 'All') queryParams.append('status', activeStatus);

      const data = await apiRequest(`/doubts?${queryParams.toString()}`);
      setDoubts(data || []);
    } catch (err) {
      console.log('Error fetching doubts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
>>>>>>> Stashed changes
    }
  };

  useEffect(() => {
<<<<<<< Updated upstream
    loadDoubts();
  }, []);

  const visibleDoubts = useMemo(
    () => doubts.filter((doubt) => activeFilter === 'All' || doubt.status === activeFilter),
    [activeFilter, doubts]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient colors={['#6D28D9', '#A855F7']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <Text style={styles.headerTitle}>Doubts</Text>
          <Text style={styles.headerSubtitle}>Questions from your assigned batches</Text>
        </SafeAreaView>
      </View>

      <View style={styles.filterWrap}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter === 'All' ? 'All' : formatStatus(filter)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#6D28D9" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color="#28388F" />
            <Text style={styles.sectionTitle}>Student Doubts</Text>
          </View>

          {visibleDoubts.map((doubt) => {
            const answered = ['answered', 'closed'].includes(doubt.status);
            return (
              <View key={doubt.id} style={styles.doubtCard}>
                <Text style={styles.doubtTitle}>{doubt.title}</Text>
                {!!doubt.description && (
                  <Text style={styles.doubtDescription} numberOfLines={2}>{doubt.description}</Text>
                )}
                <View style={styles.metaRow}>
                  <View style={styles.subjectTag}>
                    <Text style={styles.subjectText}>{doubt.subject || 'General'}</Text>
                  </View>
                  <View style={[styles.statusTag, answered && styles.statusTagAnswered]}>
                    {answered ? (
                      <CheckCircle2 size={14} color="#16A34A" />
                    ) : (
                      <MessageCircle size={14} color="#F97316" />
                    )}
                    <Text style={[styles.statusText, answered && styles.statusTextAnswered]}>
                      {formatStatus(doubt.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.studentName}>{doubt.student_name || 'Student'}</Text>
              </View>
            );
          })}

          {visibleDoubts.length === 0 && (
            <View style={styles.emptyCard}>
              <MessageCircle size={28} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No doubts in this view</Text>
              <Text style={styles.emptyText}>New student questions will appear here.</Text>
            </View>
          )}
        </ScrollView>
=======
    fetchDoubts();
  }, [activeSubject, activeStatus]);

  const handleOpenAnswerModal = (doubt) => {
    setSelectedDoubt(doubt);
    setAnswerText(doubt.answer || '');
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      Alert.alert('Validation Error', 'Please type your answer before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest(`/doubts/${selectedDoubt.id}/answer`, {
        method: 'POST',
        body: { answer: answerText.trim() },
      });
      Alert.alert('Success', 'Doubt resolved and answer submitted successfully!');
      setSelectedDoubt(null);
      setAnswerText('');
      fetchDoubts();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={['#059669', '#047857']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Student Doubts & Q&A</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {STATUS_FILTERS.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusChip, activeStatus === st && styles.statusChipActive]}
              onPress={() => setActiveStatus(st)}
            >
              <Text style={[styles.statusChipText, activeStatus === st && styles.statusChipTextActive]}>
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          {SUBJECT_FILTERS.map((sub) => (
            <TouchableOpacity
              key={sub}
              style={[styles.subjectChip, activeSubject === sub && styles.subjectChipActive]}
              onPress={() => setActiveSubject(sub)}
            >
              <Text style={[styles.subjectChipText, activeSubject === sub && styles.subjectChipTextActive]}>
                {sub}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Doubts List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDoubts(); }} colors={['#10B981']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 40 }} />
        ) : doubts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Doubts Found</Text>
            <Text style={styles.emptySub}>No student doubts match your selected filters.</Text>
          </View>
        ) : (
          doubts.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.tagGroup}>
                  <Text style={styles.subjectTag}>{item.subject}</Text>
                  <Text style={styles.batchTag}>{item.batch_code || 'General'}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'resolved' ? styles.statusResolved : styles.statusPending]}>
                  {item.status === 'resolved' ? (
                    <CheckCircle2 size={12} color="#047857" />
                  ) : (
                    <Clock size={12} color="#D97706" />
                  )}
                  <Text style={[styles.statusBadgeText, item.status === 'resolved' ? styles.statusTextResolved : styles.statusTextPending]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.questionText}>{item.question}</Text>

              {item.attachment_url && (
                <TouchableOpacity style={styles.attachmentBox} onPress={() => Linking.openURL(item.attachment_url)}>
                  <Paperclip size={14} color="#2563EB" />
                  <Text style={styles.attachmentText}>View Attachment (Max 15MB)</Text>
                </TouchableOpacity>
              )}

              <View style={styles.cardMeta}>
                <View style={styles.metaUser}>
                  <User size={14} color="#64748B" />
                  <Text style={styles.metaUserText}>{item.student_name || 'Student'}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              {item.answer ? (
                <View style={styles.answerBox}>
                  <Text style={styles.answerHeader}>Teacher Answer ({item.answered_by}):</Text>
                  <Text style={styles.answerBody}>{item.answer}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.actionBtn, item.status === 'resolved' && styles.actionBtnEdit]}
                onPress={() => handleOpenAnswerModal(item)}
              >
                <MessageSquare size={16} color="#fff" />
                <Text style={styles.actionBtnText}>
                  {item.status === 'resolved' ? 'Edit Answer' : 'Respond to Doubt'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Answer Modal */}
      {selectedDoubt && (
        <Modal visible={!!selectedDoubt} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Resolve Doubt</Text>
              <View style={styles.doubtSummaryBox}>
                <Text style={styles.doubtSummarySubject}>{selectedDoubt.subject} ({selectedDoubt.student_name})</Text>
                <Text style={styles.doubtSummaryQuestion}>{selectedDoubt.question}</Text>
              </View>

              <Text style={styles.inputLabel}>Your Explanation / Answer:</Text>
              <TextInput
                style={styles.answerInput}
                placeholder="Type clear step-by-step resolution..."
                multiline
                numberOfLines={5}
                value={answerText}
                onChangeText={setAnswerText}
                textAlignVertical="top"
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setSelectedDoubt(null)}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmitAnswer}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Send size={16} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit Answer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
=======
    paddingBottom: 16,
>>>>>>> Stashed changes
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
<<<<<<< Updated upstream
  headerSafeArea: {
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 34,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 7,
  },
  filterWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  filterChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#28388F',
    borderColor: '#28388F',
  },
  filterText: {
    color: '#475569',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingState: {
    paddingTop: 70,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  doubtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  doubtTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
  doubtDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },
  subjectTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  subjectText: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF7ED',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusTagAnswered: {
    backgroundColor: '#ECFDF5',
  },
  statusText: {
    color: '#C2410C',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusTextAnswered: {
    color: '#16A34A',
  },
  studentName: {
    color: '#64748B',
    fontWeight: '700',
    marginTop: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: '#64748B',
    marginTop: 5,
=======
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
    justify: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipRow: {
    paddingHorizontal: 16,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  statusChipActive: {
    backgroundColor: '#10B981',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#CBD5E1',
    marginRight: 8,
    alignSelf: 'center',
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  subjectChipActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  subjectChipTextActive: {
    color: '#047857',
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  subjectTag: {
    backgroundColor: '#D1FAE5',
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  batchTag: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusResolved: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextResolved: {
    color: '#047857',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 10,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaUserText: {
    fontSize: 12,
    color: '#64748B',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  answerBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  answerHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  answerBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnEdit: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  doubtSummaryBox: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  doubtSummarySubject: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  doubtSummaryQuestion: {
    fontSize: 13,
    color: '#334155',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  answerInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    height: 120,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
>>>>>>> Stashed changes
  },
});
