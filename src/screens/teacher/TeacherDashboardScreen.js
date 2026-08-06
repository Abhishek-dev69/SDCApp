<<<<<<< Updated upstream
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, BookOpen, CalendarDays, ChevronRight, MessageCircle, Filter } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { useUserSession } from '../../context/UserSessionContext';

function getWeekRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatTimeRange(lecture) {
  if (!lecture.scheduledAt && !lecture.scheduled_at) return 'Time not set';
  const startsAt = new Date(lecture.scheduledAt || lecture.scheduled_at);
  const endsAt = new Date(startsAt.getTime() + Number(lecture.durationMins || lecture.duration_mins || 0) * 60000);
  const timeOptions = { hour: 'numeric', minute: '2-digit' };
  return `${startsAt.toLocaleTimeString([], timeOptions)} - ${endsAt.toLocaleTimeString([], timeOptions)}`;
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}16` }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function TeacherDashboardScreen({ navigation }) {
  const { userProfile } = useUserSession();
  const [loading, setLoading] = useState(true);
  const [doubts, setDoubts] = useState([]);
  const [lectures, setLectures] = useState([]);

  // Filter states
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [topicSearch, setTopicSearch] = useState('');
  const [showBatchList, setShowBatchList] = useState(false);

  const teacherName = userProfile?.name || userProfile?.teacher_name || 'Teacher';

  const loadDashboard = async () => {
    const { start, end } = getWeekRange();
    setLoading(true);
    try {
      const [doubtData, lectureData] = await Promise.all([
        apiRequest('/operations/doubts').catch(() => []),
        apiRequest(`/lectures?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}`).catch(() => []),
      ]);
      setDoubts(Array.isArray(doubtData) ? doubtData : []);
      setLectures(Array.isArray(lectureData) ? lectureData : []);
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
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  BookOpen,
  HelpCircle,
  Award,
  UploadCloud,
  CheckCircle,
  Clock,
  ChevronRight,
  ShieldAlert,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');

export default function TeacherDashboardScreen({ navigation, route }) {
  const displayName = route?.params?.displayName || 'Teacher';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activeBatches: 4,
    pendingDoubts: 3,
    todayLectures: 2,
    upcomingTests: 1,
  });
  const [doubts, setDoubts] = useState([]);
  const [lectures, setLectures] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [doubtsData, overviewData] = await Promise.all([
        apiRequest('/doubts?status=pending').catch(() => []),
        apiRequest('/admin/overview').catch(() => null),
      ]);

      if (Array.isArray(doubtsData)) {
        setDoubts(doubtsData.slice(0, 3));
        setStats((prev) => ({ ...prev, pendingDoubts: doubtsData.length }));
      }

      if (overviewData) {
        setStats((prev) => ({
          ...prev,
          activeBatches: overviewData.batchCount || prev.activeBatches,
        }));
      }
    } catch (err) {
      console.log('Error loading teacher dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
>>>>>>> Stashed changes
    }
  };

  useEffect(() => {
<<<<<<< Updated upstream
    const unsubscribe = navigation.addListener('focus', loadDashboard);
    loadDashboard();
    return unsubscribe;
  }, [navigation]);

  const pendingDoubts = useMemo(
    () => doubts.filter((doubt) => !['answered', 'closed'].includes(doubt.status)).length,
    [doubts]
  );

  // Extract unique batch names from the schedule
  const uniqueBatches = useMemo(() => {
    const batchNames = new Set();
    lectures.forEach(l => {
      const name = l.batchName || l.batch;
      if (name) batchNames.add(name);
    });
    return ['All', ...Array.from(batchNames)];
  }, [lectures]);

  // Filter lectures locally
  const filteredLectures = useMemo(() => {
    return lectures.filter(l => {
      const bName = l.batchName || l.batch || '';
      const matchesBatch = selectedBatchFilter === 'All' || bName === selectedBatchFilter;
      
      const topic = l.topic || '';
      const matchesTopic = topicSearch.trim() === '' || topic.toLowerCase().includes(topicSearch.toLowerCase());
      
      return matchesBatch && matchesTopic;
    });
  }, [lectures, selectedBatchFilter, topicSearch]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <LinearGradient colors={['#2446A7', '#2F66F4']} style={styles.heroGradient} />
        <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.kicker}>Good Morning</Text>
              <Text style={styles.teacherName}>{teacherName}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={23} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Teacher</Text>
=======
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#059669', '#10B981', '#047857']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.badgeRow}>
                <Sparkles size={14} color="#A7F3D0" />
                <Text style={styles.roleBadge}>TEACHER PORTAL</Text>
              </View>
              <Text style={styles.welcomeText}>Hello, {displayName}</Text>
              <Text style={styles.subWelcomeText}>Here is your academic overview for today</Text>
            </View>
>>>>>>> Stashed changes
          </View>
        </SafeAreaView>
      </View>

<<<<<<< Updated upstream
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#28388F" />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon={MessageCircle} value={pendingDoubts} label="Pending doubts" color="#F97316" />
            <StatCard icon={CalendarDays} value={lectures.length} label="Weekly Lectures" color="#10B981" />
          </View>

          {/* Schedule Filters section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Schedule Filter Options</Text>
            
            <View style={styles.filterRow}>
              {/* Batch Filter selector */}
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>Batch</Text>
                <TouchableOpacity 
                  style={styles.batchSelectorBtn}
                  onPress={() => setShowBatchList(!showBatchList)}
                >
                  <Filter size={14} color="#28388F" style={{ marginRight: 6 }} />
                  <Text style={styles.batchSelectorText}>{selectedBatchFilter}</Text>
                </TouchableOpacity>
                {showBatchList && (
                  <View style={styles.batchDropdownMenu}>
                    {uniqueBatches.map(b => (
                      <TouchableOpacity 
                        key={b} 
                        style={styles.batchMenuItem} 
                        onPress={() => {
                          setSelectedBatchFilter(b);
                          setShowBatchList(false);
                        }}
                      >
                        <Text style={styles.batchMenuItemText}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Topic Search input */}
              <View style={{ flex: 1.2 }}>
                <Text style={styles.filterLabel}>Chapter / Topic</Text>
                <TextInput
                  style={styles.searchBar}
                  placeholder="Search topic..."
                  placeholderTextColor="#94A3B8"
                  value={topicSearch}
                  onChangeText={setTopicSearch}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lecture Schedule</Text>
            <TouchableOpacity onPress={loadDashboard}>
              <Text style={styles.sectionAction}>7 Days</Text>
            </TouchableOpacity>
          </View>

          {filteredLectures.length === 0 ? (
            <View style={styles.emptyCard}>
              <BookOpen size={24} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No matching classes found</Text>
              <Text style={styles.emptyText}>Adjust your filters to see scheduled lectures.</Text>
            </View>
          ) : (
            filteredLectures.map((lecture) => (
              <View key={lecture.id} style={styles.lectureCard}>
                <View style={styles.lectureIcon}>
                  <BookOpen size={23} color="#2446A7" />
                </View>
                <View style={styles.lectureCopy}>
                  <Text style={styles.lectureTitle}>
                    {lecture.subject || 'Subject'} {lecture.batchName || lecture.batch || ''}
                  </Text>
                  {!!lecture.topic && <Text style={styles.lectureTopic}>Topic: {lecture.topic}</Text>}
                  <Text style={styles.lectureTime}>{formatTimeRange(lecture)}</Text>
                </View>
                <ChevronRight size={20} color="#94A3B8" />
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
=======
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
      >
        {/* Metric Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#10B981' }]}>
              <BookOpen size={20} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.activeBatches}</Text>
            <Text style={styles.statLabel}>Active Batches</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#F59E0B' }]}>
              <HelpCircle size={20} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.pendingDoubts}</Text>
            <Text style={styles.statLabel}>Pending Doubts</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#3B82F6' }]}>
              <Calendar size={20} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.todayLectures}</Text>
            <Text style={styles.statLabel}>Lectures Today</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#8B5CF6' }]}>
              <Award size={20} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.upcomingTests}</Text>
            <Text style={styles.statLabel}>Active Tests</Text>
          </View>
        </View>

        {/* Quick Action Hub */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Academic Tools</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MarkAttendance')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle size={22} color="#059669" />
            </View>
            <Text style={styles.actionTitle}>Mark Attendance</Text>
            <Text style={styles.actionSub}>Take attendance for batches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('TeacherTests')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#EDE9FE' }]}>
              <Award size={22} color="#7C3AED" />
            </View>
            <Text style={styles.actionTitle}>Tests & Grading</Text>
            <Text style={styles.actionSub}>Create tests & enter marks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('UploadMaterial')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#DBEAFE' }]}>
              <UploadCloud size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionTitle}>Upload Notes</Text>
            <Text style={styles.actionSub}>Study material (Max 15MB)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('TeacherDoubts')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
              <MessageSquare size={22} color="#D97706" />
            </View>
            <Text style={styles.actionTitle}>Resolve Doubts</Text>
            <Text style={styles.actionSub}>Answer student Q&As</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('PortionTracker')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FCE7F3' }]}>
              <BookOpen size={22} color="#DB2777" />
            </View>
            <Text style={styles.actionTitle}>Portion Tracker</Text>
            <Text style={styles.actionSub}>Track syllabus progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('DisciplinaryManager')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
              <ShieldAlert size={22} color="#DC2626" />
            </View>
            <Text style={styles.actionTitle}>Disciplinary Log</Text>
            <Text style={styles.actionSub}>Log student conduct</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Doubts Widget */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Unresolved Doubts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TeacherDoubts')}>
            <Text style={styles.viewAllText}>View All ({stats.pendingDoubts})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 16 }} />
        ) : doubts.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircle size={32} color="#10B981" />
            <Text style={styles.emptyText}>All student doubts resolved!</Text>
          </View>
        ) : (
          doubts.map((doubt) => (
            <TouchableOpacity
              key={doubt.id}
              style={styles.doubtCard}
              onPress={() => navigation.navigate('TeacherDoubts')}
            >
              <View style={styles.doubtHeader}>
                <Text style={styles.doubtSubjectTag}>{doubt.subject || 'Physics'}</Text>
                <Text style={styles.doubtBatchTag}>{doubt.batch_code || 'NEET A7'}</Text>
              </View>
              <Text style={styles.doubtQuestion} numberOfLines={2}>
                {doubt.question}
              </Text>
              <View style={styles.doubtFooter}>
                <Text style={styles.doubtStudent}>Asked by {doubt.student_name || 'Student'}</Text>
                <View style={styles.answerBtn}>
                  <Text style={styles.answerBtnText}>Answer</Text>
                  <ChevronRight size={16} color="#059669" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
>>>>>>> Stashed changes
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
<<<<<<< Updated upstream
  content: {
    paddingBottom: 120,
  },
  hero: {
    minHeight: 250,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroSafeArea: {
    paddingHorizontal: 26,
    paddingBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
  },
  kicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 17,
    fontWeight: '600',
  },
  teacherName: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
    marginTop: 8,
    maxWidth: 310,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  loadingState: {
    paddingTop: 80,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 24,
    marginTop: 28,
  },
  statCard: {
    flex: 1,
    minHeight: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  statIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 34,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 5,
  },
  sectionHeader: {
    marginTop: 34,
    marginBottom: 14,
    paddingHorizontal: 24,
=======
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTop: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  roleBadge: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subWelcomeText: {
    fontSize: 13,
    color: '#D1FAE5',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 44) / 2,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#ECFDF5',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  doubtCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doubtHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  doubtSubjectTag: {
    backgroundColor: '#D1FAE5',
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doubtBatchTag: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doubtQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  doubtFooter: {
>>>>>>> Stashed changes
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
<<<<<<< Updated upstream
  sectionTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionAction: {
    color: '#2446A7',
    fontWeight: '700',
  },
  lectureCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lectureIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  lectureCopy: {
    flex: 1,
  },
  lectureTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  lectureTopic: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  lectureTime: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
  },
  emptyCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: '#64748B',
    marginTop: 5,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterSectionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  batchSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  batchSelectorText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  batchDropdownMenu: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  batchMenuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  batchMenuItemText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 13,
=======
  doubtStudent: {
    fontSize: 12,
    color: '#64748B',
  },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  answerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
>>>>>>> Stashed changes
  },
});
