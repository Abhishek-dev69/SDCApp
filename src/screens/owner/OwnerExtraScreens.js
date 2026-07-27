import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
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
import { apiRequest, clearAuthToken } from '../../services/api';
import { useUserSession } from '../../context/UserSessionContext';

function getRootNavigation(navigation) {
  return navigation.getParent?.()?.getParent?.() || navigation.getParent?.() || navigation;
}

function useOwnerLiveData() {
  const [overview, setOverview] = useState(null);
  const [batches, setBatches] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([
      apiRequest('/dashboard/owner'),
      apiRequest('/admin/batches'),
      apiRequest('/operations/fees').catch((requestError) => {
        if (requestError?.status === 501) return [];
        throw requestError;
      }),
    ])
      .then(([overviewData, batchData, feeData]) => {
        if (!active) return;
        setOverview(overviewData);
        setBatches(Array.isArray(batchData) ? batchData : []);
        setFees(Array.isArray(feeData) ? feeData : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load owner data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { overview, batches, fees, loading, error };
}

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

function getFeeTotals(fees) {
  return fees.reduce(
    (totals, fee) => {
      const amount = Number(fee.amount || 0);
      const paid = Number(fee.amount_paid || 0);
      totals.billed += amount;
      totals.collected += paid;
      totals.pending += Math.max(amount - paid, 0);
      if (fee.status === 'overdue') totals.overdue += Math.max(amount - paid, 0);
      return totals;
    },
    { billed: 0, collected: 0, pending: 0, overdue: 0 }
  );
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

function getProgramSummaries(batches) {
  const programMap = {};

  batches.forEach((batch) => {
    const streams = batch.streams?.length ? batch.streams : ['Unassigned'];
    streams.forEach((program) => {
      const current = programMap[program] || {
        id: program,
        program,
        batches: 0,
        students: 0,
      };
      current.batches += 1;
      current.students += Number(batch.studentCount || 0);
      programMap[program] = current;
    });
  });

  return Object.values(programMap);
}

export function OwnerAnalyticsScreen() {
  const { overview, batches, loading, error } = useOwnerLiveData();
  const programSummaries = useMemo(() => getProgramSummaries(batches), [batches]);
  const attentionBatches = [...batches]
    .sort((first, second) => Number(second.studentCount || 0) - Number(first.studentCount || 0))
    .slice(0, 4);
  const attendanceRate = overview?.attendancePercent;
  const testAverage = overview?.testAverage;

  return (
    <OwnerShell
      title="Institute Analytics"
      subtitle="Branch strength, batch health, and academic signals in one place."
    >
      <View style={styles.grid}>
        <StatCard icon={Users} value={loading ? '...' : overview?.totalStudents || 0} label="Students" meta={`${overview?.activeBatches || 0} batches`} color="#2563EB" />
        <StatCard icon={BookOpen} value={loading ? '...' : overview?.studyMaterials || 0} label="Materials" meta={`${overview?.lectures || 0} lectures`} color="#28388F" />
        <StatCard icon={UserCheck} value={attendanceRate == null ? 'N/A' : `${attendanceRate}%`} label="Attendance" meta="Recorded sessions" color="#2B58ED" />
        <StatCard icon={TrendingUp} value={testAverage == null ? 'N/A' : `${testAverage}%`} label="Test Avg" meta="Published results" color="#EA580C" />
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <SectionHeader title="Branch Coverage" caption="Live batch and student counts by centre" />
      {(overview?.branches || []).map((branch) => (
        <RowItem
          key={branch.branch || 'Unassigned'}
          icon={Building2}
          title={branch.branch || 'Unassigned'}
          meta={`${branch.batches} batches`}
          value={`${branch.students} students`}
          color="#2563EB"
        />
      ))}

      <SectionHeader title="Program Mix" caption="Live stream allocation across active batches" />
      {programSummaries.map((program) => (
        <RowItem
          key={program.id}
          icon={BookOpen}
          title={program.program}
          meta={`${program.batches} batches`}
          value={`${program.students} students`}
          color="#28388F"
        />
      ))}

      <SectionHeader title="Largest Batches" caption="Batches with the highest current enrolment" />
      {attentionBatches.map((batch) => (
        <RowItem
          key={batch.id}
          icon={Users}
          title={batch.label || batch.name}
          meta={`${batch.location || 'No location'} • Standard ${batch.standard || 'N/A'} • ${batch.academicYear || 'No year'}`}
          value={`${batch.studentCount || 0} students`}
          color="#EA580C"
        />
      ))}
    </OwnerShell>
  );
}

export function OwnerRevenueScreen() {
  const { fees, loading, error } = useOwnerLiveData();
  const totals = useMemo(() => getFeeTotals(fees), [fees]);
  const collectionRate = totals.billed > 0
    ? Math.round((totals.collected / totals.billed) * 100)
    : 0;
  const pendingFees = [...fees]
    .filter((fee) => Number(fee.amount_paid || 0) < Number(fee.amount || 0))
    .sort((first, second) => (
      Number(second.amount || 0) - Number(second.amount_paid || 0)
    ) - (
      Number(first.amount || 0) - Number(first.amount_paid || 0)
    ))
    .slice(0, 10);

  return (
    <OwnerShell
      title="Revenue Watch"
      subtitle="Collection status, pending dues, and student-level fee follow-up."
      accent={['#2B58ED', '#1E3A8A']}
    >
      <View style={styles.grid}>
        <StatCard icon={Receipt} value={loading ? '...' : formatCurrency(totals.billed)} label="Billed" meta="Fee invoices" color="#2563EB" />
        <StatCard icon={IndianRupee} value={formatCurrency(totals.collected)} label="Collected" meta={`${collectionRate}% received`} color="#28388F" />
        <StatCard icon={TrendingDown} value={formatCurrency(totals.pending)} label="Pending" meta={`${pendingFees.length} visible invoices`} color="#DC2626" />
        <StatCard icon={Banknote} value={formatCurrency(totals.overdue)} label="Overdue" meta="Needs follow-up" color="#EA580C" />
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.collectionCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Overall Collection</Text>
            <Text style={styles.cardMeta}>
              {formatCurrency(totals.collected)} of {formatCurrency(totals.billed)}
            </Text>
          </View>
          <Text style={styles.successValue}>{collectionRate}%</Text>
        </View>
        <ProgressBar value={collectionRate} color="#28388F" />
        <View style={styles.threeStats}>
          <Text style={styles.smallStat}>{fees.length} invoices</Text>
          <Text style={styles.smallStat}>{pendingFees.length} pending</Text>
          <Text style={styles.smallStat}>{formatCurrency(totals.pending)} due</Text>
        </View>
      </View>

      <SectionHeader title="Due Student Follow-up" caption="Students requiring payment reminders" />
      {pendingFees.map((fee) => (
        <RowItem
          key={fee.id}
          icon={Users}
          title={fee.student_name || 'Student'}
          meta={`${fee.description || 'Fee'} • Due ${fee.due_date || 'not set'} • ${fee.status || 'pending'}`}
          value={formatCurrency(Number(fee.amount || 0) - Number(fee.amount_paid || 0))}
          color={fee.status === 'overdue' ? '#DC2626' : '#EA580C'}
        />
      ))}
      {!loading && pendingFees.length === 0 && (
        <Text style={styles.emptyText}>No pending fee invoices are available.</Text>
      )}
    </OwnerShell>
  );
}

export function OwnerBatchesScreen() {
  const { batches, loading, error } = useOwnerLiveData();
  const branches = useMemo(
    () => ['All', ...new Set(batches.map((batch) => batch.location).filter(Boolean))],
    [batches]
  );
  const [activeBranch, setActiveBranch] = useState('All');
  const visibleBatches = activeBranch === 'All'
    ? batches
    : batches.filter((batch) => batch.location === activeBranch);

  return (
    <OwnerShell
      title="Batch Control"
      subtitle="Live enrolment, streams, subjects, and academic details for every batch."
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

      {!!error && <Text style={styles.errorText}>{error}</Text>}
      <SectionHeader title="Active Batches" caption={`${visibleBatches.length} batches in view`} />
      {visibleBatches.map((batch) => (
        <View key={batch.id} style={styles.batchCard}>
          <View style={styles.batchTopRow}>
            <View style={styles.batchBadge}>
              <Text style={styles.batchBadgeText}>{batch.name?.slice(0, 3) || batch.id}</Text>
            </View>
            <View style={styles.batchCopy}>
              <Text style={styles.cardTitle}>{batch.label || batch.name}</Text>
              <Text style={styles.cardMeta}>
                {batch.location || 'No location'} • Standard {batch.standard || 'N/A'} • {batch.academicYear || 'No year'}
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </View>

          <View style={styles.batchStatsGrid}>
            <Text style={styles.batchStat}>{batch.studentCount || 0} students</Text>
            <Text style={styles.batchStat}>{batch.teacherCount || 0} teachers</Text>
            <Text style={styles.batchStat}>{batch.streams?.join(', ') || 'No stream'}</Text>
            <Text style={styles.batchStat}>{batch.subjects?.join(', ') || 'No subjects'}</Text>
          </View>
        </View>
      ))}
      {!loading && visibleBatches.length === 0 && (
        <Text style={styles.emptyText}>No batches are available for this branch.</Text>
      )}
    </OwnerShell>
  );
}

export function OwnerProfileScreen({ route, navigation }) {
  const { userProfile } = useUserSession();
  const { overview, fees } = useOwnerLiveData();
  const feeTotals = useMemo(() => getFeeTotals(fees), [fees]);
  const displayName = userProfile?.name || route?.params?.displayName || 'Owner';

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
            await clearAuthToken();
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
            <Text style={styles.contactText}>{userProfile?.email || 'Email not added'}</Text>
          </View>
          <View style={styles.contactRow}>
            <Phone size={14} color="#64748B" />
            <Text style={styles.contactText}>{userProfile?.phone || 'Phone not added'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard icon={Building2} value={overview?.branches?.length || 0} label="Branches" meta="Active centres" color="#2563EB" />
        <StatCard icon={BookOpen} value={overview?.activeBatches || 0} label="Batches" meta="Running now" color="#28388F" />
        <StatCard icon={Users} value={overview?.totalStudents || 0} label="Students" meta="Enrolled" color="#2B58ED" />
        <StatCard icon={IndianRupee} value={formatCurrency(feeTotals.pending)} label="Pending" meta="Fees due" color="#DC2626" />
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
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
    marginHorizontal: 16,
    marginTop: 14,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginHorizontal: 24,
    marginVertical: 18,
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
