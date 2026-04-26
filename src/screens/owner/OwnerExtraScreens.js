import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, ChevronRight, IndianRupee, Receipt, TrendingUp, Users } from 'lucide-react-native';

function OwnerShell({ title, subtitle, children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LinearGradient colors={['#3556C8', '#2F4DB6']} style={styles.heroGradient} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function OwnerAnalyticsScreen() {
  const analyticsCards = [
    { id: '1', title: 'Admissions Growth', value: '+18%', meta: 'Compared to last quarter', progress: 'Strong upward trend' },
    { id: '2', title: 'Average Batch Fill', value: '86%', meta: 'Across all active batches', progress: 'Healthy occupancy rate' },
    { id: '3', title: 'Lead Conversion', value: '63%', meta: 'Leads to enrollments', progress: 'Sales funnel conversion' },
  ];

  const insightRows = [
    { id: '1', label: 'Andheri branch', value: 'Highest new inquiries' },
    { id: '2', label: 'Kandivali branch', value: 'Best fee realization' },
    { id: '3', label: 'Goregaon branch', value: 'Top retention this month' },
  ];

  return (
    <OwnerShell
      title="Analytics"
      subtitle="Track growth, admissions, and branch performance."
    >
      <View style={styles.grid}>
        {analyticsCards.map((card) => (
          <View key={card.id} style={styles.gridCard}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardMeta}>{card.meta}</Text>
            <Text style={styles.cardHint}>{card.progress}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Branch Insights</Text>
        {insightRows.map((row) => (
          <View key={row.id} style={styles.listRow}>
            <View>
              <Text style={styles.listTitle}>{row.label}</Text>
              <Text style={styles.listMeta}>{row.value}</Text>
            </View>
            <ArrowUpRight size={18} color="#3556C8" />
          </View>
        ))}
      </View>
    </OwnerShell>
  );
}

export function OwnerRevenueScreen() {
  const summaryCards = [
    { id: '1', title: 'Fees Collected', value: 'Rs48.75L', meta: 'Current academic cycle', icon: IndianRupee, tint: '#DCFCE7', color: '#16A34A' },
    { id: '2', title: 'Pending Fees', value: 'Rs9.20L', meta: 'Awaiting collection', icon: Receipt, tint: '#FEE2E2', color: '#DC2626' },
    { id: '3', title: 'Monthly Revenue', value: 'Rs6.80L', meta: 'This month', icon: TrendingUp, tint: '#EDE9FE', color: '#7C3AED' },
  ];

  const paymentRows = [
    { id: '1', name: 'Andheri Premium Batch', amount: 'Rs1.85L', status: 'Collected 92%' },
    { id: '2', name: 'NEET Prime Fees', amount: 'Rs1.42L', status: 'Collected 88%' },
    { id: '3', name: 'CET Target Installments', amount: 'Rs95K', status: 'Collected 73%' },
  ];

  return (
    <OwnerShell
      title="Revenue"
      subtitle="Monitor collections, pending dues, and monthly cash flow."
    >
      {summaryCards.map((card) => {
        const Icon = card.icon;

        return (
          <View key={card.id} style={styles.card}>
            <View style={[styles.inlineIcon, { backgroundColor: card.tint }]}>
              <Icon size={18} color={card.color} />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardMeta}>{card.meta}</Text>
          </View>
        );
      })}

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Collection Highlights</Text>
        {paymentRows.map((row) => (
          <View key={row.id} style={styles.listRow}>
            <View>
              <Text style={styles.listTitle}>{row.name}</Text>
              <Text style={styles.listMeta}>{row.status}</Text>
            </View>
            <Text style={styles.amountText}>{row.amount}</Text>
          </View>
        ))}
      </View>
    </OwnerShell>
  );
}

export function OwnerBatchesScreen() {
  const batches = [
    { id: '1', title: 'JEE Main Batch A', value: '85 Students', meta: 'Revenue Rs4.25L', action: 'View details' },
    { id: '2', title: 'NEET Prime Batch', value: '72 Students', meta: 'Revenue Rs3.90L', action: 'View details' },
    { id: '3', title: 'CET Target Batch', value: '64 Students', meta: 'Revenue Rs2.75L', action: 'View details' },
    { id: '4', title: 'Foundation Scholars', value: '58 Students', meta: 'Revenue Rs2.10L', action: 'View details' },
  ];

  return (
    <OwnerShell
      title="Batches"
      subtitle="Review capacity, occupancy, and top-performing programs."
    >
      {batches.map((batch) => (
        <TouchableOpacity key={batch.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={[styles.inlineIcon, { backgroundColor: '#EEF2FF' }]}>
              <Users size={18} color="#3556C8" />
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </View>
          <Text style={styles.cardValue}>{batch.value}</Text>
          <Text style={styles.cardTitle}>{batch.title}</Text>
          <Text style={styles.cardMeta}>{batch.meta}</Text>
          <Text style={styles.cardHint}>{batch.action}</Text>
        </TouchableOpacity>
      ))}
    </OwnerShell>
  );
}

export function OwnerProfileScreen({ route }) {
  const displayName = route?.params?.displayName || 'Natik Sir';

  return (
    <OwnerShell
      title="Profile"
      subtitle={`Owner account for ${displayName}`}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>N</Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileRole}>Owner • SDC</Text>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Account Overview</Text>
        {[
          { id: '1', title: 'Role', value: 'Owner', meta: 'Full institute access' },
          { id: '2', title: 'Institute', value: 'SDC', meta: 'Owner dashboard profile' },
          { id: '3', title: 'Permissions', value: 'Financial + Operations', meta: 'Analytics, revenue, and batch overview' },
        ].map((card) => (
          <View key={card.id} style={styles.listRow}>
            <View>
              <Text style={styles.listTitle}>{card.title}</Text>
              <Text style={styles.listMeta}>{card.meta}</Text>
            </View>
            <Text style={styles.profileValue}>{card.value}</Text>
          </View>
        ))}
      </View>
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
    paddingBottom: 120,
  },
  hero: {
    overflow: 'hidden',
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    marginBottom: 18,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: 14,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionBlock: {
    paddingHorizontal: 14,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  inlineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '800',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardHint: {
    marginTop: 10,
    fontSize: 13,
    color: '#3556C8',
    fontWeight: '700',
  },
  listRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 4,
  },
  listMeta: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  amountText: {
    fontSize: 16,
    color: '#16A34A',
    fontWeight: '800',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    paddingVertical: 24,
    borderRadius: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3556C8',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 14,
    color: '#3556C8',
    fontWeight: '800',
    marginLeft: 12,
  },
});
