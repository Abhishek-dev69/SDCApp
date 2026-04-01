import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Calendar, 
  FileText, 
  Banknote, 
  TrendingUp, 
  Bell, 
  ChevronRight,
  AlertCircle
} from 'lucide-react-native';

export default function ParentDashboardScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={['#2b58ed', '#1e3a8a']}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greetingText}>Good Morning,</Text>
                <Text style={styles.userNameText}>Neha Patel</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>Parent</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.inviteButton}>
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.notificationButton}>
                  <Bell size={24} color="#fff" />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Child Summary Card */}
            <View style={styles.childCard}>
              <View style={styles.childHeader}>
                <View style={styles.childAvatar}>
                  <Users size={24} color="#28388f" />
                </View>
                <View>
                  <Text style={styles.childName}>Aarav Patel</Text>
                  <Text style={styles.childInfo}>12th • JEE Batch A1</Text>
                </View>
                <TouchableOpacity style={styles.switchButton}>
                  <ChevronRight size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <MetricCard 
              title="Attendance" 
              value="92%" 
              icon={Calendar} 
              color="#10b981" 
              bgColor="#ecfdf5" 
            />
            <MetricCard 
              title="Upcoming Tests" 
              value="3" 
              icon={FileText} 
              color="#3b82f6" 
              bgColor="#eff6ff" 
            />
            <MetricCard 
              title="Fee Status" 
              value="Due" 
              icon={Banknote} 
              color="#ef4444" 
              bgColor="#fef2f2" 
            />
            <MetricCard 
              title="Performance" 
              value="85%" 
              icon={TrendingUp} 
              color="#8b5cf6" 
              bgColor="#f5f3ff" 
            />
          </View>

          {/* Fee Payment Alert */}
          <TouchableOpacity style={styles.feeAlertCard}>
            <View style={[styles.alertIconBox, { backgroundColor: '#fee2e2' }]}>
              <AlertCircle size={24} color="#ef4444" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Fee Payment Due</Text>
              <Text style={styles.alertDescription}>
                Quarterly fees of ₹12,000 due by March 15, 2026
              </Text>
            </View>
            <TouchableOpacity style={styles.payNowButton}>
              <Text style={styles.payNowText}>Pay Now</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Recent Results Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Test Results</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ResultItem 
            subject="Physics Unit Test 3" 
            score="42/50" 
            rank="#12" 
            date="Feb 24, 2026" 
          />
          <ResultItem 
            subject="Chemistry Weekly Quiz" 
            score="22/25" 
            rank="#05" 
            date="Feb 20, 2026" 
          />
        </View>
      </ScrollView>
    </View>
  );
}

function MetricCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconBox, { backgroundColor: bgColor }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
}

function ResultItem({ subject, score, rank, date }) {
  return (
    <View style={styles.resultItem}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultSubject}>{subject}</Text>
        <Text style={styles.resultDate}>{date}</Text>
      </View>
      <View style={styles.resultFooter}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
          <Text style={styles.rankLabel}> Rank</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 25,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#2b58ed',
  },
  childCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  childInfo: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  switchButton: {
    marginLeft: 'auto',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metricTitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  feeAlertCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 24,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  alertIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b91c1c',
  },
  alertDescription: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  },
  payNowButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payNowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2b58ed',
    fontWeight: '600',
  },
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2b58ed',
  },
  rankLabel: {
    fontSize: 12,
    color: '#64748b',
  },
});
