import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ChevronRight, CheckCircle2, XCircle } from 'lucide-react-native';

export default function ParentAttendanceScreen() {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerTitle}>Attendance</Text>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Overall Attendance Card */}
        <View style={styles.overallCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Calendar size={32} color="#28388f" />
            </View>
            <View>
              <Text style={styles.overallValue}>92%</Text>
              <Text style={styles.overallLabel}>Overall Attendance</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Excellent</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>142</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>04</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
          </View>
        </View>

        {/* Subject Breakdown Section */}
        <Text style={styles.sectionTitle}>Subject Breakdown</Text>
        
        <View style={styles.breakdownCard}>
          <BreakdownItem subject="Physics" percentage="95%" present={48} total={50} status="on-track" />
          <View style={styles.divider} />
          <BreakdownItem subject="Chemistry" percentage="90%" present={45} total={50} status="on-track" />
          <View style={styles.divider} />
          <BreakdownItem subject="Mathematics" percentage="91%" present={55} total={60} status="on-track" />
        </View>

        {/* Recent Attendance Logs */}
        <Text style={styles.sectionTitle}>Recent Absences</Text>
        <AbsenceItem date="Feb 22, 2026" reason="Medical Leave" subject="Chemistry, Math" />
        <AbsenceItem date="Feb 10, 2026" reason="Family Event" subject="Physics, Chemistry" />
      </ScrollView>
    </View>
  );
}

function BreakdownItem({ subject, percentage, present, total, status }) {
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.subjectName}>{subject}</Text>
        <Text style={styles.percentageText}>{percentage}</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: percentage }]} />
      </View>
      <Text style={styles.itemFooter}>{present} of {total} lectures attended</Text>
    </View>
  );
}

function AbsenceItem({ date, reason, subject }) {
  return (
    <View style={styles.absenceItem}>
      <View style={styles.absenceHeader}>
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>{date}</Text>
        </View>
        <View style={styles.reasonBadge}>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>
      </View>
      <Text style={styles.absenceSubject}>Missed: {subject}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#28388f',
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    paddingTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  overallCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  overallValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  overallLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    marginLeft: 'auto',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  breakdownItem: {
    paddingVertical: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28388f',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#28388f',
    borderRadius: 4,
  },
  itemFooter: {
    fontSize: 12,
    color: '#94a3b8',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  absenceItem: {
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
  absenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  reasonBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  absenceSubject: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});
