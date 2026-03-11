import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

const CLASSES = [
  { id: '11th', title: '11th Standard', subtitle: 'Junior College' },
  { id: '12th', title: '12th Standard', subtitle: 'Senior College' },
  { id: 'cet', title: 'CET Preparation', subtitle: 'MH-CET Exam' },
  { id: 'jee', title: 'JEE Preparation', subtitle: 'JEE Main & Advanced' },
];

export default function ClassSelectionScreen({ onNavigate }) {
  const [selectedClassId, setSelectedClassId] = useState(null);

  const handleContinue = () => {
    if (selectedClassId) {
       onNavigate('SubjectSelection');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Welcome')}>
          <ChevronLeft size={28} color="#28388f" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Select Your Class</Text>
          <Text style={styles.headerSubtitle}>Choose your current academic level</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {CLASSES.map((item) => {
          const isSelected = selectedClassId === item.id;
          return (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.card, 
                isSelected && styles.cardSelected
              ]}
              onPress={() => setSelectedClassId(item.id)}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            selectedClassId ? styles.continueButtonEnabled : styles.continueButtonDisabled
          ]} 
          onPress={handleContinue}
          disabled={!selectedClassId}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    marginLeft: -8, // slight offset to align better visually
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28388f', // bold navy blue
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b', // muted gray
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f1f5f9', // subtle light blue/gray border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#28388f', // highlight border in navy blue when selected
    backgroundColor: '#f8fafc',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28388f', // navy blue title
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94a3b8', // lighter gray font for subtitle
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30, // more bottom padding for mobile devices
    paddingTop: 10,
    backgroundColor: '#f8fafc',
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 16, // large rounded corners
    alignItems: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: '#28388f', 
  },
  continueButtonDisabled: {
    backgroundColor: '#9ba3c1', // solid grayish-blue background when disabled/or default
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
