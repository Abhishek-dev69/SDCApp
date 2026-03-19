import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, FileText, ChevronRight } from 'lucide-react-native';

const TESTS = [
  {
    id: '1',
    title: 'Physics Unit Test 3',
    subject: 'Physics',
    duration: '60 mins',
    questions: '30 Questions',
    date: 'Tomorrow, 10:00 AM',
    accentColor: '#3B82F6', // Blue
    type: 'upcoming',
  },
  {
    id: '2',
    title: 'Chemistry Weekly Test',
    subject: 'Chemistry',
    duration: '45 mins',
    questions: '25 Questions',
    date: 'Mar 1, 2:00 PM',
    accentColor: '#8B5CF6', // Purple
    type: 'upcoming',
  },
];

export default function TestsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Upcoming');

  const tabs = ['Upcoming', 'Attempted', 'Completed'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tests</Text>
      </View>

      {/* Segmented Control / Filter Bar */}
      <View style={styles.filterBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterButton,
              activeTab === tab ? styles.filterButtonActive : styles.filterButtonMuted,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeTab === tab ? styles.filterButtonTextActive : styles.filterButtonTextMuted,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'Upcoming' ? (
          TESTS.map((test) => (
            <TouchableOpacity key={test.id} style={[styles.testCard, { borderTopColor: test.accentColor }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.testTitle}>{test.title}</Text>
                  <View style={styles.testInfoRow}>
                    <View style={styles.infoItem}>
                      <Clock size={16} color="#64748B" />
                      <Text style={styles.infoText}>{test.duration}</Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.infoItem}>
                      <FileText size={16} color="#64748B" />
                      <Text style={styles.infoText}>{test.questions}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color="#94A3B8" />
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{test.date}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tests available in {activeTab} tab.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28388f',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 4,
    borderRadius: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonMuted: {
    backgroundColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#1E293B',
  },
  filterButtonTextMuted: {
    color: '#64748B',
  },
  scrollContent: {
    padding: 20,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderTopWidth: 4,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  testInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
  },
  verticalDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#28388f',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
