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
    }
  };

  useEffect(() => {
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
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
  },
});
