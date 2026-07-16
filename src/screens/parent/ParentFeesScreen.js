import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Banknote, CreditCard, History, ChevronRight } from 'lucide-react-native';
import { useUserSession } from '../../context/UserSessionContext';
import { apiRequest, API_URL, getAuthToken } from '../../services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ParentFeesScreen() {
  const { activeChild } = useUserSession();
  const [loading, setLoading] = useState(true);
  const [feeData, setFeeData] = useState(null);

  const fetchFees = async (studentSdcId) => {
    try {
      const data = await apiRequest(`/parent/child/${studentSdcId}/fees`);
      setFeeData(data);
    } catch (err) {
      console.error('Failed to fetch fees data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (amountToPay) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      // Generate a dynamic linking redirect URI back to this app screen
      const redirectUrl = Linking.createURL('/parent-tabs/fees');
      const checkoutUrl = `${API_URL}/parent/fees/checkout?studentSdcId=${activeChild.student_sdc_id}&amount=${amountToPay}&token=${token}&redirectUrl=${encodeURIComponent(redirectUrl)}`;

      console.log('[PAYMENT] Opening checkout URL:', checkoutUrl);

      // Open the hosted checkout page in a secure browser window
      await WebBrowser.openBrowserAsync(checkoutUrl);

      // Refresh data
      setLoading(true);
      fetchFees(activeChild.student_sdc_id);
    } catch (err) {
      console.error('Payment initiation error:', err);
      Alert.alert('Payment Error', 'Unable to initiate payment. Please try again.');
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    if (paymentId.startsWith('TXN_')) {
      Alert.alert(
        'Offline Record',
        'This transaction was recorded offline. PDF receipts are only generated for online payments.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      const receiptUrl = `${API_URL}/parent/fees/receipt/${paymentId}?token=${token}`;
      const localFileUri = `${FileSystem.cacheDirectory}receipt_${paymentId}.pdf`;

      // Download the PDF from our backend
      const downloadResult = await FileSystem.downloadAsync(receiptUrl, localFileUri);

      if (downloadResult.status !== 200) {
        Alert.alert('Download Error', 'Unable to fetch PDF receipt from server.');
        return;
      }

      // Open share dialog
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Payment Receipt ${paymentId}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      console.error('Failed to download receipt:', err);
      Alert.alert('Download Error', 'Unable to retrieve PDF receipt at this time.');
    }
  };

  useEffect(() => {
    if (activeChild) {
      setLoading(true);
      fetchFees(activeChild.student_sdc_id);
    }
  }, [activeChild]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  if (!activeChild) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#2ecc71', '#27ae60']}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <Text style={styles.headerTitle}>Fees</Text>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No child profile selected.</Text>
        </View>
      </View>
    );
  }

  const totalFees = feeData?.totalFees || 0;
  const paidFees = feeData?.paidFees || 0;
  const pendingFees = feeData?.pendingFees || 0;
  const paidPercentage = feeData?.paidPercentage || 0;
  const history = feeData?.history || [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2ecc71', '#27ae60']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerTitle}>Fees</Text>
          
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Course Fees</Text>
            <Text style={styles.totalValue}>₹ {totalFees.toLocaleString('en-IN')}</Text>
            <View style={styles.paymentProgress}>
              <View style={[styles.progressBar, { width: `${paidPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>{paidPercentage}% Paid</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Payment Breakdown */}
        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownCard, { borderColor: '#dcfce7' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#def7e9' }]}>
              <Banknote size={20} color="#27ae60" />
            </View>
            <Text style={styles.breakdownLabel}>Paid</Text>
            <Text style={[styles.breakdownValue, { color: '#27ae60' }]}>
              ₹ {paidFees.toLocaleString('en-IN')}
            </Text>
          </View>
          
          <View style={[styles.breakdownCard, { borderColor: '#fee2e2' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
              <CreditCard size={20} color="#ef4444" />
            </View>
            <Text style={styles.breakdownLabel}>Pending</Text>
            <Text style={[styles.breakdownValue, { color: '#ef4444' }]}>
              ₹ {pendingFees.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {pendingFees > 0 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.payButton}
              onPress={() => handlePayment(pendingFees)}
            >
              <Text style={styles.payButtonText}>Pay Outstanding Fees (₹ {pendingFees.toLocaleString('en-IN')})</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testPayButton}
              onPress={() => handlePayment(1)}
            >
              <Text style={styles.testPayButtonText}>Pay ₹ 1 (Test Live Keys)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <History size={20} color="#64748b" />
        </View>

        {history.length > 0 ? (
          history.map((txn, index) => (
            <HistoryItem 
              key={index}
              date={txn.date} 
              amount={txn.amount} 
              status={txn.status} 
              refNo={txn.refNo} 
              onPress={() => handleDownloadReceipt(txn.refNo)}
            />
          ))
        ) : (
          <Text style={styles.noHistoryText}>No payments recorded yet.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function HistoryItem({ date, amount, status, refNo, onPress }) {
  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress}>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
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
  buttonContainer: {
    marginBottom: 40,
  },
  payButton: {
    backgroundColor: '#27ae60',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
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
  testPayButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  testPayButtonText: {
    color: '#fff',
    fontSize: 16,
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
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 20,
  },
});
