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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, BookOpen, GraduationCap, Calendar, CheckSquare, Square } from 'lucide-react-native';

const SUBJECTS_LIST = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

export default function AddBatchScreen({ navigation }) {
  const [formData, setFormData] = useState({
    batchName: '',
    academicClass: '',
    startDate: '',
    selectedSubjects: []
  });

  const toggleSubject = (subject) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subject)
        ? prev.selectedSubjects.filter(s => s !== subject)
        : [...prev.selectedSubjects, subject]
    }));
  };

  const handleCreate = () => {
    if (!formData.batchName || !formData.academicClass) {
      Alert.alert('Required Fields', 'Please fill in the batch name and class.');
      return;
    }
    Alert.alert('Success', `Batch "${formData.batchName}" created successfully!`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const InputField = ({ label, icon: Icon, placeholder, value, onChangeText }) => (
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
        <Text style={styles.headerTitle}>Create New Batch</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <InputField 
              label="Batch Name" 
              icon={BookOpen} 
              placeholder="e.g. NEET 2026 - A7"
              value={formData.batchName}
              onChangeText={(text) => setFormData({...formData, batchName: text})}
            />

            <InputField 
              label="Academic Class" 
              icon={GraduationCap} 
              placeholder="e.g. 12th Standard"
              value={formData.academicClass}
              onChangeText={(text) => setFormData({...formData, academicClass: text})}
            />

            <InputField 
              label="Target Start Date" 
              icon={Calendar} 
              placeholder="e.g. 15th April 2025"
              value={formData.startDate}
              onChangeText={(text) => setFormData({...formData, startDate: text})}
            />

            <View style={styles.subjectSection}>
              <Text style={styles.label}>Include Subjects</Text>
              <View style={styles.subjectGrid}>
                {SUBJECTS_LIST.map((subject) => {
                  const isSelected = formData.selectedSubjects.includes(subject);
                  return (
                    <TouchableOpacity 
                      key={subject} 
                      style={[styles.subjectChip, isSelected && styles.subjectChipSelected]}
                      onPress={() => toggleSubject(subject)}
                    >
                      {isSelected ? <CheckSquare size={16} color="#fff" /> : <Square size={16} color="#94a3b8" />}
                      <Text style={[styles.subjectChipText, isSelected && styles.subjectChipTextSelected]}>{subject}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>Initialize Batch</Text>
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
  subjectSection: {
    marginTop: 10,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  subjectChipSelected: {
    backgroundColor: '#28388f',
    borderColor: '#28388f',
  },
  subjectChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  subjectChipTextSelected: {
    color: '#fff',
  },
  createButton: {
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
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
