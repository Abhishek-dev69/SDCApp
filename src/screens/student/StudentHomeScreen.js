import {React, useState, useMemo, useEffect} from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserSession } from '../../context/UserSessionContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import WeeklyTimetable from '../../components/WeeklyTimetable';
import { 
  Bell, 
  Share2, 
  TrendingUp, 
  ClipboardCheck, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  CalendarClock,
  Megaphone,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');

export default function StudentHomeScreen( { navigation } ) {
  const { userProfile } = useUserSession();
  const [weekStart, setWeekStart] = useState(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  return d;
});
const [lectures, setLectures] = useState([]);
const [selectedDay, setSelectedDay] = useState(new Date().toDateString());
const [lecturesLoading, setLecturesLoading] = useState(false);

const weekDays = useMemo(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}, [weekStart]);

const weekEnd = useMemo(() => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7);
  return d;
}, [weekStart]);

useEffect(() => {
  fetchLectures();
}, [weekStart]);

const fetchLectures = async () => {
  setLecturesLoading(true);
  try {
    const from = weekStart.toISOString();
    const to = weekEnd.toISOString();
    const data = await apiRequest(`/admin/lectures/my?from=${from}&to=${to}`);
    setLectures(data);
  } catch (err) {
    console.error('Failed to fetch lectures', err.message);
  } finally {
    setLecturesLoading(false);
  }
};

const dayLectures = useMemo(() => {
  return lectures.filter(l =>
    new Date(l.scheduled_at).toDateString() === selectedDay
  );
}, [lectures, selectedDay]);

const goToPrevWeek = () => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() - 7);
  setWeekStart(d);
};

const goToNextWeek = () => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7);
  setWeekStart(d);
};

const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', {
  hour: '2-digit', minute: '2-digit', hour12: true,
});

const SUBJECT_COLORS = {
  Physics: '#28388f',
  Chemistry: '#10B981',
  Mathematics: '#F59E0B',
  Biology: '#EF4444',
};







  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#2b58ed', '#1e3a8a']}
          style={styles.headerGradient}
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greetingText}>Good Morning,</Text>
               <Text style={styles.userNameText}>{userProfile?.student_name || 'Student'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Student</Text>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.inviteButton}>
                <Share2 size={18} color="#fff" />
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.notificationBell}>
                <Bell size={24} color="#fff" />
                {announcements.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{announcements.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Performance Card */}
          <View style={styles.performanceCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.glassBackground}
            />
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceTitle}>Overall Performance</Text>
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>Live Data</Text>
              </View>
            </View>
            
            <View style={styles.performanceData}>
              <View>
                <View style={styles.percentageRow}>
                  <Text style={styles.performancePercentage}>
                    {performance.average == null ? 'N/A' : `${performance.average}%`}
                  </Text>
                  <TrendingUp size={20} color="#4ade80" style={styles.trendIcon} />
                </View>
                <Text style={styles.performanceLabel}>Average Score</Text>
              </View>
              
              <View style={styles.verticalDivider} />
              
              <View>
                <Text style={styles.rankValue}>{performance.rank ? `#${performance.rank}` : 'N/A'}</Text>
                <Text style={styles.performanceLabel}>Batch Rank</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {announcements.length > 0 && (
          <View style={styles.liveSection}>
            <Text style={styles.subTitle}>Announcements</Text>
            {announcements.map((announcement) => (
              <View key={announcement.id} style={styles.liveRow}>
                <View style={[styles.liveIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Megaphone size={19} color="#EA580C" />
                </View>
                <View style={styles.liveCopy}>
                  <Text style={styles.liveTitle}>{announcement.title}</Text>
                  <Text style={styles.liveMeta} numberOfLines={2}>{announcement.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {upcomingLectures.length > 0 && (
          <View style={styles.liveSection}>
            <Text style={styles.subTitle}>Upcoming Lectures</Text>
            {upcomingLectures.map((lecture) => (
              <View key={lecture.id} style={styles.liveRow}>
                <View style={[styles.liveIcon, { backgroundColor: '#EFF6FF' }]}>
                  <CalendarClock size={19} color="#2563EB" />
                </View>
                <View style={styles.liveCopy}>
                  <Text style={styles.liveTitle}>{lecture.subject}{lecture.topic ? ` · ${lecture.topic}` : ''}</Text>
                  <Text style={styles.liveMeta}>
                    {new Date(lecture.scheduledAt).toLocaleString()} · {lecture.durationMins} min
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Today's Homework Card */}

        <View style={styles.homeworkCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#f5f3ff' }]}>
              <ClipboardCheck size={24} color="#7c3aed" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Today's Homework</Text>
              <Text style={styles.pendingText}>{pendingHomework.length} Pending</Text>
            </View>
          </View>
          
          <View style={styles.homeworkList}>
            {homework.slice(0, 4).map((item) => {
              const completed = ['submitted', 'reviewed'].includes(item.submission_status);
              const StatusIcon = completed ? CheckCircle2 : AlertCircle;
              return (
                <View key={item.id} style={styles.homeworkItem}>
                  <StatusIcon size={20} color={completed ? '#10b981' : '#f97316'} />
                  <View style={styles.homeworkCopy}>
                    <Text style={styles.homeworkItemText}>{item.subject} - {item.title}</Text>
                    <Text style={styles.homeworkMeta}>
                      Due {new Date(item.due_at).toLocaleString()} · {item.submission_status || 'pending'}
                    </Text>
                  </View>
                </View>
              );
            })}
            {homework.length === 0 && (
              <Text style={styles.emptyText}>No homework has been assigned yet.</Text>
            )}
          </View>
        </View>

        {/* Live Performance Analysis */}
        <View style={styles.analysisCard}>
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisTitle}>Academic Performance</Text>
            <View style={styles.aiBadge}>
              <Zap size={12} color="#fff" fill="#fff" />
              <Text style={styles.aiBadgeText}>Live Results</Text>
            </View>
          </View>
          
          <View style={styles.analysisRow}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Published Tests</Text>
              <Text style={styles.analysisValue}>{results.length}</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Average Score</Text>
              <Text style={styles.analysisValue}>
                {performance.average == null ? 'N/A' : `${performance.average}%`}
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Timetable */}
<View style={{ height: 420, marginBottom: 24 }}>
  <WeeklyTimetable
    lectures={lectures}
    weekStart={weekStart}
    onPrevWeek={goToPrevWeek}
    onNextWeek={goToNextWeek}
    loading={lecturesLoading} 
    onLecturePress={(l) => console.log(l)}
  />
</View>

        <TouchableOpacity
          style={styles.attendanceBtn}
          onPress={() => navigation.navigate('AttendanceScreen', { sdcId: userProfile?.sdcId, studentName: userProfile?.student_name })}
        >
          <Text style={styles.attendanceBtnText}>View Attendance</Text>
        </TouchableOpacity>


        {/* Weak Topics */}
        <View style={styles.topicsSection}>
          <Text style={styles.subTitle}>Weak Topics</Text>
          <View style={styles.topicItem}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.topicText}>Integration</Text>
          </View>
          <View style={styles.topicItem}>
            <View style={[styles.dot, { backgroundColor: '#f97316' }]} />
            <Text style={styles.topicText}>Differential Equations</Text>
          </View>
        </View>

        {/* Recommended Practice */}
        <View style={styles.practiceSection}>
          <Text style={styles.subTitle}>Recommended Practice</Text>
          <TouchableOpacity style={styles.practiceItem}>
            <BookOpen size={20} color="#2b58ed" />
            <Text style={styles.practiceText}>10 Integration Questions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.practiceItem}>
            <PlayCircle size={20} color="#2b58ed" />
            <Text style={styles.practiceText}>Watch Lecture</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Footer padding for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2b58ed',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  performanceCard: {
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
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  liveTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  performanceData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  performancePercentage: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  trendIcon: {
    marginTop: 4,
  },
  performanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  rankValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -20,
  },
  liveSection: {
    marginBottom: 18,
  },
  liveRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  liveIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  liveCopy: { flex: 1 },
  liveTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  liveMeta: { color: '#64748B', fontSize: 12, marginTop: 3, lineHeight: 17 },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  homeworkCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  pendingText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
    marginTop: 2,
  },
  homeworkList: {
    gap: 12,
  },
  homeworkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
  },
  homeworkItemText: {
    fontSize: 14,
    color: '#475569',
  },
  homeworkCopy: {
    flex: 1,
  },
  homeworkMeta: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingVertical: 10,
  },
  analysisCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2b58ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analysisItem: {
    flex: 1,
  },
  analysisLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  topicsSection: {
    marginBottom: 24,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  topicText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  practiceSection: {
    marginBottom: 24,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  practiceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  timetableCard: {
  backgroundColor: '#fff',
  borderRadius: 24,
  padding: 20,
  marginBottom: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 3,
},
timetableHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
},
timetableTitle: {
  fontSize: 14,
  fontWeight: '700',
  color: '#1e293b',
},
weekNavBtn: {
  width: 32, height: 32, borderRadius: 16,
  backgroundColor: '#eff6ff',
  alignItems: 'center', justifyContent: 'center',
},
dayStrip: { marginBottom: 16 },
dayChip: {
  alignItems: 'center',
  paddingHorizontal: 12, paddingVertical: 8,
  borderRadius: 16,
  marginRight: 8,
  backgroundColor: '#f8fafc',
  minWidth: 48,
},
dayChipActive: { backgroundColor: '#2b58ed' },
dayChipLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
dayChipDate: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 2 },
dayChipLabelActive: { color: '#fff' },
dayDot: {
  width: 5, height: 5, borderRadius: 3,
  backgroundColor: '#2b58ed', marginTop: 4,
},
dayDotActive: { backgroundColor: '#fff' },
lectureItem: {
  flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderLeftWidth: 3,
  paddingLeft: 12, paddingVertical: 10,
  marginBottom: 10,
  backgroundColor: '#f8fafc',
  borderRadius: 10,
},
lectureLeft: { flex: 1 },
lectureSubject: { fontSize: 14, fontWeight: '700' },
lectureTopic: { fontSize: 12, color: '#475569', marginTop: 2 },
lectureTeacher: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
lectureRight: { alignItems: 'flex-end' },
lectureTime: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
lectureDuration: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
noLecturesText: {
  textAlign: 'center', color: '#94a3b8',
  fontSize: 13, paddingVertical: 20,
},
attendanceBtn: {
  backgroundColor: '#2b58ed', borderRadius: 16,
  padding: 16, alignItems: 'center', marginBottom: 20,
},
attendanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
