import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Zap, FlaskConical, TriangleRight } from 'lucide-react-native';

const SUBJECTS = [
  { id: 'physics', title: 'Physics', subtitle: 'Full syllabus coverage', icon: Zap, color: '#F59E0B' }, // Yellow lightning bolt
  { id: 'chemistry', title: 'Chemistry', subtitle: 'Full syllabus coverage', icon: FlaskConical, color: '#10B981' }, // Green test tube
  { id: 'mathematics', title: 'Mathematics', subtitle: 'Full syllabus coverage', icon: TriangleRight, color: '#64748b' }, // Grey ruler/triangle
];

export default function SubjectSelectionScreen({ navigation }) {
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const toggleSubject = (id) => {
    setSelectedSubjects((prev) => 
      prev.includes(id) 
        ? prev.filter(subjectId => subjectId !== id)
        : [...prev, id]
    );
  };

  const handleStartLearning = () => {
    if (selectedSubjects.length > 0) {
      console.log("Selected subjects:", selectedSubjects);
      navigation.navigate('MainTabs');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('BatchSelection')}>
          <ChevronLeft size={28} color="#28388f" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Select Subjects</Text>
          <Text style={styles.headerSubtitle}>Choose subjects you want to study</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {SUBJECTS.map((subject) => {
          const isSelected = selectedSubjects.includes(subject.id);
          const IconComponent = subject.icon;
          return (
            <TouchableOpacity 
              key={subject.id} 
              style={[
                styles.card, 
                isSelected && styles.cardSelected
              ]}
              onPress={() => toggleSubject(subject.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${subject.color}15` }]}>
                <IconComponent size={32} color={subject.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{subject.title}</Text>
                <Text style={styles.cardSubtitle}>{subject.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        
        <Text style={styles.hintText}>You can select multiple subjects</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.startButton, 
            selectedSubjects.length > 0 ? styles.startButtonEnabled : styles.startButtonDisabled
          ]} 
          onPress={handleStartLearning}
          disabled={selectedSubjects.length === 0}
        >
          <Text style={styles.startButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
    marginLeft: -8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28388f',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSelected: {
    borderColor: '#28388f',
    backgroundColor: '#f8fafc',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28388f',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  hintText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: '#f8fafc',
  },
  startButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonEnabled: {
    backgroundColor: '#28388f', 
  },
  startButtonDisabled: {
    backgroundColor: '#9ba3c1', 
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
