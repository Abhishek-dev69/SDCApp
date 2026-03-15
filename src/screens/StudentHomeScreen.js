import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  Share2, 
  TrendingUp, 
  ClipboardCheck, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  BookOpen,
  PlayCircle
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function StudentHomeScreen() {
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
              <Text style={styles.userNameText}>Aarav Patel</Text>
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
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View>
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
                  <Text style={styles.performancePercentage}>85.4%</Text>
                  <TrendingUp size={20} color="#4ade80" style={styles.trendIcon} />
                </View>
                <Text style={styles.performanceLabel}>Average Score</Text>
              </View>
              
              <View style={styles.verticalDivider} />
              
              <View>
                <Text style={styles.rankValue}>#12</Text>
                <Text style={styles.performanceLabel}>Batch Rank</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Today's Homework Card */}

        <View style={styles.homeworkCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#f5f3ff' }]}>
              <ClipboardCheck size={24} color="#7c3aed" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Today's Homework</Text>
              <Text style={styles.pendingText}>2 Pending</Text>
            </View>
          </View>
          
          <View style={styles.homeworkList}>
            <View style={styles.homeworkItem}>
              <CheckCircle2 size={20} color="#10b981" />
              <Text style={styles.homeworkItemText}>Physics - Complete Chapter 3</Text>
            </View>
            <View style={styles.homeworkItem}>
              <AlertCircle size={20} color="#f97316" />
              <Text style={styles.homeworkItemText}>Math - 10 Problems</Text>
            </View>
          </View>
        </View>

        {/* Math Performance Analysis */}
        <View style={styles.analysisCard}>
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisTitle}>Math Performance Analysis</Text>
            <View style={styles.aiBadge}>
              <Zap size={12} color="#fff" fill="#fff" />
              <Text style={styles.aiBadgeText}>AI Powered</Text>
            </View>
          </View>
          
          <View style={styles.analysisRow}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Accuracy</Text>
              <Text style={styles.analysisValue}>72%</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Speed</Text>
              <Text style={styles.analysisValue}>Medium</Text>
            </View>
          </View>
        </View>

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
});
