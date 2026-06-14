import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Banknote, ChevronLeft, CreditCard, FileText, TrendingUp, Users } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

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
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => {
      setLoading(true);
      apiRequest('/operations/fees')
        .then((data) => setInvoices(Array.isArray(data) ? data : []))
        .catch((requestError) => {
          setInvoices([]);
          setError(
            requestError.status === 501
              ? 'Apply migration 003_academic_operations.sql to enable fees.'
              : requestError.message
          );
        })
        .finally(() => setLoading(false));
    };
    const unsubscribe = navigation.addListener('focus', load);
    load();
    return unsubscribe;
  }, [navigation]);

  const totals = useMemo(() => invoices.reduce((summary, invoice) => {
    const amount = Number(invoice.amount || 0);
    const paid = Number(invoice.amount_paid || 0);
    summary.expectedAmount += amount;
    summary.collectedAmount += paid;
    summary.pendingAmount += Math.max(amount - paid, 0);
    if (paid < amount) summary.dueStudents.add(invoice.student_auth_id);
    if (invoice.status === 'overdue') summary.overdueStudents.add(invoice.student_auth_id);
    return summary;
  }, {
    expectedAmount: 0,
    collectedAmount: 0,
    pendingAmount: 0,
    dueStudents: new Set(),
    overdueStudents: new Set(),
  }), [invoices]);
  totals.collectionRate = totals.expectedAmount
    ? Math.round((totals.collectedAmount / totals.expectedAmount) * 100)
    : 0;

  const batchSummaries = useMemo(() => Object.values(invoices.reduce((groups, invoice) => {
    const id = invoice.batch_id || 'unassigned';
    const current = groups[id] || {
      id,
      label: invoice.batch_name || 'Unassigned',
      name: invoice.batch_name ? `${invoice.batch_name} Batch` : 'Unassigned Batch',
      branch: invoice.batch_location || 'No location',
      expectedAmount: 0,
      collectedAmount: 0,
      pendingAmount: 0,
      dueStudents: new Set(),
      overdueStudents: new Set(),
      students: new Set(),
    };
    const amount = Number(invoice.amount || 0);
    const paid = Number(invoice.amount_paid || 0);
    current.expectedAmount += amount;
    current.collectedAmount += paid;
    current.pendingAmount += Math.max(amount - paid, 0);
    current.students.add(invoice.student_auth_id);
    if (paid < amount) current.dueStudents.add(invoice.student_auth_id);
    if (invoice.status === 'overdue') current.overdueStudents.add(invoice.student_auth_id);
    groups[id] = current;
    return groups;
  }, {})).map((batch) => ({
    ...batch,
    studentCount: batch.students.size,
    dueStudentCount: batch.dueStudents.size,
    overdueStudentCount: batch.overdueStudents.size,
    feePerStudent: batch.students.size ? batch.expectedAmount / batch.students.size : 0,
    collectionRate: batch.expectedAmount
      ? Math.round((batch.collectedAmount / batch.expectedAmount) * 100)
      : 0,
  })), [invoices]);

  const dueInvoices = invoices.filter(
    (invoice) => Number(invoice.amount_paid || 0) < Number(invoice.amount || 0)
  );

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
      meta: `${totals.overdueStudents.size} overdue students`,
      icon: CreditCard,
      color: '#DC2626',
    },
    {
      id: 'dueStudents',
      label: 'Students Due',
      value: totals.dueStudents.size,
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
        {!!error && <Text style={styles.errorText}>{error}</Text>}
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
            <Text style={styles.collectionFooterText}>{batchSummaries.length} batches</Text>
            <Text style={styles.collectionFooterText}>{totals.dueStudents.size} due students</Text>
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

            {batchSummaries.map((batch) => (
              <View key={batch.id} style={styles.batchCard}>
                <View style={styles.batchHeaderRow}>
                  <View style={styles.batchCodeCircle}>
                    <Text style={styles.batchCodeText}>{batch.label}</Text>
                  </View>
                  <View style={styles.batchInfo}>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <Text style={styles.batchMeta}>{batch.branch}</Text>
                  </View>
                  <View style={styles.duePill}>
                    <Text style={styles.duePillText}>{batch.dueStudentCount} due</Text>
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
                  <Text style={styles.overdueText}>{batch.overdueStudentCount} overdue</Text>
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

            {dueInvoices.map((student) => {
              const isOverdue = student.status === 'overdue';

              return (
                <View key={student.id} style={styles.studentDueCard}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>{(student.student_name || 'S').charAt(0)}</Text>
                  </View>
                  <View style={styles.studentDueInfo}>
                    <Text style={styles.studentName}>{student.student_name || student.student_sdc_id || 'Student'}</Text>
                    <Text style={styles.studentMeta}>
                      {student.batch_name || 'Unassigned'} • Due {student.due_date}
                    </Text>
                  </View>
                  <View style={styles.studentRight}>
                    <Text style={styles.studentAmount}>
                      {formatCurrency(Number(student.amount || 0) - Number(student.amount_paid || 0))}
                    </Text>
                    <View style={[styles.statusBadge, isOverdue && styles.overdueBadge]}>
                      <Text style={[styles.statusBadgeText, isOverdue && styles.overdueBadgeText]}>
                        {student.status || 'due'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {!loading && dueInvoices.length === 0 && (
              <Text style={styles.emptyText}>No pending fee invoices.</Text>
            )}
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
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
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
