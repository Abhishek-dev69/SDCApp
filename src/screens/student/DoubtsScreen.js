<<<<<<< Updated upstream
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
=======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
>>>>>>> Stashed changes
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronRight, TrendingUp, CheckCircle2, MessageSquare, Plus, Send, Clock, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');
<<<<<<< Updated upstream

const FILTERS = ['All', 'Physics', 'Chemistry', 'Math'];

export default function DoubtsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [doubts, setDoubts] = useState([]);

  const loadDoubts = () => {
    apiRequest('/operations/doubts')
      .then((data) => setDoubts(Array.isArray(data) ? data : []))
      .catch((err) => console.log('Doubts live data unavailable:', err.message));
  };

  useEffect(loadDoubts, []);

  const visibleDoubts = useMemo(
    () => doubts.filter((doubt) => (
      (activeFilter === 'All' || doubt.subject === activeFilter)
      && `${doubt.title} ${doubt.description}`.toLowerCase().includes(query.toLowerCase())
    )),
    [activeFilter, doubts, query]
  );

  const createDoubt = async () => {
    if (!query.trim()) {
      Alert.alert('Enter Your Doubt', 'Type your question in the search box first.');
      return;
    }
    try {
      await apiRequest('/operations/doubts', {
        method: 'POST',
        body: {
          subject: activeFilter === 'All' ? 'General' : activeFilter,
          title: query.trim().slice(0, 120),
          description: query.trim(),
        },
      });
      setQuery('');
      loadDoubts();
      Alert.alert('Doubt Submitted', 'Your question has been sent to the academic team.');
    } catch (err) {
      Alert.alert('Unable to Submit', err.message);
=======
const FILTERS = ['All', 'Physics', 'Chemistry', 'Math', 'Biology'];

export default function DoubtsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Doubt Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [batchCode, setBatchCode] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (activeFilter !== 'All') queryParams.append('subject', activeFilter);

      const data = await apiRequest(`/doubts?${queryParams.toString()}`);
      setDoubts(data || []);
    } catch (err) {
      console.log('Error fetching student doubts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [activeFilter]);

  const handlePostDoubt = async () => {
    if (!question.trim()) {
      Alert.alert('Validation Error', 'Please enter your doubt question.');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest('/doubts', {
        method: 'POST',
        body: {
          question: question.trim(),
          subject,
          batchCode,
        },
      });

      Alert.alert('Success', 'Your doubt has been submitted to your subject teachers!');
      setModalVisible(false);
      setQuestion('');
      fetchDoubts();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit doubt');
    } finally {
      setSubmitting(false);
>>>>>>> Stashed changes
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
<<<<<<< Updated upstream
            <Text style={styles.headerTitle}>Doubts & AI Help</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#94A3B8" />
              <TextInput 
                placeholder="Search your doubt..." 
                style={styles.searchInput}
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
              />
            </View>
=======
            <Text style={styles.headerTitle}>Doubts & Faculty Q&A</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.askBtn}>
              <Plus size={18} color="#fff" />
              <Text style={styles.askBtnText}>Ask Doubt</Text>
            </TouchableOpacity>
>>>>>>> Stashed changes
          </View>
        </SafeAreaView>
      </View>

<<<<<<< Updated upstream
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Academic support submission */}
        <TouchableOpacity style={styles.aiBanner} onPress={createDoubt}>
=======
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDoubts(); }} colors={['#9b59b6']} />}
      >
        {/* Ask AI Tutor Banner */}
        <TouchableOpacity style={styles.aiBanner}>
>>>>>>> Stashed changes
          <LinearGradient
            colors={['#8E24AA', '#6A1B9A']}
            style={styles.aiBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.aiBannerContent}>
            <View style={styles.aiTextContainer}>
<<<<<<< Updated upstream
              <Text style={styles.aiBannerTitle}>Ask the Academic Team</Text>
              <Text style={styles.aiBannerSubtitle}>Send your question to your assigned faculty</Text>
=======
              <Text style={styles.aiBannerTitle}>Ask SDC AI Tutor</Text>
              <Text style={styles.aiBannerSubtitle}>Instant 24/7 step-by-step doubt resolution</Text>
>>>>>>> Stashed changes
            </View>
            <View style={styles.aiArrowBtn}>
              <ChevronRight size={24} color="#6A1B9A" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Subject Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View style={styles.trendingHeader}>
<<<<<<< Updated upstream
            <TrendingUp size={20} color="#28388f" />
            <Text style={styles.sectionTitle}>My Doubts</Text>
=======
            <TrendingUp size={20} color="#8E24AA" />
            <Text style={styles.sectionTitle}>Recent Batch Doubts</Text>
>>>>>>> Stashed changes
          </View>
        </View>

<<<<<<< Updated upstream
        {visibleDoubts.map((doubt) => (
          <TouchableOpacity key={doubt.id} style={styles.doubtCard}>
            <Text style={styles.doubtQuestion} numberOfLines={2}>{doubt.title}</Text>
            
            <View style={styles.doubtFooter}>
              <View style={styles.tagGroup}>
                <View style={styles.subjectTag}>
                  <Text style={styles.subjectTagText}>{doubt.subject}</Text>
                </View>
                {doubt.status === 'answered' || doubt.status === 'closed' ? (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={styles.verifiedText}>Faculty Answered</Text>
                  </View>
                ) : null}
              </View>
              
              <View style={styles.answerCount}>
                <MessageSquare size={16} color="#64748B" />
                <Text style={styles.answerText}>{doubt.status}</Text>
=======
        {loading ? (
          <ActivityIndicator size="large" color="#8E24AA" style={{ marginVertical: 30 }} />
        ) : doubts.length === 0 ? (
          <View style={styles.emptyCard}>
            <MessageSquare size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Doubts Posted</Text>
            <Text style={styles.emptySub}>Tap '+ Ask Doubt' above to post a question for your teachers.</Text>
          </View>
        ) : (
          doubts.map((doubt) => (
            <View key={doubt.id} style={styles.doubtCard}>
              <Text style={styles.doubtQuestion}>{doubt.question}</Text>

              <View style={styles.doubtFooter}>
                <View style={styles.tagGroup}>
                  <View style={styles.subjectTag}>
                    <Text style={styles.subjectTagText}>{doubt.subject}</Text>
                  </View>
                  {doubt.status === 'resolved' ? (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <Text style={styles.verifiedText}>Faculty Answered</Text>
                    </View>
                  ) : (
                    <View style={[styles.verifiedBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Clock size={14} color="#D97706" />
                      <Text style={[styles.verifiedText, { color: '#B45309' }]}>Pending Teacher Reply</Text>
                    </View>
                  )}
                </View>
>>>>>>> Stashed changes
              </View>

              {doubt.answer && (
                <View style={styles.answerBox}>
                  <Text style={styles.answerHeader}>Faculty Answer ({doubt.answered_by}):</Text>
                  <Text style={styles.answerText}>{doubt.answer}</Text>
                </View>
              )}
            </View>
<<<<<<< Updated upstream
          </TouchableOpacity>
        ))}
        {visibleDoubts.length === 0 && (
          <Text style={styles.emptyText}>No doubts found. Type a question above and send it to the academic team.</Text>
=======
          ))
>>>>>>> Stashed changes
        )}
      </ScrollView>

      {/* Ask Doubt Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ask a Doubt to Faculty</Text>

            <Text style={styles.inputLabel}>Subject:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {['Physics', 'Chemistry', 'Math', 'Biology'].map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[styles.subChip, subject === sub && styles.subChipActive]}
                  onPress={() => setSubject(sub)}
                >
                  <Text style={[styles.subChipText, subject === sub && styles.subChipTextActive]}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Question / Doubt Description:</Text>
            <TextInput
              style={styles.doubtInput}
              placeholder="Describe your question clearly (Max 15MB file links allowed)..."
              multiline
              numberOfLines={4}
              value={question}
              onChangeText={setQuestion}
              textAlignVertical="top"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handlePostDoubt}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Send size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Post Doubt</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#8E24AA',
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  askBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  aiBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
  },
  aiBannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  aiBannerContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiTextContainer: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  aiArrowBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    marginBottom: 16,
  },
  filterBarContent: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#8E24AA',
    borderColor: '#8E24AA',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 24,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  doubtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  doubtQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 10,
  },
  doubtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectTagText: {
    color: '#8E24AA',
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  answerBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#8E24AA',
    padding: 10,
    borderRadius: 6,
  },
  answerHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E24AA',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
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
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  subChipActive: {
    backgroundColor: '#8E24AA',
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  subChipTextActive: {
    color: '#FFFFFF',
  },
  doubtInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    height: 110,
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
    backgroundColor: '#8E24AA',
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
});
