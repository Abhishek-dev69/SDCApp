import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import {
  Bell,
  BookOpen,
  Building2,
  ChevronRight,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  Phone,
  Shield,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react-native';
import { getAdminBatchTotals, getBranchSummaries } from '../../data/adminBatchOverview';

const ACCOUNT_OPTIONS = [
  { id: 'edit-profile', title: 'Profile Details', subtitle: 'Update name, phone, and admin contact info', icon: UserCog },
  { id: 'notifications', title: 'Notifications', subtitle: 'Batch alerts, fee reminders, and reports', icon: Bell },
  { id: 'security', title: 'Security & Password', subtitle: 'Change password and review login access', icon: Lock, route: 'ChangePassword' },
];

const INSTITUTE_OPTIONS = [
  { id: 'branches', title: 'Branch Access', subtitle: 'Andheri, Goregaon, Kandivali, Dahisar', icon: Building2 },
  { id: 'permissions', title: 'Role Permissions', subtitle: 'Manage admin, teacher, and finance access', icon: Shield },
  { id: 'support', title: 'Support', subtitle: 'Contact app support for account or data issues', icon: HelpCircle },
];

function getRootNavigation(navigation) {
  return navigation.getParent?.()?.getParent?.() || navigation.getParent?.() || navigation;
}

function SettingsRow({ item, onPress, danger = false }) {
  const Icon = item.icon;

  return (
    <TouchableOpacity style={[styles.settingsRow, danger && styles.dangerRow]} onPress={onPress}>
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <Icon size={20} color={danger ? '#DC2626' : '#28388F'} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, danger && styles.dangerTitle]}>{item.title}</Text>
        {!!item.subtitle && <Text style={styles.rowSubtitle}>{item.subtitle}</Text>}
      </View>
      {!danger && <ChevronRight size={19} color="#94A3B8" />}
    </TouchableOpacity>
  );
}

function StatPill({ icon: Icon, value, label, color }) {
  return (
    <View style={styles.statPill}>
      <View style={[styles.statIcon, { backgroundColor: `${color}16` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminSettingsScreen({ navigation, route }) {
  const displayName = route?.params?.displayName || 'Admin';
  const userRole = route?.params?.userRole || 'admin';
  const totals = getAdminBatchTotals();
  const branchCount = getBranchSummaries().length;
  const roleLabel = userRole === 'teacher' ? 'Teacher Admin' : 'Admin';

  const navigateToRoute = (screenName) => {
    if (!screenName) {
      Alert.alert('Coming soon', 'This setting will be connected with the admin backend.');
      return;
    }

    getRootNavigation(navigation).navigate(screenName);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout?',
      'You will return to role selection and need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('userToken');
            getRootNavigation(navigation).dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'RoleSelection' }],
              })
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will raise an account deletion request for this admin profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Request submitted', 'The owner will review this account deletion request.'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Account, access, and institute controls</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileRole}>{roleLabel} • SDC Classes</Text>
            <View style={styles.contactList}>
              <View style={styles.contactRow}>
                <Mail size={14} color="#64748B" />
                <Text style={styles.contactText}>admin@sdcclasses.in</Text>
              </View>
              <View style={styles.contactRow}>
                <Phone size={14} color="#64748B" />
                <Text style={styles.contactText}>+91 98765 43210</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatPill icon={BookOpen} value={totals.activeBatches} label="Batches" color="#2563EB" />
          <StatPill icon={Users} value={totals.totalStudents} label="Students" color="#16A34A" />
          <StatPill icon={Building2} value={branchCount} label="Branches" color="#EA580C" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            {ACCOUNT_OPTIONS.map((item) => (
              <SettingsRow key={item.id} item={item} onPress={() => navigateToRoute(item.route)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Institute</Text>
          <View style={styles.settingsGroup}>
            {INSTITUTE_OPTIONS.map((item) => (
              <SettingsRow key={item.id} item={item} onPress={() => navigateToRoute(item.route)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <View style={styles.settingsGroup}>
            <SettingsRow
              item={{ title: 'Logout', subtitle: 'Sign out from this device', icon: LogOut }}
              onPress={handleLogout}
              danger
            />
            <SettingsRow
              item={{ title: 'Delete Account', subtitle: 'Request permanent admin account deletion', icon: Trash2 }}
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#28388F',
    marginRight: 14,
  },
  avatarText: {
    color: '#28388F',
    fontSize: 28,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  profileRole: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  contactList: {
    gap: 7,
    marginTop: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dangerRow: {
    backgroundColor: '#FFFFFF',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#FEF2F2',
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  dangerTitle: {
    color: '#DC2626',
  },
  rowSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
});
