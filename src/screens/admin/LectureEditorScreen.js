import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

function toInputDate(value) {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16).replace('T', ' ');
}

function parseScheduledAt(value) {
  const normalized = String(value || '').trim().replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export default function LectureEditorScreen({ navigation, route }) {
  const existingLecture = route.params?.lecture;
  const reschedule = route.params?.reschedule === true;
  const batches = Array.isArray(route.params?.batches) ? route.params.batches : [];
  const initialBatchId = existingLecture?.batch_id || batches[0]?.id || null;
  const [form, setForm] = useState({
    batchId: initialBatchId,
    subject: existingLecture?.subject || '',
    topic: existingLecture?.topic || '',
    teacherName: existingLecture?.teacher_name || '',
    scheduledAt: toInputDate(reschedule ? null : existingLecture?.scheduled_at),
    durationMins: String(existingLecture?.duration_mins || 60),
    notes: existingLecture?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const selectedBatch = useMemo(
    () => batches.find((batch) => Number(batch.id) === Number(form.batchId)),
    [batches, form.batchId]
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveLecture = async () => {
    const scheduledAt = parseScheduledAt(form.scheduledAt);
    const durationMins = Number(form.durationMins);
    if (!form.batchId || !form.subject.trim() || !scheduledAt || durationMins <= 0) {
      Alert.alert(
        'Check Lecture Details',
        'Select a batch and enter a subject, valid date/time, and positive duration.'
      );
      return;
    }

    const body = {
      batchId: Number(form.batchId),
      subject: form.subject.trim(),
      topic: form.topic.trim() || null,
      teacherName: form.teacherName.trim() || null,
      scheduledAt,
      durationMins,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    try {
      const isEditing = existingLecture && !reschedule;
      await apiRequest(
        isEditing ? `/admin/lectures/${existingLecture.id}` : '/admin/lectures',
        {
          method: isEditing ? 'PATCH' : 'POST',
          body,
        }
      );
      Alert.alert(
        isEditing ? 'Lecture Updated' : 'Lecture Scheduled',
        `${body.subject} is saved for ${selectedBatch?.name || 'the selected batch'}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Unable to Save Lecture', err.message || 'Please try again.');
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
        <Text style={styles.headerTitle}>
          {existingLecture && !reschedule ? 'Edit Lecture' : 'Schedule Lecture'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Batch</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.batchList}
          >
            {batches.map((batch) => {
              const selected = Number(form.batchId) === Number(batch.id);
              return (
                <TouchableOpacity
                  key={batch.id}
                  style={[styles.batchChip, selected && styles.batchChipSelected]}
                  onPress={() => updateField('batchId', batch.id)}
                >
                  <Text style={[styles.batchChipText, selected && styles.batchChipTextSelected]}>
                    {batch.name} · {batch.location}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Field
            label="Subject"
            value={form.subject}
            onChangeText={(value) => updateField('subject', value)}
            placeholder="Physics"
          />
          <Field
            label="Topic"
            value={form.topic}
            onChangeText={(value) => updateField('topic', value)}
            placeholder="Current electricity"
          />
          <Field
            label="Teacher"
            value={form.teacherName}
            onChangeText={(value) => updateField('teacherName', value)}
            placeholder="Teacher name"
          />
          <Field
            label="Date and time"
            value={form.scheduledAt}
            onChangeText={(value) => updateField('scheduledAt', value)}
            placeholder="2026-06-15 10:30"
            autoCapitalize="none"
          />
          <Text style={styles.hint}>Use format YYYY-MM-DD HH:MM</Text>
          <Field
            label="Duration (minutes)"
            value={form.durationMins}
            onChangeText={(value) => updateField('durationMins', value)}
            placeholder="60"
            keyboardType="number-pad"
          />
          <Field
            label="Notes"
            value={form.notes}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Optional lecture notes"
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveLecture} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {existingLecture && !reschedule ? 'Save Changes' : 'Schedule Lecture'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, multiline = false, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
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
  content: { padding: 20, paddingBottom: 48 },
  field: { marginTop: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  multilineInput: { minHeight: 88, textAlignVertical: 'top' },
  hint: { color: '#94a3b8', fontSize: 11, marginTop: 5 },
  batchList: { gap: 8, paddingRight: 20 },
  batchChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  batchChipSelected: { backgroundColor: '#28388f', borderColor: '#28388f' },
  batchChipText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  batchChipTextSelected: { color: '#fff' },
  saveButton: {
    backgroundColor: '#28388f',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
