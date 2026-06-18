import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const BLANK_FORM = {
  // student fields
  student_name: '',
  email_address: '',
  student_whatsapp_number: '',
  date_of_birth: '',
  student_std: '',
  sdc_branch: '',
  sdc_batch: '',
  batch_id: null,
  sdc_course_opted: '',
  tenth_std_school: '',
  student_address: '',
  school_board: '',
  tenth_std_percentage: '',
  serial_number: '',
  data_verified: false,

  // parent fields
  parent_id: null,
  father_name: '',
  mother_name: '',
  father_whatsapp_number: '',
  mother_whatsapp_number: '',
  parent_phone_number: '',
};

export default function AddEditStudent({ navigation, route }) {
  const studentId = route?.params?.studentId || null;
  const isEditMode = Boolean(studentId);

  const [form, setForm] = useState(BLANK_FORM);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Load dropdown data
  useEffect(() => {
    apiRequest('/admin/students/branches')
      .then(data => setBranches(Array.isArray(data?.branches) ? data.branches : []))
      .catch(err => console.log('Branches fetch failed:', err.message));

    apiRequest('/admin/students/batches')
      .then(data => setBatches(Array.isArray(data?.batches) ? data.batches : []))
      .catch(err => console.log('Batches fetch failed:', err.message));
  }, []);

  // If editing, fetch and prefill
  useEffect(() => {
    if (!isEditMode) return;

    apiRequest(`/admin/students/${studentId}`)
      .then(data => {
        const s = data?.student;
        if (!s) return;

        setForm({
          student_name: s.student_name || '',
          email_address: s.email_address || '',
          student_whatsapp_number: s.student_whatsapp_number || '',
          date_of_birth: s.date_of_birth || '',
          student_std: s.student_std || '',
          sdc_branch: s.sdc_branch || '',
          sdc_batch: s.sdc_batch || '',
          batch_id: s.current_batch_id || null,
          sdc_course_opted: s.sdc_course_opted || '',
          tenth_std_school: s.tenth_std_school || '',
          student_address: s.student_address || '',
          school_board: s.school_board || '',
          tenth_std_percentage: s.tenth_std_percentage ? String(s.tenth_std_percentage) : '',
          serial_number: s.serial_number ? String(s.serial_number) : '',
          data_verified: Boolean(s.data_verified),

          parent_id: s.parent_id || null,
          father_name: s.father_name || '',
          mother_name: s.mother_name || '',
          father_whatsapp_number: s.father_whatsapp_number || '',
          mother_whatsapp_number: s.mother_whatsapp_number || '',
          parent_phone_number: '',
        });
      })
      .catch(err => Alert.alert('Unable to Load Student', err.message || 'Please try again.'))
      .finally(() => setLoading(false));
  }, [studentId, isEditMode]);

  const validate = () => {
    if (!form.student_name.trim()) {
      Alert.alert('Required Field', 'Student name is required.');
      return false;
    }
    if (!form.email_address.trim() && !form.student_whatsapp_number.trim()) {
      Alert.alert('Required Field', 'Student must have an email or phone number.');
      return false;
    }
    if (!form.father_name.trim() && !form.mother_name.trim()) {
      Alert.alert('Required Field', 'At least one parent name is required.');
      return false;
    }
    if (
      !form.father_whatsapp_number.trim() &&
      !form.mother_whatsapp_number.trim() &&
      !form.parent_phone_number.trim()
    ) {
      Alert.alert('Required Field', 'Parent must have at least one phone number.');
      return false;
    }
    return true;
  };

  const handleDateChange = (event, selectedDate) => {
  setShowDatePicker(false);
  if (selectedDate) {
    const isoDate = selectedDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
    updateField('date_of_birth', isoDate);
  }
};

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEditMode) {
        await apiRequest(`/admin/students/${studentId}`, {
          method: 'PUT',
          body: form,
        });
        Alert.alert('Saved', `${form.student_name}'s details were updated.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const result = await apiRequest('/admin/students', {
          method: 'POST',
          body: form,
        });
        Alert.alert(
          'Student Added',
          `${form.student_name} was added successfully.\nStudent SDC ID: ${result.student_sdc_id}\nParent SDC ID: ${result.parent_sdc_id}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      Alert.alert('Unable to Save', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [form, isEditMode, studentId, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerState}>
          <ActivityIndicator color="#28388f" />
        </View>
      </SafeAreaView>
    );
  }

  const formatDateDisplay = (isoString) => {
  if (!isoString) return 'Select date of birth';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>{isEditMode ? 'Edit Student' : 'Add Student'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Student Details</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={form.student_name}
          onChangeText={t => updateField('student_name', t)}
          placeholder="Student's full name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={form.email_address}
          onChangeText={t => updateField('email_address', t)}
          placeholder="student@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>WhatsApp Number</Text>
        <TextInput
          style={styles.input}
          value={form.student_whatsapp_number}
          onChangeText={t => updateField('student_whatsapp_number', t)}
          placeholder="10-digit number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Date of Birth</Text>
<TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
  <Text style={form.date_of_birth ? styles.dropdownButtonText : styles.placeholderText}>
    {formatDateDisplay(form.date_of_birth)}
  </Text>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={form.date_of_birth ? new Date(form.date_of_birth) : new Date(2009, 0, 1)}
    mode="date"
    display="default"
    maximumDate={new Date()}
    onChange={handleDateChange}
  />
)}

        <Text style={styles.label}>Standard / Class</Text>
        <TextInput
          style={styles.input}
          value={form.student_std}
          onChangeText={t => updateField('student_std', t)}
          placeholder="11th"
        />

        <Text style={styles.label}>Branch</Text>
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => { setBranchDropdownOpen(prev => !prev); setBatchDropdownOpen(false); }}
          >
            <Text style={styles.dropdownButtonText}>{form.sdc_branch || 'Select Branch'}</Text>
            <Text style={styles.dropdownArrow}>{branchDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {branchDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {branches.map(branch => (
                <TouchableOpacity
                  key={branch}
                  style={styles.dropdownItem}
                  onPress={() => { updateField('sdc_branch', branch); setBranchDropdownOpen(false); }}
                >
                  <Text style={styles.dropdownItemText}>{branch}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.label}>Batch</Text>
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => { setBatchDropdownOpen(prev => !prev); setBranchDropdownOpen(false); }}
          >
            <Text style={styles.dropdownButtonText}>{form.sdc_batch || 'Select Batch'}</Text>
            <Text style={styles.dropdownArrow}>{batchDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {batchDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {batches.map(batch => (
                <TouchableOpacity
                  key={batch.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    updateField('sdc_batch', batch.name);
                    updateField('batch_id', batch.id);
                    setBatchDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{batch.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.label}>Course Opted</Text>
        <TextInput
          style={styles.input}
          value={form.sdc_course_opted}
          onChangeText={t => updateField('sdc_course_opted', t)}
          placeholder="NEET / JEE Mains / MHT-CET PCM ..."
        />

        <Text style={styles.label}>10th Standard School</Text>
        <TextInput
          style={styles.input}
          value={form.tenth_std_school}
          onChangeText={t => updateField('tenth_std_school', t)}
        />

        <Text style={styles.label}>School Board</Text>
        <TextInput
          style={styles.input}
          value={form.school_board}
          onChangeText={t => updateField('school_board', t)}
          placeholder="SSC (State Board) / CBSE / ICSE"
        />

        <Text style={styles.label}>10th Standard Percentage</Text>
        <TextInput
          style={styles.input}
          value={form.tenth_std_percentage}
          onChangeText={t => updateField('tenth_std_percentage', t)}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={form.student_address}
          onChangeText={t => updateField('student_address', t)}
          multiline
        />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Parent Details</Text>

        <Text style={styles.label}>Father's Name</Text>
        <TextInput
          style={styles.input}
          value={form.father_name}
          onChangeText={t => updateField('father_name', t)}
        />

        <Text style={styles.label}>Father's WhatsApp Number</Text>
        <TextInput
          style={styles.input}
          value={form.father_whatsapp_number}
          onChangeText={t => updateField('father_whatsapp_number', t)}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Mother's Name</Text>
        <TextInput
          style={styles.input}
          value={form.mother_name}
          onChangeText={t => updateField('mother_name', t)}
        />

        <Text style={styles.label}>Mother's WhatsApp Number</Text>
        <TextInput
          style={styles.input}
          value={form.mother_whatsapp_number}
          onChangeText={t => updateField('mother_whatsapp_number', t)}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditMode ? 'Save Changes' : 'Add Student'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownWrapper: {
    overflow: 'visible',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#1e293b',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#64748b',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 24,
  },
  saveButton: {
    backgroundColor: '#28388f',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  placeholderText: {
  fontSize: 14,
  color: '#94a3b8',
},
});