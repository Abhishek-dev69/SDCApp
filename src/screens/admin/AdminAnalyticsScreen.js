import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, BookOpen, ChevronLeft, Clock, TrendingUp, UserCheck, Users } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

function ProgressBar({ value, color = '#2563EB' }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${item.color}16` }]}>
        <Icon size={20} color={item.color} />
      </View>
      <Text style={styles.metricValue}>{item.value}</Text>
      <Text style={styles.metricLabel}>{item.label}</Text>
      <Text style={styles.metricMeta}>{item.meta}</Text>
    </View>
  );
}

export default function AdminAnalyticsScreen({ navigation }) {
  const [overview, setOverview] = useState(null);
  const [batches, setBatches] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const optional = (path) => apiRequest(path).catch((requestError) => (
      requestError.status === 501 ? [] : Promise.reject(requestError)
    ));
    const load = () => Promise.all([
      apiRequest('/dashboard/owner'),
      apiRequest('/admin/batches'),
      optional('/operations/attendance'),
      optional('/operations/results'),
    ])
      .then(([overviewData, batchData, attendanceData, resultData]) => {
        setOverview(overviewData);
        setBatches(Array.isArray(batchData) ? batchData : []);
        setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
        setResults(Array.isArray(resultData) ? resultData : []);
        setError('');
      })
      .catch((requestError) => setError(requestError.message || 'Could not load analytics.'));
    const unsubscribe = navigation.addListener('focus', load);
    load();
    return unsubscribe;
  }, [navigation]);

  const averageAttendance = attendance.length
    ? Math.round((attendance.filter((item) => ['present', 'late'].includes(item.status)).length / attendance.length) * 100)
    : null;
  const validResults = results.filter((item) => Number(item.total_marks) > 0);
  const averageScore = validResults.length
    ? Math.round(validResults.reduce(
      (sum, item) => sum + (Number(item.marks) / Number(item.total_marks)) * 100,
      0
    ) / validResults.length)
    : null;

  const batchSummaries = useMemo(() => batches.map((batch) => {
    const batchAttendance = attendance.filter((item) => Number(item.batch_id) === Number(batch.id));
    const batchResults = results.filter((item) => Number(item.batch_id) === Number(batch.id));
    const attendancePercent = batchAttendance.length
      ? Math.round((batchAttendance.filter((item) => ['present', 'late'].includes(item.status)).length / batchAttendance.length) * 100)
      : null;
    const scoredResults = batchResults.filter((item) => Number(item.total_marks) > 0);
    const testAverage = scoredResults.length
      ? Math.round(scoredResults.reduce(
        (sum, item) => sum + (Number(item.marks) / Number(item.total_marks)) * 100,
        0
      ) / scoredResults.length)
      : null;
    return { ...batch, attendancePercent, testAverage };
  }), [attendance, batches, results]);

  const attentionBatches = batchSummaries
    .filter((batch) => (
      (batch.attendancePercent !== null && batch.attendancePercent < 75)
      || (batch.testAverage !== null && batch.testAverage < 60)
    ))
    .slice(0, 4);

  const metrics = [
    {
      id: 'students',
      label: 'Total Students',
      value: overview?.totalStudents ?? '...',
      meta: `${overview?.activeBatches || 0} active batches`,
      icon: Users,
      color: '#2563EB',
    },
    {
      id: 'materials',
      label: 'Study Materials',
      value: overview?.studyMaterials ?? '...',
      meta: `${overview?.lectures || 0} lectures`,
      icon: BookOpen,
      color: '#0F766E',
    },
    {
      id: 'attendance',
      label: 'Avg Attendance',
      value: averageAttendance === null ? 'N/A' : `${averageAttendance}%`,
      meta: `${attendance.length} records`,
      icon: UserCheck,
      color: '#16A34A',
    },
    {
      id: 'score',
      label: 'Avg Test Score',
      value: averageScore === null ? 'N/A' : `${averageScore}%`,
      meta: `${results.length} published results`,
      icon: TrendingUp,
      color: '#EA580C',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient colors={['#2247B8', '#0F766E']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Dashboard')}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerKicker}>Admin Analytics</Text>
              <Text style={styles.headerTitle}>Batch Performance</Text>
              <Text style={styles.headerSubtitle}>
                {overview?.activeBatches || 0} batches and {overview?.totalStudents || 0} students
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <MetricCard key={metric.id} item={metric} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Branch Strength</Text>
          <Text style={styles.sectionCaption}>Student count and occupancy by centre</Text>
        </View>

        {(overview?.branches || []).map((branch) => (
          <View key={branch.branch || 'Unassigned'} style={styles.branchCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.branchName}>{branch.branch || 'Unassigned'}</Text>
                <Text style={styles.branchMeta}>
                  {branch.batches} batches • {branch.students} students
                </Text>
              </View>
              <Text style={styles.batchStudents}>{branch.students}</Text>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Batch Wise Snapshot</Text>
          <Text style={styles.sectionCaption}>Where students are concentrated and how each batch is performing</Text>
        </View>

        {batchSummaries.map((batch) => (
          <View key={batch.id} style={styles.batchCard}>
            <View style={styles.batchTopRow}>
              <View style={styles.batchCodeCircle}>
                <Text style={styles.batchCodeText}>{batch.label}</Text>
              </View>
              <View style={styles.batchInfo}>
                <Text style={styles.batchName}>{batch.name}</Text>
                <Text style={styles.batchMeta}>{batch.location} • {batch.program || 'No stream'} • Standard {batch.standard || 'N/A'}</Text>
              </View>
              <Text style={styles.batchStudents}>{batch.studentCount}</Text>
            </View>

            <View style={styles.batchStats}>
              <View style={styles.batchStatItem}>
                <Users size={15} color="#64748B" />
                <Text style={styles.batchStatText}>{batch.studentCount} students</Text>
              </View>
              <View style={styles.batchStatItem}>
                <UserCheck size={15} color="#64748B" />
                <Text style={styles.batchStatText}>{batch.attendancePercent === null ? 'No attendance' : `${batch.attendancePercent}% attendance`}</Text>
              </View>
              <View style={styles.batchStatItem}>
                <BarChart3 size={15} color="#64748B" />
                <Text style={styles.batchStatText}>{batch.testAverage === null ? 'No results' : `${batch.testAverage}% score`}</Text>
              </View>
            </View>

            <ProgressBar value={batch.attendancePercent || 0} color="#2563EB" />
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Needs Attention</Text>
          <Text style={styles.sectionCaption}>Batches where attendance or test scores need follow-up</Text>
        </View>

        {attentionBatches.map((batch) => (
          <View key={`attention-${batch.id}`} style={styles.attentionRow}>
            <View style={styles.attentionIcon}>
              <Clock size={18} color="#EA580C" />
            </View>
            <View style={styles.attentionInfo}>
              <Text style={styles.attentionTitle}>{batch.name}</Text>
              <Text style={styles.attentionMeta}>
                {batch.attendancePercent ?? 'N/A'}% attendance • {batch.testAverage ?? 'N/A'}% score • {batch.location}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerKicker: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  metricMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
    lineHeight: 15,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionCaption: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  branchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  branchName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  branchMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  percentBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  percentBadgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  miniStat: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  batchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchCodeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  batchCodeText: {
    color: '#28388F',
    fontSize: 16,
    fontWeight: '800',
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  batchMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  batchStudents: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  batchStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  batchStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  batchStatText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  attentionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attentionInfo: {
    flex: 1,
  },
  attentionTitle: {
    color: '#9A3412',
    fontSize: 15,
    fontWeight: '800',
  },
  attentionMeta: {
    color: '#C2410C',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
