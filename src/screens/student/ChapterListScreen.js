import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Lock } from 'lucide-react-native';

const CHAPTERS = [
  {
    id: '1',
    title: 'Electrostatics',
    subtitle: '6 of 8 lectures completed',
    progress: 0.75,
    status: 'unlocked',
  },
  {
    id: '2',
    title: 'Current Electricity',
    subtitle: '4 of 6 lectures completed',
    progress: 0.67,
    status: 'unlocked',
  },
  {
    id: '3',
    title: 'Magnetic Effects',
    subtitle: '0 of 7 lectures completed',
    progress: 0,
    status: 'unlocked',
  },
  {
    id: '4',
    title: 'Electromagnetic Induction',
    subtitle: '0 of 5 lectures completed',
    progress: 0,
    status: 'locked',
  },
];

export default function ChapterListScreen({ navigation, route }) {
  const subjectName = route.params?.subject || 'Physics';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{subjectName}</Text>
          <Text style={styles.headerSubtitle}>{CHAPTERS.length} Chapters</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {CHAPTERS.map((chapter) => (
          <View key={chapter.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
              </View>
              {chapter.status === 'locked' ? (
                <Lock size={20} color="#94A3B8" />
              ) : (
                <View style={styles.playIconContainer}>
                  <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              )}
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${chapter.progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(chapter.progress * 100)}%</Text>
            </View>
          </View>
        ))}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28388f',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28388f',
  },
  chapterSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  playIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#28388f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#28388f',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28388f',
    width: 40,
    textAlign: 'right',
  },
});
