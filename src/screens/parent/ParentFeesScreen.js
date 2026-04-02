import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Banknote, CreditCard, History, ChevronRight } from 'lucide-react-native';

export default function ParentFeesScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2ecc71', '#27ae60']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerTitle}>Fees</Text>
          
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Fees</Text>
            <Text style={styles.totalValue}>₹ 50,000</Text>
            <View style={styles.paymentProgress}>
              <View style={[styles.progressBar, { width: '90%' }]} />
            </View>
            <Text style={styles.progressText}>90% Paid</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Payment Breakdown */}
        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownCard, { borderColor: '#dcfce7' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#def7e9' }]}>
              <Banknote size={20} color="#27ae60" />
            </View>
            <Text style={styles.breakdownLabel}>Paid</Text>
            <Text style={[styles.breakdownValue, { color: '#27ae60' }]}>₹ 45,000</Text>
          </View>
          
          <View style={[styles.breakdownCard, { borderColor: '#fee2e2' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
              <CreditCard size={20} color="#ef4444" />
            </View>
            <Text style={styles.breakdownLabel}>Pending</Text>
            <Text style={[styles.breakdownValue, { color: '#ef4444' }]}>₹ 5,000</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>Pay Outstanding Fees</Text>
        </TouchableOpacity>

        {/* Payment History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <History size={20} color="#64748b" />
        </View>

        <HistoryItem date="Jan 15, 2026" amount="₹ 15,000" status="Success" refNo="TXN_982741" />
        <HistoryItem date="Oct 10, 2025" amount="₹ 15,000" status="Success" refNo="TXN_872145" />
        <HistoryItem date="Jul 05, 2025" amount="₹ 15,000" status="Success" refNo="TXN_762104" />
      </ScrollView>
    </View>
  );
}

function HistoryItem({ date, amount, status, refNo }) {
  return (
    <TouchableOpacity style={styles.historyItem}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyDate}>{date}</Text>
        <Text style={styles.historyRef}>Ref: {refNo}</Text>
      </View>
      <View style={styles.historyAmount}>
        <Text style={styles.amountText}>{amount}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    paddingTop: 10,
    marginBottom: 30,
  },
  totalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  paymentProgress: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#27ae60',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  historyRef: {
    fontSize: 12,
    color: '#94a3b8',
  },
  historyAmount: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
});
