import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { Modal, FlatList } from 'react-native';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

const SUBJECT_COLORS = {
  Physics: '#28388f',
  Chemistry: '#10B981',
  Mathematics: '#F59E0B',
  Biology: '#EF4444',
};

export default function AddLectureScreen({ navigation, route }) {
  const existingLecture = route.params?.lecture || route.params?.reschedule || null;
  const isEdit = !!route.params?.lecture;
  const isReschedule = !!route.params?.reschedule;
  const batches = route.params?.batches || [];

  const initialDate = existingLecture
    ? new Date(existingLecture.scheduled_at)
    : new Date();

  const [subject, setSubject] = useState(existingLecture?.subject || null);
  const [topic, setTopic] = useState(existingLecture?.topic || '');
  const [teacherName, setTeacherName] = useState(existingLecture?.teacher_name || '');
  const [selectedBatchId, setSelectedBatchId] = useState(existingLecture?.batch_id || null);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialDate);
  const [durationMins, setDurationMins] = useState(existingLecture?.duration_mins || 60);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  
  const filteredBatches = useMemo(() =>
  batches.filter(b =>
    b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
    (b.location || '').toLowerCase().includes(batchSearch.toLowerCase())
  ), [batches, batchSearch]);


  const screenTitle = isEdit ? 'Edit Lecture' : isReschedule ? 'Reschedule Lecture' : 'New Lecture';

  const formatDate = (d) => d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const formatTime = (d) => d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const handleDurationChange = (delta) => {
    setDurationMins(prev => Math.min(180, Math.max(5, prev + delta)));
  };

  const buildScheduledAt = () => {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined.toISOString();
  };

  const handleSubmit = async () => {
    if (!subject) return Alert.alert('Missing Field', 'Please select a subject.');
    if (!selectedBatchId) return Alert.alert('Missing Field', 'Please select a batch.');
    const scheduledAt = new Date(buildScheduledAt());
    const now = new Date();
    if (scheduledAt < now) {
    return Alert.alert('Invalid Time', 'Lecture must be scheduled for a future date and time.');
    }

    const payload = {
      batch_id: selectedBatchId,
      subject,
      topic: topic || undefined,
      teacher_name: teacherName || undefined,
      scheduled_at: buildScheduledAt(),
      duration_mins: durationMins,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await apiRequest(`/admin/lectures/${existingLecture.id}`, {
          method: 'PATCH',
          body: payload,
        });
        Alert.alert('Success', 'Lecture updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await apiRequest('/admin/lectures', {
          method: 'POST',
          body: payload,
        });
        Alert.alert('Success', isReschedule ? 'Lecture rescheduled.' : 'Lecture created.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

        {/* Subject */}
        <Text style={styles.label}>Subject</Text>
        <View style={styles.chipRow}>
          {SUBJECTS.map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.subjectChip,
                subject === s && { backgroundColor: SUBJECT_COLORS[s] },
              ]}
              onPress={() => setSubject(s)}
            >
              <Text style={[styles.subjectChipText, subject === s && { color: '#fff' }]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
          {/* Batch */}
        <Text style={styles.label}>Batch</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setBatchModalOpen(true)}>
        <Text style={[styles.dropdownText, !selectedBatch && { color: '#94a3b8' }]}>
            {selectedBatch ? `${selectedBatch.name} — ${selectedBatch.location}` : 'Select a batch'}
        </Text>
        <ChevronDown size={16} color="#64748b" />
        </TouchableOpacity>

        <Modal visible={batchModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Batch</Text>
            <TextInput
                style={styles.modalSearch}
                placeholder="Search by name or location..."
                placeholderTextColor="#94a3b8"
                value={batchSearch}
                onChangeText={setBatchSearch}
                autoFocus
            />
            <FlatList
                data={filteredBatches}
                keyExtractor={b => b.id.toString()}
                renderItem={({ item: b }) => (
                <TouchableOpacity
                    style={[styles.dropdownItem, selectedBatchId === b.id && styles.dropdownItemActive]}
                    onPress={() => {
                    setSelectedBatchId(b.id);
                    setBatchModalOpen(false);
                    setBatchSearch('');
                    }}
                >
                    <Text style={[styles.dropdownItemText, selectedBatchId === b.id && styles.dropdownItemTextActive]}>
                    {b.name}
                    </Text>
                    {b.location && <Text style={styles.dropdownItemSub}>{b.location}</Text>}
                </TouchableOpacity>
                )}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setBatchModalOpen(false); setBatchSearch(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            </View>
        </View>
        </Modal>
        {/* Topic */}
        <Text style={styles.label}>Topic <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.input}
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. Newton's Laws of Motion"
          placeholderTextColor="#94a3b8"
        />

        {/* Teacher */}
        <Text style={styles.label}>Teacher Name <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.input}
          value={teacherName}
          onChangeText={setTeacherName}
          placeholder="e.g. Suresh Dani"
          placeholderTextColor="#94a3b8"
        />

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.pickerRow} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.pickerText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, selected) => {
              setShowDatePicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        {/* Time */}
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.pickerRow} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.pickerText}>{formatTime(time)}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour={false}
            onChange={(e, selected) => {
              setShowTimePicker(false);
              if (selected) setTime(selected);
            }}
          />
        )}

        {/* Duration */}
        <Text style={styles.label}>Duration</Text>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => handleDurationChange(-5)}>
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>
            {Math.floor(durationMins / 60) > 0 ? `${Math.floor(durationMins / 60)}h ` : ''}{durationMins % 60 > 0 ? `${durationMins % 60}m` : ''}
            </Text>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => handleDurationChange(5)}>
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>
                {isEdit ? 'Save Changes' : isReschedule ? 'Reschedule' : 'Create Lecture'}
              </Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  form: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 20 },
  optional: { fontWeight: '400', color: '#94a3b8' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f1f5f9',
  },
  subjectChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  dropdownText: { fontSize: 14, color: '#1e293b' },
  
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: '#e8eaf6' },
  dropdownItemText: { fontSize: 14, color: '#1e293b' },
  dropdownItemTextActive: { color: '#28388f', fontWeight: '700' },
  dropdownItemSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1e293b',
  },
  pickerRow: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerText: { fontSize: 14, color: '#1e293b' },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, alignSelf: 'flex-start', overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#f1f5f9',
  },
  stepperBtnText: { fontSize: 20, color: '#1e293b', fontWeight: '600' },
    stepperValue: { 
    width: 80, 
    textAlign: 'center',
    fontSize: 15, fontWeight: '700', color: '#1e293b' 
    },
  submitBtn: {
    backgroundColor: '#28388f', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 32,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalOverlay: {
  flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'flex-end',
},
modalSheet: {
  backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
  padding: 20, maxHeight: '70%',
},
modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
modalSearch: {
  backgroundColor: '#f1f5f9', borderRadius: 10,
  paddingHorizontal: 14, paddingVertical: 10,
  fontSize: 14, color: '#1e293b', marginBottom: 12,
},
modalCancel: {
  marginTop: 12, alignItems: 'center', paddingVertical: 12,
  borderTopWidth: 1, borderTopColor: '#f1f5f9',
},
modalCancelText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
});