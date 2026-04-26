import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Share2, Users, IndianRupee, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react-native';

const OWNER_METRICS = [
  { id: 'students', title: 'Total Students', value: '1,250', subtitle: 'Total Students', icon: Users, color: '#2563EB', tint: '#DBEAFE' },
  { id: 'fees_collected', title: 'Fees Collected', value: 'Rs48.75L', subtitle: 'Fees Collected', icon: IndianRupee, color: '#16A34A', tint: '#DCFCE7' },
  { id: 'pending_fees', title: 'Pending Fees', value: 'Rs9.20L', subtitle: 'Pending Fees', icon: TrendingDown, color: '#DC2626', tint: '#FEE2E2' },
  { id: 'monthly_revenue', title: 'Monthly Revenue', value: 'Rs6.80L', subtitle: 'Monthly Revenue', icon: TrendingUp, color: '#9333EA', tint: '#F3E8FF' },
];

const TOP_BATCHES = [
  { id: 'b1', name: 'JEE Main Batch A', students: '85 Students', revenue: 'Rs4.25L', progress: '92%' },
  { id: 'b2', name: 'NEET Prime Batch', students: '72 Students', revenue: 'Rs3.90L', progress: '88%' },
  { id: 'b3', name: 'CET Target Batch', students: '64 Students', revenue: 'Rs2.75L', progress: '84%' },
];

export default function OwnerDashboardScreen({ route }) {
  const displayName = route?.params?.displayName || 'Natik Sir';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <LinearGradient colors={['#3556C8', '#2F4DB6']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greeting}>Good</Text>
              <Text style={styles.greeting}>Morning</Text>
              <Text style={styles.name}>{displayName}</Text>
            </View>

            <View style={styles.topActions}>
              <TouchableOpacity style={styles.inviteButton}>
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.inviteText}>Invite Friends</Text>
              </TouchableOpacity>

              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </View>

              <TouchableOpacity style={styles.iconButton}>
                <Bell size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.revenueCard}>
            <View style={styles.revenueBlock}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>Rs48.75L</Text>
            </View>
            <View style={styles.revenueBlock}>
              <Text style={styles.revenueLabel}>This Month</Text>
              <Text style={styles.revenueValue}>Rs6.80L</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.content}>
        <View style={styles.metricsGrid}>
          {OWNER_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <View key={metric.id} style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: metric.tint }]}>
                  <Icon size={22} color={metric.color} />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricSubtitle}>{metric.subtitle}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Batches</Text>
          {TOP_BATCHES.map((batch) => (
            <TouchableOpacity key={batch.id} style={styles.batchCard}>
              <View style={styles.batchHeader}>
                <Text style={styles.batchName}>{batch.name}</Text>
                <ChevronRight size={18} color="#94A3B8" />
              </View>
              <View style={styles.batchMetaRow}>
                <Text style={styles.batchMetaPrimary}>{batch.students}</Text>
                <Text style={styles.batchMetaSuccess}>{batch.revenue}</Text>
              </View>
              <Text style={styles.batchProgress}>{batch.progress}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    paddingBottom: 110,
  },
  header: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
    paddingBottom: 28,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
  },
  name: {
    marginTop: 2,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 120,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inviteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ownerBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCard: {
    marginTop: 26,
    marginHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueBlock: {
    flex: 1,
  },
  revenueLabel: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  revenueValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 18,
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
    borderRadius: 18,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  metricSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  batchName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  batchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  batchMetaPrimary: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  batchMetaSuccess: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '700',
  },
  batchProgress: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
