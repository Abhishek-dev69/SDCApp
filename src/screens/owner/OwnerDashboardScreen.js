import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  ChevronRight,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react-native';
import {
  ADMIN_BATCH_OVERVIEW,
  formatCurrency,
  getAdminBatchTotals,
  getBranchSummaries,
} from '../../data/adminBatchOverview';

function ProgressBar({ value, color = '#28388F', trackColor = '#E2E8F0' }) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${item.color}16` }]}>
        <Icon size={20} color={item.color} />
      </View>
      <Text style={styles.metricValue}>{item.value}</Text>
      <Text style={styles.metricLabel}>{item.label}</Text>
      <Text style={styles.metricMeta}>{item.meta}</Text>
    </View>
  );
}

function WatchRow({ icon: Icon, title, meta, value, color }) {
  return (
    <View style={styles.watchRow}>
      <View style={[styles.watchIcon, { backgroundColor: `${color}16` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.watchCopy}>
        <Text style={styles.watchTitle}>{title}</Text>
        <Text style={styles.watchMeta}>{meta}</Text>
      </View>
      <Text style={[styles.watchValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function OwnerDashboardScreen({ route }) {
  const displayName = route?.params?.displayName || 'Natik Sir';
  const totals = getAdminBatchTotals();
  const branches = getBranchSummaries();
  const lowestCollectionBatch = [...ADMIN_BATCH_OVERVIEW].sort((first, second) => first.collectionRate - second.collectionRate)[0];
  const topRevenueBatches = [...ADMIN_BATCH_OVERVIEW]
    .sort((first, second) => second.collectedAmount - first.collectedAmount)
    .slice(0, 3);

  const metrics = [
    {
      id: 'students',
      label: 'Students',
      value: totals.totalStudents,
      meta: `${totals.activeBatches} active batches`,
      icon: Users,
      color: '#2563EB',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      value: `${totals.averageAttendance}%`,
      meta: 'Institute average',
      icon: UserCheck,
      color: '#28388F',
    },
    {
      id: 'pending',
      label: 'Pending Fees',
      value: formatCurrency(totals.pendingAmount),
      meta: `${totals.dueStudents} students due`,
      icon: TrendingDown,
      color: '#DC2626',
    },
    {
      id: 'occupancy',
      label: 'Seat Fill',
      value: `${totals.occupancyRate}%`,
      meta: `${totals.totalStudents}/${totals.totalCapacity} seats`,
      icon: BookOpen,
      color: '#EA580C',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <LinearGradient colors={['#2B58ED', '#1E3A8A']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.titleBlock}>
              <Text style={styles.kicker}>Owner Overview</Text>
              <Text style={styles.ownerName}>{displayName}</Text>
              <Text style={styles.ownerMeta}>SDC Classes • institute snapshot</Text>
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <Bell size={19} color="#FFFFFF" />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.collectionPanel}>
            <View style={styles.rowBetween}>
              <Text style={styles.collectionLabel}>Fees Collected</Text>
              <View style={styles.collectionBadge}>
                <TrendingUp size={14} color="#FFFFFF" />
                <Text style={styles.collectionBadgeText}>{totals.collectionRate}%</Text>
              </View>
            </View>
            <Text style={styles.collectionValue}>{formatCurrency(totals.collectedAmount)}</Text>
            <Text style={styles.collectionMeta}>
              {formatCurrency(totals.pendingAmount)} pending from {totals.dueStudents} students
            </Text>
            <ProgressBar value={totals.collectionRate} color="#FFFFFF" trackColor="rgba(255,255,255,0.18)" />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.content}>
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <MetricCard key={metric.id} item={metric} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Important Watch</Text>
          <Text style={styles.sectionCaption}>The things that need the owner’s attention first</Text>
        </View>

        <View style={styles.panel}>
          <WatchRow
            icon={IndianRupee}
            title="Fee follow-up required"
            meta={`${totals.overdueStudents} students are overdue`}
            value={formatCurrency(totals.pendingAmount)}
            color="#DC2626"
          />
          <WatchRow
            icon={AlertTriangle}
            title={`${lowestCollectionBatch.name} collection is low`}
            meta={`${lowestCollectionBatch.branch} • ${lowestCollectionBatch.dueStudents} due students`}
            value={`${lowestCollectionBatch.collectionRate}%`}
            color="#EA580C"
          />
          <WatchRow
            icon={UserCheck}
            title="Attendance health"
            meta="Average across all batches"
            value={`${totals.averageAttendance}%`}
            color="#28388F"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Branch Watch</Text>
          <Text style={styles.sectionCaption}>Students, occupancy, and pending dues by branch</Text>
        </View>

        {branches.map((branch) => (
          <View key={branch.id} style={styles.branchRow}>
            <View style={styles.branchHeader}>
              <View>
                <Text style={styles.branchName}>{branch.branch}</Text>
                <Text style={styles.branchMeta}>{branch.batches} batches • {branch.students} students</Text>
              </View>
              <Text style={styles.branchDue}>{formatCurrency(branch.pendingAmount)} due</Text>
            </View>
            <ProgressBar value={branch.occupancyRate} color="#2563EB" />
            <View style={styles.branchStatsRow}>
              <Text style={styles.branchStat}>{branch.occupancyRate}% filled</Text>
              <Text style={styles.branchStat}>{branch.attendance}% attendance</Text>
              <Text style={styles.branchStat}>{branch.testAverage}% score</Text>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Revenue Batches</Text>
          <Text style={styles.sectionCaption}>Batches contributing most to collection</Text>
        </View>

        {topRevenueBatches.map((batch) => (
          <TouchableOpacity key={batch.id} style={styles.batchCard}>
            <View style={styles.batchCode}>
              <Text style={styles.batchCodeText}>{batch.label}</Text>
            </View>
            <View style={styles.batchCopy}>
              <Text style={styles.batchName}>{batch.name}</Text>
              <Text style={styles.batchMeta}>{batch.branch} • {batch.program} • {batch.studentCount} students</Text>
            </View>
            <View style={styles.batchRight}>
              <Text style={styles.batchAmount}>{formatCurrency(batch.collectedAmount)}</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 116,
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  titleBlock: {
    flex: 1,
  },
  kicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  ownerName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  ownerMeta: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    marginTop: 4,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  collectionPanel: {
    marginHorizontal: 18,
    marginTop: 22,
    marginBottom: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  collectionLabel: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '700',
  },
  collectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  collectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  collectionValue: {
    color: '#FFFFFF',
    fontSize: 35,
    fontWeight: '800',
    marginTop: 12,
  },
  collectionMeta: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    marginTop: 5,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  metricMeta: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  sectionHeader: {
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
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  watchIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  watchCopy: {
    flex: 1,
  },
  watchTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  watchMeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  watchValue: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 10,
  },
  branchRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  branchName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  branchMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },
  branchDue: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 7,
    overflow: 'hidden',
    marginTop: 13,
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
  },
  branchStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 11,
  },
  branchStat: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  batchCode: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  batchCodeText: {
    color: '#28388F',
    fontSize: 15,
    fontWeight: '800',
  },
  batchCopy: {
    flex: 1,
  },
  batchName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  batchMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },
  batchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchAmount: {
    color: '#28388F',
    fontSize: 13,
    fontWeight: '800',
  },
});
