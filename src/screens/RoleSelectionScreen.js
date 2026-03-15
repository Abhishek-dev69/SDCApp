import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Shield, Users, GraduationCap, UserCircle } from 'lucide-react-native';

const ROLES = [
  { id: 'owner', title: 'Owner', description: 'Financial control & analytics', icon: Crown, color: '#F59E0B' },
  { id: 'admin', title: 'Admin', description: 'Manage operations & students', icon: Shield, color: '#F97316' },
  { id: 'teacher', title: 'Teacher', description: 'Manage batches & student doubts', icon: Users, color: '#10B981' },
  { id: 'student', title: 'Student', description: 'Access lectures, tests & AI doubts', icon: GraduationCap, color: '#3B82F6' },
  { id: 'parent', title: 'Parent', description: "View child's progress & fees", icon: UserCircle, color: '#8B5CF6' },
];

export default function RoleSelectionScreen({ onNavigate }) {
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const handleContinue = () => {
    if (selectedRoleId === 'student') {
      onNavigate('BatchSelection');
    } else if (selectedRoleId) {
      // In the future: handle navigation for other roles
      console.log('Navigating for role:', selectedRoleId);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.headerTitle}>Select Your Role</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {ROLES.map((role) => {
          const IconComponent = role.icon;
          const isSelected = selectedRoleId === role.id;
          return (
            <TouchableOpacity 
              key={role.id} 
              style={[
                styles.card,
                isSelected && styles.cardSelected // visually highlight selected role
              ]}
              onPress={() => setSelectedRoleId(role.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${role.color}15` }]}>
                <IconComponent size={32} color={role.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.continueButton, selectedRoleId ? styles.continueButtonEnabled : styles.continueButtonDisabled]} 
          onPress={handleContinue}
          disabled={!selectedRoleId}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Welcome')}>
          <Text style={styles.backButtonText}>Back</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginVertical: 20,
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
    borderColor: '#ffffff', // transparent initially basically matching background
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSelected: {
    borderColor: '#28388f', // Same navy blue border
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
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#f8fafc',
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12, // separation between back and continue
  },
  continueButtonEnabled: {
    backgroundColor: '#28388f',
  },
  continueButtonDisabled: {
    backgroundColor: '#9ba3c1',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#475569',
    fontSize: 18,
    fontWeight: '600',
  },
});
