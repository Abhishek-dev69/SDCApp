import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Banknote, ChevronLeft, CreditCard, FileText, TrendingUp, Users } from 'lucide-react-native';
import {
  ADMIN_BATCH_OVERVIEW,
  ADMIN_DUE_STUDENTS,
  formatCurrency,
  getAdminBatchTotals,
} from '../../data/adminBatchOverview';

function ProgressBar({ value, color = '#16A34A' }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function SummaryCard({ item }) {
  const Icon = item.icon;

  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${item.color}16` }]}>
        <Icon size={20} color={item.color} />
      </View>
      <Text style={styles.summaryValue}>{item.value}</Text>
      <Text style={styles.summaryLabel}>{item.label}</Text>
      <Text style={styles.summaryMeta}>{item.meta}</Text>
    </View>
  );
}

export default function AdminFinancesScreen({ navigation }) {
  const [activeView, setActiveView] = useState('batches');
  const totals = getAdminBatchTotals();

  const summaryCards = [
    {
      id: 'expected',
      label: 'Expected Fees',
      value: formatCurrency(totals.expectedAmount),
      meta: 'Full academic cycle',
      icon: FileText,
      color: '#2563EB',
    },
    {
      id: 'collected',
      label: 'Collected',
      value: formatCurrency(totals.collectedAmount),
      meta: `${totals.collectionRate}% collection rate`,
      icon: Banknote,
      color: '#16A34A',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: formatCurrency(totals.pendingAmount),
      meta: `${totals.overdueStudents} overdue students`,
      icon: CreditCard,
      color: '#DC2626',
    },
    {
      id: 'dueStudents',
      label: 'Students Due',
      value: totals.dueStudents,
      meta: 'Across all batches',
      icon: Users,
      color: '#EA580C',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient colors={['#047857', '#115E59']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Dashboard')}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerKicker}>Admin Finances</Text>
              <Text style={styles.headerTitle}>Batch Fees</Text>
              <Text style={styles.headerSubtitle}>
                Track collection, pending fees, and students due batch-wise.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <SummaryCard key={card.id} item={card} />
          ))}
        </View>

        <View style={styles.collectionPanel}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.panelTitle}>Overall Collection</Text>
              <Text style={styles.panelMeta}>
                {formatCurrency(totals.collectedAmount)} collected of {formatCurrency(totals.expectedAmount)}
              </Text>
            </View>
            <View style={styles.collectionBadge}>
              <TrendingUp size={14} color="#16A34A" />
              <Text style={styles.collectionBadgeText}>{totals.collectionRate}%</Text>
            </View>
          </View>
          <ProgressBar value={totals.collectionRate} />
          <View style={styles.collectionFooter}>
            <Text style={styles.collectionFooterText}>{totals.activeBatches} batches</Text>
            <Text style={styles.collectionFooterText}>{totals.dueStudents} due students</Text>
            <Text style={styles.collectionFooterText}>{formatCurrency(totals.pendingAmount)} pending</Text>
          </View>
        </View>

        <View style={styles.segmentShell}>
          <TouchableOpacity
            style={[styles.segmentButton, activeView === 'batches' && styles.activeSegmentButton]}
            onPress={() => setActiveView('batches')}
          >
            <Text style={[styles.segmentText, activeView === 'batches' && styles.activeSegmentText]}>
              Batch Fees
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, activeView === 'dues' && styles.activeSegmentButton]}
            onPress={() => setActiveView('dues')}
          >
            <Text style={[styles.segmentText, activeView === 'dues' && styles.activeSegmentText]}>
              Due Students
            </Text>
          </TouchableOpacity>
        </View>

        {activeView === 'batches' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Batch Wise Fees</Text>
              <Text style={styles.sectionCaption}>Collection status for every active batch</Text>
            </View>

            {ADMIN_BATCH_OVERVIEW.map((batch) => (
              <View key={batch.id} style={styles.batchCard}>
                <View style={styles.batchHeaderRow}>
                  <View style={styles.batchCodeCircle}>
                    <Text style={styles.batchCodeText}>{batch.label}</Text>
                  </View>
                  <View style={styles.batchInfo}>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <Text style={styles.batchMeta}>{batch.branch} • {batch.program} • {batch.stream}</Text>
                  </View>
                  <View style={styles.duePill}>
                    <Text style={styles.duePillText}>{batch.dueStudents} due</Text>
                  </View>
                </View>

                <View style={styles.feeInfoRow}>
                  <View>
                    <Text style={styles.feeLabel}>Fee / student</Text>
                    <Text style={styles.feeValue}>{formatCurrency(batch.feePerStudent)}</Text>
                  </View>
                  <View>
                    <Text style={styles.feeLabel}>Students</Text>
                    <Text style={styles.feeValue}>{batch.studentCount}</Text>
                  </View>
                  <View>
                    <Text style={styles.feeLabel}>Pending</Text>
                    <Text style={[styles.feeValue, styles.pendingValue]}>{formatCurrency(batch.pendingAmount)}</Text>
                  </View>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.amountCollected}>{formatCurrency(batch.collectedAmount)} collected</Text>
                  <Text style={styles.amountExpected}>{formatCurrency(batch.expectedAmount)} total</Text>
                </View>
                <ProgressBar value={batch.collectionRate} color={batch.collectionRate >= 85 ? '#16A34A' : '#EA580C'} />

                <View style={styles.batchFooterRow}>
                  <Text style={styles.batchFooterText}>{batch.collectionRate}% collection</Text>
                  <Text style={styles.overdueText}>{batch.overdueStudents} overdue</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Due Students</Text>
              <Text style={styles.sectionCaption}>Students requiring fee follow-up this cycle</Text>
            </View>

            {ADMIN_DUE_STUDENTS.map((student) => {
              const isOverdue = student.status === 'Overdue';

              return (
                <View key={student.id} style={styles.studentDueCard}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>{student.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.studentDueInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentMeta}>
                      {student.batchName} • {student.branch} • Due {student.dueDate}
                    </Text>
                  </View>
                  <View style={styles.studentRight}>
                    <Text style={styles.studentAmount}>{formatCurrency(student.amount)}</Text>
                    <View style={[styles.statusBadge, isOverdue && styles.overdueBadge]}>
                      <Text style={[styles.statusBadgeText, isOverdue && styles.overdueBadgeText]}>
                        {student.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerKicker: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  summaryMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
    lineHeight: 15,
  },
  collectionPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  panelTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  panelMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },
  collectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  collectionBadgeText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  collectionFooterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentShell: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 13,
    padding: 4,
    marginTop: 18,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
  },
  activeSegmentButton: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  activeSegmentText: {
    color: '#047857',
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
    marginTop: 4,
    lineHeight: 18,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  batchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchCodeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  batchCodeText: {
    color: '#047857',
    fontSize: 16,
    fontWeight: '800',
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  batchMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  duePill: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  duePillText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  feeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  feeLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  feeValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  pendingValue: {
    color: '#DC2626',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  amountCollected: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },
  amountExpected: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  batchFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  batchFooterText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  overdueText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  studentDueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#B45309',
    fontSize: 16,
    fontWeight: '800',
  },
  studentDueInfo: {
    flex: 1,
  },
  studentName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  studentMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  studentRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  studentAmount: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '800',
  },
  overdueBadge: {
    backgroundColor: '#FEF2F2',
  },
  overdueBadgeText: {
    color: '#DC2626',
  },
});
