import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiRequest } from '../../services/api.js'; 

const SUBJECT_COLORS = {
  Physics: '#28388f',
  Chemistry: '#10B981',
  Mathematics: '#F59E0B',
  Biology: '#EF4444',
};


function PercentBar({ pct, color }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function AttendanceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sdcId, studentName } = route.params || {};

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
  
      const res = await apiRequest(`/attendance?sdcId=${sdcId}`);
      setData(res);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const overallColor = data?.overall >= 75 ? '#10B981' : '#EF4444';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Attendance</Text>
          {studentName && <Text style={styles.headerSub}>{studentName}</Text>}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#2b58ed" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Overall */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Overall Attendance</Text>
            <Text style={[styles.heroPct, { color: overallColor }]}>{data.overall}%</Text>
            <Text style={styles.heroSub}>
              {data.overall >= 75 ? 'You meet the minimum requirement' : 'Below 75% — at risk'}
            </Text>
          </View>

          {/* Per Subject */}
          <Text style={styles.sectionTitle}>By Subject</Text>
          <View style={styles.card}>
            {data.subjects.map((s, i) => {
              const pct = Math.round((s.attended / s.total) * 100);
              const color = SUBJECT_COLORS[s.subject] || '#2b58ed';
              return (
                <View key={i} style={[styles.subjectRow, i < data.subjects.length - 1 && styles.subjectRowBorder]}>
                  <View style={styles.subjectLeft}>
                    <Text style={[styles.subjectName, { color }]}>{s.subject}</Text>
                    <Text style={styles.subjectCount}>{s.attended}/{s.total} classes</Text>
                  </View>
                  <View style={styles.subjectRight}>
                    <Text style={[styles.subjectPct, { color: pct >= 75 ? '#10B981' : '#EF4444' }]}>{pct}%</Text>
                    <PercentBar pct={pct} color={color} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Monthly Trend */}
          <Text style={styles.sectionTitle}>Monthly Trend</Text>
          <View style={[styles.card, styles.monthlyRow]}>
            {data.monthly.map((m, i) => (
              <View key={i} style={styles.monthItem}>
                <Text style={styles.monthPct}>{m.pct}%</Text>
                <View style={styles.monthBarTrack}>
                  <View style={[styles.monthBarFill, { height: `${m.pct}%`, backgroundColor: m.pct >= 75 ? '#2b58ed' : '#EF4444' }]} />
                </View>
                <Text style={styles.monthLabel}>{m.month}</Text>
              </View>
            ))}
          </View>

          {/* Recent Absences */}
          <Text style={styles.sectionTitle}>Recent Absences</Text>
          <View style={styles.card}>
            {data.recentAbsences.map((a, i) => {
              const color = SUBJECT_COLORS[a.subject] || '#2b58ed';
              const date = new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              return (
                <View key={i} style={[styles.absenceRow, i < data.recentAbsences.length - 1 && styles.subjectRowBorder]}>
                  <XCircle size={16} color="#EF4444" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.absenceSubject, { color }]}>{a.subject}</Text>
                    {a.topic && <Text style={styles.absenceTopic}>{a.topic}</Text>}
                  </View>
                  <Text style={styles.absenceDate}>{date}</Text>
                </View>
              );
            })}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
  scroll: { padding: 20 },
  heroCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  heroLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 8 },
  heroPct: { fontSize: 56, fontWeight: '800' },
  heroSub: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  subjectRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  subjectLeft: { flex: 1 },
  subjectName: { fontSize: 14, fontWeight: '700' },
  subjectCount: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  subjectRight: { alignItems: 'flex-end', width: 100 },
  subjectPct: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  barTrack: { width: 90, height: 6, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  monthlyRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  monthItem: { alignItems: 'center', flex: 1 },
  monthPct: { fontSize: 11, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  monthBarTrack: { width: 24, height: 70, backgroundColor: '#f1f5f9', borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  monthBarFill: { width: '100%', borderRadius: 8 },
  monthLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  absenceRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  absenceSubject: { fontSize: 13, fontWeight: '700' },
  absenceTopic: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  absenceDate: { fontSize: 12, color: '#64748b', fontWeight: '600' },
});
