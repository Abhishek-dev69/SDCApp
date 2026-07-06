import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, BookOpen, CalendarDays, ChevronRight, MessageCircle } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { useUserSession } from '../../context/UserSessionContext';

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
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

  const teacherName = userProfile?.name || userProfile?.teacher_name || 'Teacher';

  const loadDashboard = async () => {
    const { start, end } = getTodayRange();
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
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadDashboard);
    loadDashboard();
    return unsubscribe;
  }, [navigation]);

  const pendingDoubts = useMemo(
    () => doubts.filter((doubt) => !['answered', 'closed'].includes(doubt.status)).length,
    [doubts]
  );

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
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#28388F" />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon={MessageCircle} value={pendingDoubts} label="Pending Doubts" color="#F97316" />
            <StatCard icon={CalendarDays} value={lectures.length} label="Classes Today" color="#10B981" />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Lectures</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Today</Text>
            </TouchableOpacity>
          </View>

          {lectures.length === 0 ? (
            <View style={styles.emptyCard}>
              <BookOpen size={24} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No classes scheduled today</Text>
              <Text style={styles.emptyText}>Your assigned lectures will appear here.</Text>
            </View>
          ) : (
            lectures.map((lecture) => (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
});
