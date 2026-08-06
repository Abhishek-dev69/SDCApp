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
  },
});
