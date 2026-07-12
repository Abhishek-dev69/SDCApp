import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import { useUserSession } from '../../context/UserSessionContext';
import { apiRequest } from '../../services/api';

export default function ParentAttendanceScreen() {
  const { activeChild } = useUserSession();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);

  const fetchAttendance = async (studentSdcId) => {
    try {
      const data = await apiRequest(`/parent/child/${studentSdcId}/attendance`);
      setAttendanceData(data);
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeChild) {
      setLoading(true);
      fetchAttendance(activeChild.student_sdc_id);
    }
  }, [activeChild]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#28388f" />
      </View>
    );
  }

  if (!activeChild) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SafeAreaView edges={['top']}>
            <Text style={styles.headerTitle}>Attendance</Text>
          </SafeAreaView>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No child profile selected.</Text>
        </View>
      </View>
    );
  }

  const overall = attendanceData?.overall || 0;
  const totalClasses = attendanceData?.totalClasses || 0;
  const totalAttended = attendanceData?.totalAttended || 0;
  const absentCount = attendanceData?.absentCount || 0;
  const subjects = attendanceData?.subjects || [];
  const recentAbsences = attendanceData?.recentAbsences || [];

  // Simple assessment
  let statusText = 'Needs Improvement';
  let statusColor = '#ef4444';
  let statusBg = '#fef2f2';

  if (overall >= 90) {
    statusText = 'Excellent';
    statusColor = '#10b981';
    statusBg = '#ecfdf5';
  } else if (overall >= 75) {
    statusText = 'Good';
    statusColor = '#3b82f6';
    statusBg = '#eff6ff';
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerTitle}>Attendance</Text>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overall Attendance Card */}
        <View style={styles.overallCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Calendar size={32} color="#28388f" />
            </View>
            <View>
              <Text style={styles.overallValue}>{overall}%</Text>
              <Text style={styles.overallLabel}>Overall Attendance</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalAttended}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalClasses}</Text>
              <Text style={styles.statLabel}>Lectures</Text>
            </View>
          </View>
        </View>

        {/* Subject Breakdown Section */}
        <Text style={styles.sectionTitle}>Subject Breakdown</Text>
        
        <View style={styles.breakdownCard}>
          {subjects.length > 0 ? (
            subjects.map((sub, index) => {
              const pct = sub.total === 0 ? 0 : Math.round((sub.attended / sub.total) * 100);
              return (
                <View key={sub.subject}>
                  <BreakdownItem 
                    subject={sub.subject} 
                    percentage={`${pct}%`} 
                    present={sub.attended} 
                    total={sub.total} 
                  />
                  {index < subjects.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          ) : (
            <Text style={styles.noDataText}>No subject breakdown available.</Text>
          )}
        </View>

        {/* Recent Attendance Logs */}
        <Text style={styles.sectionTitle}>Recent Absences</Text>
        
        {recentAbsences.length > 0 ? (
          recentAbsences.map((abs, idx) => (
            <AbsenceItem 
              key={idx}
              date={abs.date ? new Date(abs.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} 
              reason="Unexcused" 
              subject={abs.subject} 
              topic={abs.topic}
            />
          ))
        ) : (
          <Text style={styles.noDataText}>No recent absences recorded. Doing great!</Text>
        )}
      </ScrollView>
    </View>
  );
}

function BreakdownItem({ subject, percentage, present, total }) {
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

function AbsenceItem({ date, reason, subject, topic }) {
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
      {topic && <Text style={styles.absenceTopic}>Topic: {topic}</Text>}
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 8,
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
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 2,
  },
  absenceTopic: {
    fontSize: 12,
    color: '#64748b',
  },
  noDataText: {
    textAlign: 'center',
    color: '#64748b',
    paddingVertical: 10,
  },
});
