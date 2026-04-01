import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen, 
  FileText, 
  History, 
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react-native';

export default function ParentProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Background */}
        <View style={styles.headerBackground} />

        <SafeAreaView style={styles.safeArea}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={40} color="#28388f" />
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Settings size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>Manasvi Gawli</Text>
              <Text style={styles.userRole}>Parent Account</Text>
            </View>

            <View style={styles.contactInfo}>
              <InfoRow icon={Mail} text="manasvi.g@example.com" />
              <InfoRow icon={Phone} text="+91 98765 43210" />
              <InfoRow icon={Calendar} text="Enrolled: Jan 2025" />
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard icon={BookOpen} value="142" label="Lectures" color="#3b82f6" />
            <StatCard icon={FileText} value="28" label="Tests" color="#10b981" />
            <StatCard icon={History} value="87h" label="Study" color="#8b5cf6" />
          </View>

          {/* Performance Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Insights</Text>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
                  <TrendingUp size={20} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.insightLabel}>Strongest Subject</Text>
                  <Text style={styles.insightValue}>Mathematics</Text>
                </View>
                <View style={styles.trendBadge}>
                  <TrendingUp size={14} color="#10b981" />
                  <Text style={styles.trendText}>+12%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Settings Options */}
          <View style={styles.optionsContainer}>
            <OptionItem icon={User} title="Child Profile" subtitle="Aarav Patel (12th-A1)" />
            <OptionItem icon={Settings} title="Notification Settings" />
            <TouchableOpacity style={styles.logoutButton}>
              <LogOut size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon: Icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Icon size={16} color="#64748b" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OptionItem({ icon: Icon, title, subtitle }) {
  return (
    <TouchableOpacity style={styles.optionItem}>
      <View style={styles.optionIconBox}>
        <Icon size={20} color="#28388f" />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#28388f',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2b58ed',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  userRole: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  contactInfo: {
    width: '100%',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  insightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  trendBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 40,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
