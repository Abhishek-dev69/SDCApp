import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronRight, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen, 
  FileText, 
  Clock, 
  User, 
  Bell, 
  Shield, 
  Download 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const STATS = [
  { id: '1', label: 'Lectures Completed', value: '142', icon: BookOpen, color: '#3B82F6' },
  { id: '2', label: 'Tests Attempted', value: '28', icon: FileText, color: '#10B981' },
  { id: '3', label: 'Study Hours', value: '87h', icon: Clock, color: '#8B5CF6' },
];

const SETTINGS = [
  { id: '1', label: 'Edit Profile', icon: User },
  { id: '2', label: 'Notifications', icon: Bell },
  { id: '3', label: 'Data & Privacy', icon: Shield },
  { id: '4', label: 'Download Academic Report', icon: Download },
];

export default function ProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navyHeader}>
        <SafeAreaView edges={['top']} style={styles.navyHeader}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>M</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Manasvi Gawli</Text>
              <Text style={styles.profileClass}>Class 12th • Science</Text>
            </View>
          </View>

          <View style={styles.contactList}>
            <View style={styles.contactItem}>
              <Mail size={16} color="#64748B" />
              <Text style={styles.contactText}>manasvi@example.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={16} color="#64748B" />
              <Text style={styles.contactText}>+91 98765 43210</Text>
            </View>
            <View style={styles.contactItem}>
              <Calendar size={16} color="#64748B" />
              <Text style={styles.contactText}>Enrolled: June 2025</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.id} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                  <Icon size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Academic Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Performance</Text>
          
          <View style={styles.progressItem}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Attendance</Text>
              <Text style={[styles.progressValue, { color: '#10B981' }]}>92%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: '92%', backgroundColor: '#10B981' }]} />
            </View>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Overall Score</Text>
              <Text style={[styles.progressValue, { color: '#3B82F6' }]}>85%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: '85%', backgroundColor: '#3B82F6' }]} />
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsSection}>
          {SETTINGS.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={item.id} style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <View style={styles.settingsIconContainer}>
                    <Icon size={20} color="#1E293B" />
                  </View>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navyHeader: {
    backgroundColor: '#28388f',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 0.5,
    paddingBottom: 0.1,
    paddingHorizontal: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 24,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#28388f',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28388f',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  profileClass: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  contactList: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
});
