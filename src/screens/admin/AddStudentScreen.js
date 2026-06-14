import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Phone, Users } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

export default function AddStudentScreen({ navigation }) {
  const [formData, setFormData] = useState({
    fullName: '',
    parentName: '',
    studentPhone: '',
    parentPhone: '',
    email: '',
    parentEmail: '',
    batch: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.fullName || !formData.studentPhone || !formData.batch) {
      Alert.alert('Required Fields', 'Please fill in the student name, student phone number, and batch.');
      return;
    }
    if (formData.parentName && !formData.parentPhone && !formData.parentEmail) {
      Alert.alert('Guardian Contact', 'Add a guardian phone number or email to create parent access.');
      return;
    }

    setSaving(true);
    try {
      const student = await apiRequest('/admin/students', {
        method: 'POST',
        body: formData,
      });

      Alert.alert(
        'Student Added',
        student.sdcId
          ? [
              `${student.name} was added successfully.`,
              `Student SDC ID: ${student.sdcId}`,
              student.parentSdcId ? `Parent SDC ID: ${student.parentSdcId}` : null,
            ].filter(Boolean).join('\n')
          : `${student.name} was added successfully.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Unable to Add Student', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, icon: Icon, placeholder, value, onChangeText, keyboardType = 'default' }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Icon size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Student</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <InputField 
              label="Full Name" 
              icon={User} 
              placeholder="Enter student's full name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
            />

            <InputField 
              label="Parent/Guardian Name" 
              icon={User} 
              placeholder="Enter parent's name"
              value={formData.parentName}
              onChangeText={(text) => setFormData({...formData, parentName: text})}
            />

            <InputField 
              label="Student Phone Number"
              icon={Phone} 
              placeholder="Enter 10-digit number"
              value={formData.studentPhone}
              onChangeText={(text) => setFormData({...formData, studentPhone: text})}
              keyboardType="phone-pad"
            />

            <InputField
              label="Student Email"
              icon={User}
              placeholder="Optional student email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
            />

            <InputField
              label="Guardian Phone Number"
              icon={Phone}
              placeholder="Used for parent account"
              value={formData.parentPhone}
              onChangeText={(text) => setFormData({...formData, parentPhone: text})}
              keyboardType="phone-pad"
            />

            <InputField
              label="Guardian Email"
              icon={User}
              placeholder="Optional guardian email"
              value={formData.parentEmail}
              onChangeText={(text) => setFormData({...formData, parentEmail: text})}
              keyboardType="email-address"
            />

            <InputField 
              label="Batch" 
              icon={Users} 
              placeholder="e.g. A1 or K2"
              value={formData.batch}
              onChangeText={(text) => setFormData({...formData, batch: text})}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Student Record</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#28388f',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#28388f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
