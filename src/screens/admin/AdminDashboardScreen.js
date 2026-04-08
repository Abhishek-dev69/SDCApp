import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BarChart3, 
  Users, 
  Banknote, 
  Settings, 
  LayoutDashboard,
  Bell,
  TrendingUp,
  UserCheck,
  BookOpen,
  FileText,
  Plus,
  UserPlus,
  Megaphone,
  Star,
  ChevronRight
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const CORE_METRICS = [
  { id: '1', title: 'Total Students', value: '842', trend: '+12', icon: Users, color: '#3B82F6', trendColor: '#10B981' },
  { id: '2', title: 'Total Teachers', value: '24', trend: '+2', icon: UserCheck, color: '#10B981', trendColor: '#10B981' },
  { id: '3', title: 'Active Batches', value: '18', trend: '+3', icon: BookOpen, color: '#8B5CF6', trendColor: '#10B981' },
  { id: '4', title: 'Pending Reports', value: '7', trend: '-5', icon: FileText, color: '#F97316', trendColor: '#EF4444' },
];

const MANAGEMENT_ACTIONS = [
  { id: '1', title: 'Add Student', icon: Plus, color: '#3B82F6' },
  { id: '2', title: 'Add Teacher', icon: UserPlus, color: '#10B981' },
  { id: '3', title: 'Assign Batches', icon: BookOpen, color: '#8B5CF6' },
  { id: '4', title: 'Post Announcement', icon: Megaphone, color: '#F97316' },
];

const PERFORMANCE_METRICS = [
  { label: 'Average Student Score', value: '82.3%', progress: 0.823, color: '#3B82F6' },
  { label: 'Overall Attendance', value: '89.7%', progress: 0.897, color: '#10B981' },
  { label: 'Fee Collection Rate', value: '76%', progress: 0.76, color: '#F59E0B' },
];

const RECENT_STUDENTS = [
  { id: '1', name: 'Manasvi Gawli', class: 'Class 12th', batch: 'NEET A7', score: '94%', status: 'Active', color: '#3B82F6' },
  { id: '2', name: 'Aarav Patel', class: 'Class 11th', batch: 'JEE K8', score: '88%', status: 'Active', color: '#10B981' },
];

const TEACHERS = [
  { id: '1', name: 'Dr. Vivek Sharma', subject: 'Physics', students: '120', rating: '4.8', color: '#8B5CF6' },
  { id: '2', name: 'Prof. Anjali Roy', subject: 'Chemistry', students: '95', rating: '4.9', color: '#F97316' },
];

export default function AdminDashboardScreen({ navigation, route }) {
  const userRole = route?.params?.userRole || 'admin';
  const displayName = route?.params?.displayName || 'Admin';
  const roleBadgeText = userRole === 'owner'
    ? 'Owner View'
    : userRole === 'teacher'
      ? 'Teacher View'
      : 'Admin View';

  const handleAction = (id) => {
    switch(id) {
      case '1': navigation.navigate('AddStudent'); break;
      case '2': navigation.navigate('AddTeacher'); break;
      case '3': navigation.navigate('AssignBatch'); break;
      default: break;
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header & Revenue Banner */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#2b58ed', '#1e3a8a']}
          style={styles.headerGradient}
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greetingText}>Good Morning,</Text>
              <View style={styles.adminRow}>
                <Text style={styles.userNameText}>{displayName}</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>{roleBadgeText}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.notificationBell}>
              <Bell size={24} color="#fff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>5</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Revenue Card */}
          <View style={styles.revenueCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.glassBackground}
            />
            <View style={styles.revenueHeader}>
              <Text style={styles.revenueTitle}>Total Revenue (This Month)</Text>
              <View style={styles.trendRow}>
                <TrendingUp size={16} color="#4ade80" />
                <Text style={styles.trendText}>+18% from last month</Text>
              </View>
            </View>
            <Text style={styles.revenueValue}>₹12,45,000</Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.content}>
        {/* Core Metrics Grid */}
        <View style={styles.metricsGrid}>
          {CORE_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <View key={metric.id} style={styles.metricCard}>
                <View style={[styles.iconContainer, { backgroundColor: `${metric.color}15` }]}>
                  <Icon size={24} color={metric.color} />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>{metric.title}</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <View style={[styles.badge, { backgroundColor: `${metric.trendColor}15` }]}>
                      <Text style={[styles.badgeText, { color: metric.trendColor }]}>{metric.trend}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Management</Text>
          <View style={styles.managementGrid}>
            {MANAGEMENT_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity 
                  key={action.id} 
                  style={styles.managementCard}
                  onPress={() => handleAction(action.id)}
                >
                  <View style={[styles.managementIconContainer, { backgroundColor: `${action.color}10` }]}>
                    <Icon size={28} color={action.color} />
                  </View>
                  <Text style={styles.managementLabel}>{action.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Performance Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Analytics</Text>
          <View style={styles.analyticsCard}>
            {PERFORMANCE_METRICS.map((metric, index) => (
              <View key={index} style={styles.analyticsItem}>
                <View style={styles.analyticsLabelRow}>
                  <Text style={styles.analyticsLabel}>{metric.label}</Text>
                  <Text style={[styles.analyticsValue, { color: metric.color }]}>{metric.value}</Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${metric.progress * 100}%`, backgroundColor: metric.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Students */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Students</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {RECENT_STUDENTS.map((student) => (
            <TouchableOpacity key={student.id} style={styles.studentCard}>
              <View style={[styles.avatar, { backgroundColor: `${student.color}15` }]}>
                <Text style={[styles.avatarText, { color: student.color }]}>{student.name.charAt(0)}</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{student.class}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{student.batch}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.studentRight}>
                <Text style={styles.studentScore}>{student.score}</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{student.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Teacher Performance */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Teacher Performance</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {TEACHERS.map((teacher) => (
            <TouchableOpacity key={teacher.id} style={styles.teacherCard}>
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{teacher.name}</Text>
                <View style={styles.teacherSubInfo}>
                  <View style={styles.subjectTag}>
                    <Text style={styles.subjectTagText}>{teacher.subject}</Text>
                  </View>
                  <Text style={styles.studentCount}>{teacher.students} Students</Text>
                </View>
              </View>
              <View style={styles.teacherRight}>
                <View style={styles.ratingBox}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>{teacher.rating}</Text>
                </View>
                <ChevronRight size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  userNameText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
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
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
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
  revenueCard: {
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
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  revenueTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  revenueValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    width: (width - 64) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  managementCard: {
    width: (width - 64) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  managementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  managementLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  analyticsItem: {
    marginBottom: 20,
  },
  analyticsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2b58ed',
    fontWeight: '600',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  studentRight: {
    alignItems: 'flex-end',
  },
  studentScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: 'bold',
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  teacherSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectTagText: {
    fontSize: 10,
    color: '#4338CA',
    fontWeight: '600',
  },
  studentCount: {
    fontSize: 12,
    color: '#64748B',
  },
  teacherRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
  },
});
