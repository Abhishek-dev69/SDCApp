import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BookOpen,
  Building2,
  ChevronRight,
  IndianRupee,
  Lock,
  LogOut,
  Mail,
  Phone,
  Receipt,
  Shield,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react-native';
import {
  ADMIN_BATCH_OVERVIEW,
  ADMIN_DUE_STUDENTS,
  formatCurrency,
  getAdminBatchTotals,
  getBranchSummaries,
} from '../../data/adminBatchOverview';

function getRootNavigation(navigation) {
  return navigation.getParent?.()?.getParent?.() || navigation.getParent?.() || navigation;
}

function ProgressBar({ value, color = '#28388F' }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function OwnerShell({ title, subtitle, children, accent = ['#2B58ED', '#1E3A8A'] }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={accent} style={styles.heroGradient} />
          <Text style={styles.heroKicker}>Owner Control</Text>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, caption }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCaption}>{caption}</Text>
    </View>
  );
}

function StatCard({ icon: Icon, value, label, meta, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}16` }]}>
        <Icon size={19} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {!!meta && <Text style={styles.statMeta}>{meta}</Text>}
    </View>
  );
}

function RowItem({ icon: Icon, title, meta, value, color = '#2563EB' }) {
  return (
    <View style={styles.rowItem}>
      <View style={[styles.rowIcon, { backgroundColor: `${color}16` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      {!!value && <Text style={[styles.rowValue, { color }]}>{value}</Text>}
    </View>
  );
}

function getProgramSummaries() {
  const programMap = ADMIN_BATCH_OVERVIEW.reduce((summary, batch) => {
    const current = summary[batch.program] || {
      id: batch.program,
      program: batch.program,
      batches: 0,
      students: 0,
      collectedAmount: 0,
      pendingAmount: 0,
    };

    current.batches += 1;
    current.students += batch.studentCount;
    current.collectedAmount += batch.collectedAmount;
    current.pendingAmount += batch.pendingAmount;

    return {
      ...summary,
      [batch.program]: current,
    };
  }, {});

  return Object.values(programMap);
}

export function OwnerAnalyticsScreen() {
  const totals = getAdminBatchTotals();
  const branches = getBranchSummaries();
  const programSummaries = getProgramSummaries();
  const attentionBatches = [...ADMIN_BATCH_OVERVIEW]
    .sort((first, second) => (first.attendance + first.testAverage) - (second.attendance + second.testAverage))
    .slice(0, 4);

  return (
    <OwnerShell
      title="Institute Analytics"
      subtitle="Branch strength, batch health, and academic signals in one place."
    >
      <View style={styles.grid}>
        <StatCard icon={Users} value={totals.totalStudents} label="Students" meta={`${totals.activeBatches} batches`} color="#2563EB" />
        <StatCard icon={BookOpen} value={`${totals.occupancyRate}%`} label="Seat Fill" meta={`${totals.totalCapacity} capacity`} color="#28388F" />
        <StatCard icon={UserCheck} value={`${totals.averageAttendance}%`} label="Attendance" meta="All batches" color="#2B58ED" />
        <StatCard icon={TrendingUp} value={`${totals.averageScore}%`} label="Test Avg" meta="Latest cycle" color="#EA580C" />
      </View>

      <SectionHeader title="Branch Performance" caption="How every centre is doing on students, attendance, and dues" />
      {branches.map((branch) => (
        <View key={branch.id} style={styles.dataCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>{branch.branch}</Text>
              <Text style={styles.cardMeta}>{branch.batches} batches • {branch.students} students</Text>
            </View>
            <Text style={styles.successValue}>{branch.occupancyRate}% full</Text>
          </View>
          <ProgressBar value={branch.occupancyRate} color="#2563EB" />
          <View style={styles.threeStats}>
            <Text style={styles.smallStat}>{branch.attendance}% attendance</Text>
            <Text style={styles.smallStat}>{branch.testAverage}% score</Text>
            <Text style={styles.smallStat}>{formatCurrency(branch.pendingAmount)} due</Text>
          </View>
        </View>
      ))}

      <SectionHeader title="Program Mix" caption="Student and revenue split by course type" />
      {programSummaries.map((program) => (
        <RowItem
          key={program.id}
          icon={BookOpen}
          title={program.program}
          meta={`${program.batches} batches • ${program.students} students • ${formatCurrency(program.pendingAmount)} pending`}
          value={formatCurrency(program.collectedAmount)}
          color="#28388F"
        />
      ))}

      <SectionHeader title="Academic Watch" caption="Batches that should be reviewed first" />
      {attentionBatches.map((batch) => (
        <RowItem
          key={batch.id}
          icon={AlertTriangle}
          title={batch.name}
          meta={`${batch.branch} • ${batch.attendance}% attendance • ${batch.testAverage}% score`}
          value={batch.label}
          color="#EA580C"
        />
      ))}
    </OwnerShell>
  );
}

export function OwnerRevenueScreen() {
  const totals = getAdminBatchTotals();
  const collectionRisk = [...ADMIN_BATCH_OVERVIEW]
    .sort((first, second) => second.pendingAmount - first.pendingAmount)
    .slice(0, 5);

  return (
    <OwnerShell
      title="Revenue Watch"
      subtitle="Collection status, pending dues, and student-level fee follow-up."
      accent={['#2B58ED', '#1E3A8A']}
    >
      <View style={styles.grid}>
        <StatCard icon={Receipt} value={formatCurrency(totals.expectedAmount)} label="Expected" meta="Academic cycle" color="#2563EB" />
        <StatCard icon={IndianRupee} value={formatCurrency(totals.collectedAmount)} label="Collected" meta={`${totals.collectionRate}% received`} color="#28388F" />
        <StatCard icon={TrendingDown} value={formatCurrency(totals.pendingAmount)} label="Pending" meta={`${totals.dueStudents} students`} color="#DC2626" />
        <StatCard icon={Banknote} value={totals.overdueStudents} label="Overdue" meta="Needs follow-up" color="#EA580C" />
      </View>

      <View style={styles.collectionCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Overall Collection</Text>
            <Text style={styles.cardMeta}>
              {formatCurrency(totals.collectedAmount)} of {formatCurrency(totals.expectedAmount)}
            </Text>
          </View>
          <Text style={styles.successValue}>{totals.collectionRate}%</Text>
        </View>
        <ProgressBar value={totals.collectionRate} color="#28388F" />
        <View style={styles.threeStats}>
          <Text style={styles.smallStat}>{totals.activeBatches} batches</Text>
          <Text style={styles.smallStat}>{totals.dueStudents} due</Text>
          <Text style={styles.smallStat}>{formatCurrency(totals.pendingAmount)} pending</Text>
        </View>
      </View>

      <SectionHeader title="Batch Collection Risk" caption="Batches with the highest pending amount" />
      {collectionRisk.map((batch) => (
        <View key={batch.id} style={styles.dataCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>{batch.name}</Text>
              <Text style={styles.cardMeta}>{batch.branch} • {batch.dueStudents} due students</Text>
            </View>
            <Text style={styles.dangerValue}>{formatCurrency(batch.pendingAmount)}</Text>
          </View>
          <ProgressBar value={batch.collectionRate} color={batch.collectionRate >= 85 ? '#28388F' : '#EA580C'} />
          <View style={styles.threeStats}>
            <Text style={styles.smallStat}>{batch.collectionRate}% collected</Text>
            <Text style={styles.smallStat}>{formatCurrency(batch.collectedAmount)} received</Text>
            <Text style={styles.smallStat}>{batch.overdueStudents} overdue</Text>
          </View>
        </View>
      ))}

      <SectionHeader title="Due Student Follow-up" caption="Students requiring payment reminders" />
      {ADMIN_DUE_STUDENTS.slice(0, 5).map((student) => (
        <RowItem
          key={student.id}
          icon={Users}
          title={student.name}
          meta={`${student.batchName} • ${student.branch} • Due ${student.dueDate}`}
          value={formatCurrency(student.amount)}
          color={student.status === 'Overdue' ? '#DC2626' : '#EA580C'}
        />
      ))}
    </OwnerShell>
  );
}

export function OwnerBatchesScreen() {
  const branches = ['All', ...getBranchSummaries().map((branch) => branch.branch)];
  const [activeBranch, setActiveBranch] = useState('All');
  const visibleBatches = activeBranch === 'All'
    ? ADMIN_BATCH_OVERVIEW
    : ADMIN_BATCH_OVERVIEW.filter((batch) => batch.branch === activeBranch);

  return (
    <OwnerShell
      title="Batch Control"
      subtitle="Capacity, students, attendance, and fee status for every batch."
      accent={['#1E3A8A', '#334155']}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {branches.map((branch) => (
          <TouchableOpacity
            key={branch}
            style={[styles.filterChip, activeBranch === branch && styles.activeFilterChip]}
            onPress={() => setActiveBranch(branch)}
          >
            <Text style={[styles.filterText, activeBranch === branch && styles.activeFilterText]}>{branch}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionHeader title="Active Batches" caption={`${visibleBatches.length} batches in view`} />
      {visibleBatches.map((batch) => (
        <View key={batch.id} style={styles.batchCard}>
          <View style={styles.batchTopRow}>
            <View style={styles.batchBadge}>
              <Text style={styles.batchBadgeText}>{batch.label}</Text>
            </View>
            <View style={styles.batchCopy}>
              <Text style={styles.cardTitle}>{batch.name}</Text>
              <Text style={styles.cardMeta}>{batch.branch} • {batch.program} • {batch.stream}</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </View>

          <View style={styles.batchStatsGrid}>
            <Text style={styles.batchStat}>{batch.studentCount}/{batch.capacity} seats</Text>
            <Text style={styles.batchStat}>{batch.attendance}% attendance</Text>
            <Text style={styles.batchStat}>{batch.collectionRate}% fees</Text>
            <Text style={styles.batchStat}>{batch.dueStudents} due</Text>
          </View>

          <ProgressBar value={batch.occupancyRate} color={batch.occupancyRate >= 88 ? '#28388F' : '#2563EB'} />
        </View>
      ))}
    </OwnerShell>
  );
}

export function OwnerProfileScreen({ route, navigation }) {
  const displayName = route?.params?.displayName || 'Natik Sir';
  const totals = getAdminBatchTotals();

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

  const accountRows = [
    { id: 'access', icon: Shield, title: 'Owner Access', meta: 'Full institute, finance, and branch visibility', value: 'Full', color: '#2563EB' },
    { id: 'security', icon: Lock, title: 'Change Password', meta: 'Update login password and security', value: '', color: '#28388F', route: 'ChangePassword' },
    { id: 'logout', icon: LogOut, title: 'Logout', meta: 'Sign out from this device', value: '', color: '#DC2626', action: handleLogout },
  ];

  return (
    <OwnerShell
      title="Owner Profile"
      subtitle="Account identity, access, and institute coverage."
      accent={['#2B58ED', '#1E3A8A']}
    >
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileRole}>Owner • SDC Classes</Text>
          <View style={styles.contactRow}>
            <Mail size={14} color="#64748B" />
            <Text style={styles.contactText}>owner@sdcclasses.in</Text>
          </View>
          <View style={styles.contactRow}>
            <Phone size={14} color="#64748B" />
            <Text style={styles.contactText}>+91 98765 43210</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard icon={Building2} value={getBranchSummaries().length} label="Branches" meta="Active centres" color="#2563EB" />
        <StatCard icon={BookOpen} value={totals.activeBatches} label="Batches" meta="Running now" color="#28388F" />
        <StatCard icon={Users} value={totals.totalStudents} label="Students" meta="Enrolled" color="#2B58ED" />
        <StatCard icon={IndianRupee} value={formatCurrency(totals.pendingAmount)} label="Pending" meta="Fees due" color="#DC2626" />
      </View>

      <SectionHeader title="Owner Controls" caption="High-level access and account actions" />
      {accountRows.map((row) => (
        <TouchableOpacity
          key={row.id}
          onPress={() => {
            if (row.action) {
              row.action();
              return;
            }

            if (row.route) {
              getRootNavigation(navigation).navigate(row.route);
            }
          }}
        >
          <RowItem icon={row.icon} title={row.title} meta={row.meta} value={row.value} color={row.color} />
        </TouchableOpacity>
      ))}
    </OwnerShell>
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
    paddingBottom: 116,
  },
  hero: {
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 26,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  statMeta: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionCaption: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  successValue: {
    color: '#28388F',
    fontSize: 13,
    fontWeight: '800',
  },
  dangerValue: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 13,
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
  },
  threeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 11,
  },
  smallStat: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  rowMeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 10,
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 16,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  filterChip: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  activeFilterChip: {
    backgroundColor: '#28388F',
    borderColor: '#28388F',
  },
  filterText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  batchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  batchBadgeText: {
    color: '#28388F',
    fontSize: 15,
    fontWeight: '800',
  },
  batchCopy: {
    flex: 1,
  },
  batchStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  batchStat: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  profileAvatar: {
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
  profileAvatarText: {
    color: '#28388F',
    fontSize: 28,
    fontWeight: '800',
  },
  profileCopy: {
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
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  contactText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});
