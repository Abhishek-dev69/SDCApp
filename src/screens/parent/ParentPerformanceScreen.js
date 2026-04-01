import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, TrendingUp, BookOpen, Clock } from 'lucide-react-native';

export default function ParentPerformanceScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#6d28d9']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ChevronLeft size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Performance</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.overallStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>85.4%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#12</Text>
              <Text style={styles.statLabel}>Class Rank</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subject-wise Average</Text>
          <TrendingUp size={20} color="#28388f" />
        </View>

        <SubjectCard 
          subject="Physics" 
          percentage="85%" 
          lectures="24/28" 
          color="#3b82f6" 
        />
        <SubjectCard 
          subject="Chemistry" 
          percentage="78%" 
          lectures="22/28" 
          color="#10b981" 
        />
        <SubjectCard 
          subject="Mathematics" 
          percentage="92%" 
          lectures="26/30" 
          color="#8b5cf6" 
        />

        <View style={styles.analysisBox}>
          <View style={styles.analysisHeader}>
            <TrendingUp size={24} color="#28388f" />
            <Text style={styles.analysisTitle}>AI Performance Insights</Text>
          </View>
          <Text style={styles.analysisText}>
            Aarav is performing exceptionally well in Mathematics. There's a slight dip in Chemistry scores this week. Focusing on "Organic Compounds" might help.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SubjectCard({ subject, percentage, lectures, color }) {
  return (
    <View style={styles.subjectCard}>
      <View style={[styles.colorAccent, { backgroundColor: color }]} />
      <View style={styles.cardMain}>
        <View style={styles.cardHeader}>
          <Text style={styles.subjectName}>{subject}</Text>
          <Text style={[styles.percentageText, { color: '#28388f' }]}>{percentage}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <BookOpen size={16} color="#64748b" />
            <Text style={styles.infoText}>{lectures} Lectures</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color="#64748b" />
            <Text style={styles.infoText}>12h Study</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  colorAccent: {
    width: 6,
    height: '100%',
  },
  cardMain: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  percentageText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
  },
  analysisBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  analysisText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
