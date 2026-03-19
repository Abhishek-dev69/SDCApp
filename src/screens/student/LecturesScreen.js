import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Zap, FlaskConical, Ruler } from 'lucide-react-native';

const SUBJECTS = [
  {
    id: 'physics',
    title: 'Physics',
    chapters: '24 Chapters Available',
    icon: Zap,
    iconColor: '#F59E0B',
    borderColor: '#3B82F6', // Blue top border
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    chapters: '28 Chapters Available',
    icon: FlaskConical,
    iconColor: '#10B981',
    borderColor: '#8B5CF6', // Purple top border
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    chapters: '32 Chapters Available',
    icon: Ruler,
    iconColor: '#64748B',
    borderColor: '#10B981', // Green top border
  },
];

export default function LecturesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lectures</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {SUBJECTS.map((subject) => {
          const IconComponent = subject.icon;
          return (
            <TouchableOpacity
              key={subject.id}
              style={[styles.card, { borderTopColor: subject.borderColor, borderTopWidth: 4 }]}
              onPress={() => subject.id === 'physics' && navigation.navigate('ChapterList', { subject: subject.title })}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${subject.iconColor}15` }]}>
                  <IconComponent size={24} color={subject.iconColor} />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{subject.title}</Text>
                  <Text style={styles.cardSubtitle}>{subject.chapters}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>
          );
        })}
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
  scrollContent: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
});
