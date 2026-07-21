import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Switch } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { clearAuthToken, apiRequest } from '../../services/api';

const ACCOUNT_OPTIONS = [
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

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [activeViewBranch, setActiveViewBranch] = useState('Kandivali');

  // Notifications State
  const [notificationConfig, setNotificationConfig] = useState({
    emailAlerts: true,
    whatsappAlerts: true,
    weeklyReports: false,
    syllabusProgress: true,
  });

  const toggleNotificationSetting = (key) => {
    setNotificationConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [permissions, setPermissions] = useState({
    admin: { createBatch: true, editStudent: true, answerDoubts: true, postAnnouncements: true },
    teacher: { createBatch: false, editStudent: false, answerDoubts: true, postAnnouncements: true },
    finance: { createBatch: false, editStudent: false, answerDoubts: false, postAnnouncements: false },
  });

  const togglePermission = (role, key) => {
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role][key] }
    }));
  };

  const handleAccountOption = (id, route) => {
    if (id === 'notifications') {
      setNotificationsModalVisible(true);
    } else {
      navigateToRoute(route);
    }
  };

  const [liveOverview, setLiveOverview] = useState(null);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      apiRequest('/admin/overview')
        .then(data => setLiveOverview(data))
        .catch(err => console.log('Settings fetch metrics failed:', err.message));
    });
    return unsubscribe;
  }, [navigation]);

  const handleInstituteOption = (id) => {
    if (id === 'branches') {
      setBranchModalVisible(true);
    } else if (id === 'permissions') {
      setPermissionsModalVisible(true);
    } else {
      Alert.alert('Support', 'Contact SDC App Coordinator at: support@sdcclasses.in');
    }
  };

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
      'You will return to Login and need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearAuthToken();
            navigation.reset({ index: 0, routes: [{ name: 'SDCLogin' }] });
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
          <StatPill icon={BookOpen} value={liveOverview?.activeBatches ?? totals.activeBatches} label="Batches" color="#2563EB" />
          <StatPill icon={Users} value={liveOverview?.totalStudents ?? totals.totalStudents} label="Students" color="#16A34A" />
          <StatPill icon={Building2} value={liveOverview?.batches ? new Set(liveOverview.batches.map(b => b.branch)).size : branchCount} label="Branches" color="#EA580C" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            {ACCOUNT_OPTIONS.map((item) => (
              <SettingsRow key={item.id} item={item} onPress={() => handleAccountOption(item.id, item.route)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Institute</Text>
          <View style={styles.settingsGroup}>
            {INSTITUTE_OPTIONS.map((item) => (
              <SettingsRow key={item.id} item={item} onPress={() => handleInstituteOption(item.id)} />
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
          </View>
        </View>

        {/* Branch Access Modal */}
        <Modal visible={branchModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Branch Access Manager</Text>
              <Text style={styles.modalSubtitle}>Switch view to manage other branches:</Text>

              {['Kandivali', 'Andheri', 'Dahisar', 'Goregaon'].map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.branchCard, activeViewBranch === b && styles.branchCardActive]}
                  onPress={() => {
                    setActiveViewBranch(b);
                    Alert.alert('Branch Switched', `Now viewing SDC classes data for ${b} branch.`);
                    setBranchModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={[styles.branchName, activeViewBranch === b && styles.branchNameActive]}>{b} Branch</Text>
                    <Text style={styles.branchMeta}>SDC Classes regional operations</Text>
                  </View>
                  <ChevronRight size={18} color={activeViewBranch === b ? '#FFF' : '#64748B'} />
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.closeBtn} onPress={() => setBranchModalVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Role Permissions Modal */}
        <Modal visible={permissionsModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <Text style={styles.modalTitle}>Role Permissions Matrix</Text>
              <Text style={styles.modalSubtitle}>Grant operational permissions to staff roles:</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {['admin', 'teacher', 'finance'].map((role) => (
                  <View key={role} style={styles.rolePermCard}>
                    <Text style={styles.roleTitle}>{role.toUpperCase()} Role</Text>
                    
                    <View style={styles.permRow}>
                      <Text style={styles.permText}>Create Batches</Text>
                      <Switch
                        value={permissions[role].createBatch}
                        onValueChange={() => togglePermission(role, 'createBatch')}
                        thumbColor="#28388F"
                      />
                    </View>

                    <View style={styles.permRow}>
                      <Text style={styles.permText}>Edit Student Records</Text>
                      <Switch
                        value={permissions[role].editStudent}
                        onValueChange={() => togglePermission(role, 'editStudent')}
                        thumbColor="#28388F"
                      />
                    </View>

                    <View style={styles.permRow}>
                      <Text style={styles.permText}>Resolve Doubts</Text>
                      <Switch
                        value={permissions[role].answerDoubts}
                        onValueChange={() => togglePermission(role, 'answerDoubts')}
                        thumbColor="#28388F"
                      />
                    </View>

                    <View style={styles.permRow}>
                      <Text style={styles.permText}>Post Announcements</Text>
                      <Switch
                        value={permissions[role].postAnnouncements}
                        onValueChange={() => togglePermission(role, 'postAnnouncements')}
                        thumbColor="#28388F"
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setPermissionsModalVisible(false)}>
                <Text style={styles.closeBtnText}>Save & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Notifications Modal */}
        <Modal visible={notificationsModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Notifications Settings</Text>
              <Text style={styles.modalSubtitle}>Configure system alerts and notifications:</Text>

              <View style={styles.rolePermCard}>
                <View style={styles.permRow}>
                  <Text style={styles.permText}>Enable Email Alerts</Text>
                  <Switch
                    value={notificationConfig.emailAlerts}
                    onValueChange={() => toggleNotificationSetting('emailAlerts')}
                    thumbColor="#28388F"
                  />
                </View>

                <View style={styles.permRow}>
                  <Text style={styles.permText}>Enable WhatsApp Reminders</Text>
                  <Switch
                    value={notificationConfig.whatsappAlerts}
                    onValueChange={() => toggleNotificationSetting('whatsappAlerts')}
                    thumbColor="#28388F"
                  />
                </View>

                <View style={styles.permRow}>
                  <Text style={styles.permText}>Weekly Batch Reports</Text>
                  <Switch
                    value={notificationConfig.weeklyReports}
                    onValueChange={() => toggleNotificationSetting('weeklyReports')}
                    thumbColor="#28388F"
                  />
                </View>

                <View style={styles.permRow}>
                  <Text style={styles.permText}>Syllabus Portion Updates</Text>
                  <Switch
                    value={notificationConfig.syllabusProgress}
                    onValueChange={() => toggleNotificationSetting('syllabusProgress')}
                    thumbColor="#28388F"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setNotificationsModalVisible(false)}>
                <Text style={styles.closeBtnText}>Save & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  branchCardActive: {
    backgroundColor: '#28388F',
    borderColor: '#28388F',
  },
  branchName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  branchNameActive: {
    color: '#FFFFFF',
  },
  branchMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#EEF2FF',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  closeBtnText: {
    color: '#28388F',
    fontSize: 15,
    fontWeight: '700',
  },
  rolePermCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#28388F',
    marginBottom: 8,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF',
  },
  permText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
});
