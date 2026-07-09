import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Lock, LogOut, Mail, Phone, Shield, User } from 'lucide-react-native';
import { clearAuthToken } from '../../services/api';
import { useUserSession } from '../../context/UserSessionContext';
import { resetToLogin } from '../../navigation/navigationRef';

function getInitials(name) {
  if (!name) return 'T';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <View style={styles.profileRow}>
      <Icon size={18} color="#64748B" />
      <View style={styles.profileRowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value || 'Not added'}</Text>
      </View>
    </View>
  );
}

export default function TeacherProfileScreen({ navigation }) {
  const { userProfile, setSelectedBatch, setUserProfile } = useUserSession();
  const teacherName = userProfile?.name || userProfile?.teacher_name || 'Teacher';

  const handleLogout = () => {
    Alert.alert('Logout?', 'You will return to Login and need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuthToken();
          setUserProfile(null);
          setSelectedBatch(null);
          resetToLogin();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <LinearGradient colors={['#2446A7', '#2F66F4']} style={styles.heroGradient} />
        <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(teacherName)}</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{teacherName}</Text>
              <Text style={styles.profileRole}>Teacher • SDC Classes</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Details</Text>
        <View style={styles.card}>
          <ProfileRow icon={Mail} label="Email" value={userProfile?.email} />
          <ProfileRow icon={Phone} label="Phone" value={userProfile?.phone} />
          <ProfileRow icon={BookOpen} label="Role" value="Teacher" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.getParent?.()?.getParent?.()?.navigate('ChangePassword')}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIcon}>
                <Lock size={20} color="#28388F" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Security & Password</Text>
                <Text style={styles.actionSubtitle}>Update account password</Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIcon}>
                <Shield size={20} color="#28388F" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Teacher Access</Text>
                <Text style={styles.actionSubtitle}>Limited to assigned academic work</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroSafeArea: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 34,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 28,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#2F66F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
  },
  profileName: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '800',
  },
  profileRole: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 13,
    paddingVertical: 12,
  },
  profileRowCopy: {
    flex: 1,
  },
  rowLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rowValue: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  actionRow: {
    minHeight: 66,
    justifyContent: 'center',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  actionSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  logoutButton: {
    marginHorizontal: 24,
    marginTop: 28,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '800',
  },
});
