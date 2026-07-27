import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const ATTENDANCE_OPTIONS = ['present', 'absent', 'late', 'excused'];

export default function LectureAttendanceScreen({ navigation, route }) {
  const lecture = route.params?.lecture;
  const readOnly = route.params?.readOnly === true;
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAttendance = useCallback(async () => {
    if (!lecture) return;
    setLoading(true);
    try {
      const [studentData, attendanceData] = await Promise.all([
        apiRequest(`/admin/students?batch=${lecture.batch_id}`),
        apiRequest(`/operations/attendance?lecture_id=${lecture.id}`),
      ]);
      const nextRecords = {};
      (Array.isArray(attendanceData) ? attendanceData : []).forEach((record) => {
        nextRecords[record.student_auth_id] = record.status;
        setSessionId(record.session_id);
      });
      setStudents(Array.isArray(studentData) ? studentData.filter((student) => student.authId) : []);
      setRecords(nextRecords);
    } catch (err) {
      Alert.alert('Unable to Load Attendance', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lecture]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const saveAttendance = async () => {
    const markedStudents = students.filter((student) => records[student.authId]);
    if (markedStudents.length !== students.length) {
      Alert.alert('Attendance Incomplete', 'Mark attendance for every student before saving.');
      return;
    }

    setSaving(true);
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const session = await apiRequest('/operations/attendance/sessions', {
          method: 'POST',
          body: {
            lectureId: lecture.id,
            batchId: lecture.batch_id,
            subject: lecture.subject,
            sessionDate: new Date(lecture.scheduled_at).toISOString().split('T')[0],
          },
        });
        activeSessionId = session.id;
        setSessionId(session.id);
      }

      await apiRequest(`/operations/attendance/sessions/${activeSessionId}/records`, {
        method: 'PUT',
        body: {
          records: students.map((student) => ({
            studentAuthId: student.authId,
            status: records[student.authId],
          })),
        },
      });
      Alert.alert('Attendance Saved', 'The attendance records were updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Unable to Save Attendance', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Lecture Attendance</Text>
          <Text style={styles.headerSubtitle}>
            {lecture?.subject} · {lecture?.batch_name}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#28388f" />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            {students.length === 0 ? (
              <Text style={styles.emptyText}>No linked students were found for this batch.</Text>
            ) : (
              students.map((student) => (
                <View key={student.authId} style={styles.studentRow}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentMeta}>
                      {student.rollNo ? `Roll ${student.rollNo}` : 'No roll number'}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.options}
                  >
                    {ATTENDANCE_OPTIONS.map((status) => {
                      const selected = records[student.authId] === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[styles.option, selected && styles.optionSelected]}
                          onPress={() => {
                            if (readOnly) return;
                            setRecords((current) => ({
                              ...current,
                              [student.authId]: status,
                            }));
                          }}
                          disabled={readOnly}
                        >
                          <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                            {status[0].toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))
            )}
          </ScrollView>
          {!readOnly && students.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveAttendance}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Attendance</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: { padding: 4, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 100 },
  emptyText: { textAlign: 'center', color: '#64748b', paddingVertical: 48 },
  studentRow: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  studentInfo: { marginBottom: 10 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  studentMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  options: { gap: 8 },
  option: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  optionSelected: { backgroundColor: '#28388f' },
  optionText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  optionTextSelected: { color: '#fff' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#28388f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
