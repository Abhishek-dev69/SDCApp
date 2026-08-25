import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ChevronLeft, ChevronDown, Users, Upload, CheckCircle2, RefreshCw,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

// Same subject palette used across the app (student TestsScreen, AddLectureScreen).
const SUBJECT_COLORS = {
  Physics: '#28388f',
  Chemistry: '#10B981',
  Mathematics: '#F59E0B',
  Biology: '#EF4444',
};
const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const TYPES = ['test', 'assignment'];

export default function TeacherTestFormScreen({ navigation, route }) {
  const existingTest = route.params?.test || null;
  const isEdit = !!existingTest;

  const initialDue = existingTest?.due_at ? new Date(existingTest.due_at) : new Date();

  const [type, setType] = useState(existingTest?.type || 'test'); // fixed once the test exists (backend doesn't accept type on edit)
  const [title, setTitle] = useState(existingTest?.title || '');
  const [subject, setSubject] = useState(existingTest?.subject || SUBJECTS[0]);
  const [totalMarks, setTotalMarks] = useState(
    existingTest?.total_marks != null ? String(existingTest.total_marks) : ''
  );
  const [dueDate, setDueDate] = useState(initialDue);
  const [dueTime, setDueTime] = useState(initialDue);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [batches, setBatches] = useState([]);
  const [batchIds, setBatchIds] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null); // null = all branches
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const [questionFileName, setQuestionFileName] = useState('');
  const [questionGcsPath, setQuestionGcsPath] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchesError, setBatchesError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Same endpoint admin's timetable screen uses to populate its batch filter
  // (AdminTimetableScreen -> loadBatches -> GET /admin/lectures/batches).
  // It's allowed for teacher/admin/owner and scopes results to the batches
  // assigned to the calling teacher.
  const loadBatches = useCallback(async () => {
    console.log('[TestForm] loadBatches: requesting GET /admin/lectures/batches');
    setLoadingBatches(true);
    setBatchesError(null);
    try {
      const data = await apiRequest('/admin/lectures/batches');
      console.log('[TestForm] loadBatches: raw response =', JSON.stringify(data));
      console.log('[TestForm] loadBatches: isArray =', Array.isArray(data), 'length =', Array.isArray(data) ? data.length : 'n/a');
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[TestForm] loadBatches: FAILED', err.message, err);
      setBatchesError(err.message || 'Failed to fetch batches');
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    console.log('[TestForm] batches state updated, count =', batches.length, batches);
  }, [batches]);

  // Branches (locations) present across all batches — same grouping
  // AdminTimetableScreen uses for its location filter.
  const locations = useMemo(() => {
    const result = [...new Set(batches.map((b) => b.location).filter(Boolean))].sort();
    console.log('[TestForm] locations computed:', result);
    return result;
  }, [batches]);

  const visibleBatches = useMemo(() => {
    const result = batches.filter((b) => !selectedLocation || b.location === selectedLocation);
    console.log('[TestForm] visibleBatches computed, selectedLocation =', selectedLocation, 'count =', result.length, result);
    return result;
  }, [batches, selectedLocation]);

  const toggleBatch = (batchId) => {
    console.log('[TestForm] toggleBatch called with id =', batchId);
    setBatchIds((prev) => {
      const next = prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId];
      console.log('[TestForm] batchIds now =', next);
      return next;
    });
  };

  const buildDueAt = () => {
    const combined = new Date(dueDate);
    combined.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0);
    return combined.toISOString();
  };

  // Browse for a PDF/image on the device, then run the real 3-step upload:
  // 1) ask the backend for a signed GCS write URL (POST /tests/upload-url)
  // 2) PUT the actual file bytes straight to that URL (GCS, not our server)
  // 3) keep the returned gcsPath — it's what gets saved on the test row via
  //    POST/PATCH /tests, which is what students later query.
  const handleBrowseFile = async () => {
    let picked;
    try {
      picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
    } catch (err) {
      console.error('document picker error', err.message);
      Alert.alert('Could not open file browser', err.message || 'Please try again.');
      return;
    }

    if (picked.canceled || !picked.assets?.length) return;
    const asset = picked.assets[0];
    const contentType = asset.mimeType || 'application/pdf';

    setUploadingFile(true);
    try {
      const { uploadUrl, gcsPath } = await apiRequest('/tests/upload-url', {
        method: 'POST',
        body: { filename: asset.name, contentType },
      });

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': contentType },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload to storage failed (status ${uploadResult.status})`);
      }

      setQuestionFileName(asset.name);
      setQuestionGcsPath(gcsPath || '');
    } catch (err) {
      console.error('file upload error', err.message);
      Alert.alert('Upload failed', err.message || 'Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleChangeFile = () => {
    setQuestionFileName('');
    setQuestionGcsPath('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Missing field', 'Please enter a title.');
    if (!isEdit && !questionGcsPath.trim()) {
      return Alert.alert('Missing field', 'Please upload the question paper first.');
    }
    if (!isEdit && batchIds.length === 0) {
      return Alert.alert('Missing field', 'Please select at least one batch.');
    }

    setSaving(true);
    try {
      if (isEdit) {
        const payload = {
          title: title.trim(),
          subject,
          totalMarks: type === 'test' && totalMarks ? Number(totalMarks) : undefined,
          dueAt: buildDueAt(),
        };
        // Only touch batch assignments if the teacher actively picked new
        // ones here — the list endpoint doesn't return current assignments,
        // so leaving this empty means "don't change who it's assigned to".
        if (batchIds.length > 0) payload.batchIds = batchIds;
        if (questionGcsPath.trim()) payload.questionGcsPath = questionGcsPath.trim();

        await apiRequest(`/tests/${existingTest.id}`, { method: 'PATCH', body: payload });
        Alert.alert('Saved', 'Your changes were saved.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await apiRequest('/tests', {
          method: 'POST',
          body: {
            type,
            title: title.trim(),
            subject,
            totalMarks: type === 'test' && totalMarks ? Number(totalMarks) : undefined,
            dueAt: buildDueAt(),
            questionGcsPath: questionGcsPath.trim(),
            batchIds,
          },
        });
        Alert.alert('Created', 'Test saved as a draft. Publish it from the list when ready.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      console.error('save test error', err.message);
      Alert.alert('Could not save', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Test' : 'New Test / Assignment'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Type — fixed once the test exists, editable while creating */}
        <Text style={styles.label}>Type</Text>
        {isEdit ? (
          <View style={styles.typeChip}>
            <Text style={styles.typeChipText}>{type === 'assignment' ? 'Assignment' : 'Test'}</Text>
          </View>
        ) : (
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                  {t === 'assignment' ? 'Assignment' : 'Test'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Title */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Unit Test 1"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
        />

        {/* Subject */}
        <Text style={styles.label}>Subject</Text>
        <View style={styles.chipRow}>
          {SUBJECTS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.subjectChip, subject === s && { backgroundColor: SUBJECT_COLORS[s] }]}
              onPress={() => setSubject(s)}
            >
              <Text style={[styles.subjectChipText, subject === s && { color: '#fff' }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Batches — branch filter + batch chips, same pattern as AdminTimetableScreen's
            location dropdown and batch chip row. Multi-select since a test can be
            assigned to more than one batch. */}
        <Text style={styles.label}>Assign to Batch</Text>
        {loadingBatches ? (
          <ActivityIndicator color="#28388f" style={{ marginTop: 8 }} />
        ) : batchesError ? (
          <View>
            <Text style={[styles.hint, { color: '#DC2626' }]}>Could not load batches: {batchesError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadBatches}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : batches.length === 0 ? (
          <Text style={styles.hint}>No batches found. Ask an admin to add one first.</Text>
        ) : (
          <>
            {isEdit && (
              <Text style={styles.hint}>
                Leave this untouched to keep the current batches. Only pick batches here if you want to change who this is assigned to.
              </Text>
            )}

            {locations.length > 0 && (
              <View style={styles.locationRow}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setLocationDropdownOpen((open) => !open)}
                >
                  <Text style={styles.dropdownText}>{selectedLocation || 'All branches'}</Text>
                  <ChevronDown size={16} color="#64748b" />
                </TouchableOpacity>

                {locationDropdownOpen && (
                  <View style={styles.locationMenu}>
                    <TouchableOpacity
                      style={[styles.dropdownItem, !selectedLocation && styles.dropdownItemActive]}
                      onPress={() => { setSelectedLocation(null); setLocationDropdownOpen(false); }}
                    >
                      <Text style={[styles.dropdownItemText, !selectedLocation && styles.dropdownItemTextActive]}>
                        All branches
                      </Text>
                    </TouchableOpacity>
                    {locations.map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.dropdownItem, selectedLocation === loc && styles.dropdownItemActive]}
                        onPress={() => { setSelectedLocation(loc); setLocationDropdownOpen(false); }}
                      >
                        <Text style={[styles.dropdownItemText, selectedLocation === loc && styles.dropdownItemTextActive]}>
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={[styles.chipRow, { marginTop: 10 }]}>
              {visibleBatches.map((b) => {
                const selected = batchIds.includes(b.id);
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.batchChip, selected && styles.batchChipActive]}
                    onPress={() => toggleBatch(b.id)}
                  >
                    <Users size={12} color={selected ? '#fff' : '#475569'} />
                    <Text style={[styles.batchChipText, selected && styles.batchChipTextActive]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {batchIds.length > 0 && (
              <Text style={styles.hint}>{batchIds.length} batch{batchIds.length === 1 ? '' : 'es'} selected</Text>
            )}
          </>
        )}

        {/* Total marks — only relevant for scored tests, not assignments */}
        {type === 'test' && (
          <>
            <Text style={styles.label}>Total Marks <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={totalMarks}
              onChangeText={(v) => setTotalMarks(v.replace(/[^0-9]/g, ''))}
            />
          </>
        )}

        {/* Due date */}
        <Text style={styles.label}>Due Date</Text>
        <TouchableOpacity style={styles.pickerRow} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.pickerText}>
            {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, selected) => {
              setShowDatePicker(false);
              if (selected) setDueDate(selected);
            }}
          />
        )}

        {/* Due time */}
        <Text style={styles.label}>Due Time</Text>
        <TouchableOpacity style={styles.pickerRow} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.pickerText}>
            {dueTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={dueTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour={false}
            onChange={(e, selected) => {
              setShowTimePicker(false);
              if (selected) setDueTime(selected);
            }}
          />
        )}

        {/* Question paper */}
        <Text style={styles.label}>
          Question Paper (scanned PDF or photo){isEdit && <Text style={styles.optional}> — optional, keeps existing if skipped</Text>}
        </Text>
        {questionGcsPath ? (
          <View style={styles.filePreparedRow}>
            <CheckCircle2 size={14} color="#10B981" />
            <Text style={styles.filePreparedText} numberOfLines={1}>{questionFileName}</Text>
            <TouchableOpacity onPress={handleChangeFile} disabled={uploadingFile}>
              <RefreshCw size={14} color="#28388f" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.browseBtn, uploadingFile && styles.disabledOpacity]}
            onPress={handleBrowseFile}
            disabled={uploadingFile}
          >
            {uploadingFile ? (
              <>
                <ActivityIndicator color="#28388f" size="small" />
                <Text style={styles.browseBtnText}>Uploading…</Text>
              </>
            ) : (
              <>
                <Upload size={16} color="#28388f" />
                <Text style={styles.browseBtnText}>Browse Files</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <Text style={styles.hint}>
          Scan the paper into a PDF (or take a photo) with your device first, then pick it here — it
          uploads straight to storage and the path gets saved on the test.
        </Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.disabledOpacity]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{isEdit ? 'Save Changes' : 'Save as Draft'}</Text>
          )}
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
  hint: { fontSize: 11, color: '#94a3b8', lineHeight: 16, marginTop: 8 },
  retryBtn: {
    marginTop: 10, alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  retryBtnText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  typeChipActive: { backgroundColor: '#28388f' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  typeChipTextActive: { color: '#fff' },
  subjectChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  subjectChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  batchChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9',
  },
  batchChipActive: { backgroundColor: '#28388f' },
  batchChipText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  batchChipTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
  locationRow: { position: 'relative', zIndex: 10 },
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  dropdownText: { flex: 1, fontSize: 14, color: '#1e293b', marginRight: 8 },
  locationMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    paddingVertical: 4, zIndex: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
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
  filePreparedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  filePreparedText: { flex: 1, fontSize: 12, color: '#15803D', fontWeight: '600' },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE',
  },
  browseBtnText: { color: '#28388f', fontSize: 14, fontWeight: '700' },
  disabledOpacity: { opacity: 0.5 },
  submitBtn: {
    backgroundColor: '#28388f', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 32,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  dropdownItemActive: { backgroundColor: '#e8eaf6', borderRadius: 10 },
  dropdownItemText: { fontSize: 14, color: '#1e293b' },
  dropdownItemTextActive: { color: '#28388f', fontWeight: '700' },
});
