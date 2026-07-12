import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, TrendingUp, BookOpen, Clock, AlertCircle } from 'lucide-react-native';
import { useUserSession } from '../../context/UserSessionContext';
import { apiRequest } from '../../services/api';

export default function ParentPerformanceScreen({ navigation }) {
  const { activeChild } = useUserSession();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);

  const fetchPerformance = async (studentSdcId) => {
    try {
      const data = await apiRequest(`/parent/child/${studentSdcId}/performance`);
      setPerformanceData(data);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeChild) {
      setLoading(true);
      fetchPerformance(activeChild.student_sdc_id);
    }
  }, [activeChild]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!activeChild) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SafeAreaView edges={['top']}>
            <Text style={styles.headerTitle}>Performance</Text>
          </SafeAreaView>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No child profile selected.</Text>
        </View>
      </View>
    );
  }

  const averageScore = performanceData?.averageScore || 0;
  const classRank = performanceData?.classRank || 'N/A';
  const subjects = performanceData?.subjects || [];
  const tests = performanceData?.tests || [];
  const insight = performanceData?.insight || 'No performance data available.';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#6d28d9']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ChevronLeft size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Performance</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.overallStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averageScore}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{classRank}</Text>
              <Text style={styles.statLabel}>Class Rank</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subject-wise Average</Text>
          <TrendingUp size={20} color="#8b5cf6" />
        </View>

        {subjects.length > 0 ? (
          subjects.map((sub, index) => {
            // Pick color accent dynamically
            const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
            const color = colors[index % colors.length];

            return (
              <SubjectCard 
                key={sub.subject}
                subject={sub.subject} 
                percentage={`${sub.percentage}%`} 
                testsCount={`${sub.count} Tests`} 
                color={color} 
              />
            );
          })
        ) : (
          <Text style={styles.noDataText}>No subject performance averages available.</Text>
        )}

        {/* Dynamic Data-Driven Performance Insight */}
        <View style={styles.analysisBox}>
          <View style={styles.analysisHeader}>
            <TrendingUp size={24} color="#8b5cf6" />
            <Text style={styles.analysisTitle}>Academic Feedback</Text>
          </View>
          <Text style={styles.analysisText}>{insight}</Text>
        </View>

        {/* Detailed Test Results list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Test History</Text>
        </View>

        {tests.length > 0 ? (
          tests.map((test) => (
            <TestResultRow 
              key={test.id}
              title={test.title}
              subject={test.subject}
              score={test.score !== null ? `${test.score}/${test.total_marks}` : 'Absent/Ungraded'}
              rank={test.rank}
              remarks={test.remarks}
              date={test.due_at ? new Date(test.due_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
            />
          ))
        ) : (
          <Text style={styles.noDataText}>No test records found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function SubjectCard({ subject, percentage, testsCount, color }) {
  return (
    <View style={styles.subjectCard}>
      <View style={[styles.colorAccent, { backgroundColor: color }]} />
      <View style={styles.cardMain}>
        <View style={styles.cardHeader}>
          <Text style={styles.subjectName}>{subject}</Text>
          <Text style={[styles.percentageText, { color: '#8b5cf6' }]}>{percentage}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <BookOpen size={16} color="#64748b" />
            <Text style={styles.infoText}>{testsCount}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function TestResultRow({ title, subject, score, rank, remarks, date }) {
  return (
    <View style={styles.testRow}>
      <View style={styles.testHeader}>
        <View style={styles.testDetails}>
          <Text style={styles.testTitle}>{title}</Text>
          <Text style={styles.testSubject}>{subject} • {date}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.testScore}>{score}</Text>
          {rank !== 'N/A' && <Text style={styles.testRank}>Rank {rank}</Text>}
        </View>
      </View>
      {remarks && (
        <View style={styles.remarksBox}>
          <AlertCircle size={14} color="#64748b" />
          <Text style={styles.remarksText}>{remarks}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  header: {
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  colorAccent: {
    width: 6,
    height: '100%',
  },
  cardMain: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  percentageText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
  },
  analysisBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6d28d9',
  },
  analysisText: {
    fontSize: 14,
    color: '#5b21b6',
    lineHeight: 20,
  },
  testRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testDetails: {
    flex: 1,
    marginRight: 10,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  testSubject: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  testScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  testRank: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginTop: 2,
  },
  remarksBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  remarksText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  noDataText: {
    textAlign: 'center',
    color: '#64748b',
    marginVertical: 10,
  },
  backButton: {
    padding: 4,
  },
});
