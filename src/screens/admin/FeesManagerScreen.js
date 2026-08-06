import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banknote, PlusCircle, CheckCircle, Search, RefreshCw, X, ChevronRight } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

export default function FeesManagerScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New Invoice Form
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Update Invoice Form
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('due');
  const [updatingInvoice, setUpdatingInvoice] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, studentsRes] = await Promise.all([
        apiRequest('/operations/fees').catch(() => []),
        apiRequest('/admin/students').catch(() => ({ students: [] }))
      ]);
      setInvoices(invoicesRes);
      setStudents(studentsRes.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    loadData();
    return unsubscribe;
  }, [navigation]);

  const handleCreateInvoice = async () => {
    if (!selectedStudent) {
      Alert.alert('Error', 'Please select a student.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description.');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (!dueDate) {
      Alert.alert('Error', 'Please enter a due date (YYYY-MM-DD).');
      return;
    }

    setSubmittingInvoice(true);
    try {
      await apiRequest('/operations/fees', {
        method: 'POST',
        body: {
          studentAuthId: selectedStudent.auth_id,
          description: description.trim(),
          amount: Number(amount),
          dueDate: dueDate.trim()
        }
      });
      Alert.alert('Success', 'Fee invoice generated successfully!');
      setShowCreateModal(false);
      
      // Reset Form
      setSelectedStudent(null);
      setStudentSearch('');
      setDescription('');
      setAmount('');
      setDueDate('');
      
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create fee invoice.');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;
    if (amountPaidInput && (isNaN(amountPaidInput) || Number(amountPaidInput) < 0)) {
      Alert.alert('Error', 'Please enter a valid amount paid.');
      return;
    }

    setUpdatingInvoice(true);
    try {
      await apiRequest(`/operations/fees/${selectedInvoice.id}`, {
        method: 'PATCH',
        body: {
          amountPaid: amountPaidInput ? Number(amountPaidInput) : undefined,
          status: invoiceStatus,
          paymentReference: paymentReference.trim() || null
        }
      });
      Alert.alert('Success', 'Invoice updated successfully!');
      setShowUpdateModal(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update invoice.');
    } finally {
      setUpdatingInvoice(false);
    }
  };

  const openUpdateModal = (invoice) => {
    setSelectedInvoice(invoice);
    setAmountPaidInput(String(invoice.amount_paid || ''));
    setPaymentReference(invoice.payment_reference || '');
    setInvoiceStatus(invoice.status || 'due');
    setShowUpdateModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10B981'; // Green
      case 'partially_paid': return '#3B82F6'; // Blue
      case 'due': return '#F59E0B'; // Yellow
      case 'overdue': return '#EF4444'; // Red
      default: return '#64748B';
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inv.student_sdc_id && inv.student_sdc_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatusFilter === 'All' || inv.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredStudentDropdown = students.filter(s => 
    s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    (s.sdc_id && s.sdc_id.toLowerCase().includes(studentSearch.toLowerCase()))
  ).slice(0, 5);

  const renderInvoiceItem = ({ item }) => {
    const dueStr = new Date(item.due_date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return (
      <TouchableOpacity style={styles.invoiceCard} onPress={() => openUpdateModal(item)}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.studentName}>{item.student_name}</Text>
            <Text style={styles.sdcId}>SDC ID: {item.student_sdc_id || 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}16` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase().replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.invoiceDesc}>{item.description}</Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.metaLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.amountTotal}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>PAID / DUE DATE</Text>
            <Text style={styles.metaValue}>
              ₹{Number(item.amount_paid).toLocaleString('en-IN')} paid • {dueStr}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && invoices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28388F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fees Manager</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#28388F" />
        </TouchableOpacity>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or SDC ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
          <PlusCircle size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Create Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal filter pills */}
      <View style={styles.filterPillsRow}>
        {['All', 'due', 'paid', 'partially_paid', 'overdue'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, selectedStatusFilter === f && styles.filterPillActive]}
            onPress={() => setSelectedStatusFilter(f)}
          >
            <Text style={[styles.filterPillText, selectedStatusFilter === f && styles.filterPillTextActive]}>
              {f.toUpperCase().replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderInvoiceItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Banknote size={44} color="#94A3B8" />
            <Text style={styles.emptyText}>No invoices match your filters.</Text>
          </View>
        }
      />

      {/* CREATE MODAL */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate New Invoice</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.formBody}>
              {/* Student Search */}
              <Text style={styles.fieldLabel}>Search Student</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Type student name or SDC ID..."
                placeholderTextColor="#94A3B8"
                value={studentSearch}
                onChangeText={(text) => {
                  setStudentSearch(text);
                  setSelectedStudent(null);
                }}
              />
              {studentSearch.length > 0 && !selectedStudent && (
                <View style={styles.dropdownMenu}>
                  {filteredStudentDropdown.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedStudent(s);
                        setStudentSearch(s.student_name);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{s.student_name} ({s.sdc_id})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Description */}
              <Text style={styles.fieldLabel}>Fee Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Tuition Fee Term 1, Book kit charges..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
              />

              {/* Amount */}
              <Text style={styles.fieldLabel}>Invoice Amount (INR)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 15000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              {/* Due Date */}
              <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2026-09-30"
                placeholderTextColor="#94A3B8"
                value={dueDate}
                onChangeText={setDueDate}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submittingInvoice && { opacity: 0.7 }]}
                onPress={handleCreateInvoice}
                disabled={submittingInvoice}
              >
                {submittingInvoice ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Generate Invoice</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* UPDATE MODAL */}
      <Modal visible={showUpdateModal} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Payment Details</Text>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <View style={styles.formBody}>
                <Text style={styles.studentDetailName}>{selectedInvoice.student_name}</Text>
                <Text style={styles.studentDetailMeta}>
                  Invoice Total: ₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}
                </Text>

                {/* Amount Paid Input */}
                <Text style={styles.fieldLabel}>Amount Paid (INR)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="Enter amount paid..."
                  placeholderTextColor="#94A3B8"
                  value={amountPaidInput}
                  onChangeText={setAmountPaidInput}
                />

                {/* Payment Reference */}
                <Text style={styles.fieldLabel}>Payment Reference / Txn ID</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. UPI, NetBanking ID, Cash Receipt #"
                  placeholderTextColor="#94A3B8"
                  value={paymentReference}
                  onChangeText={setPaymentReference}
                />

                {/* Invoice Status Selector */}
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusRow}>
                  {['due', 'paid', 'partially_paid', 'overdue'].map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusSelectPill, invoiceStatus === s && { backgroundColor: getStatusColor(s), borderColor: getStatusColor(s) }]}
                      onPress={() => setInvoiceStatus(s)}
                    >
                      <Text style={[styles.statusSelectText, invoiceStatus === s && { color: '#FFFFFF' }]}>
                        {s.toUpperCase().replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, updatingInvoice && { opacity: 0.7 }]}
                  onPress={handleUpdateInvoice}
                  disabled={updatingInvoice}
                >
                  {updatingInvoice ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Update Invoice status</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 8,
    color: '#0F172A',
    fontSize: 13,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#28388F',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  filterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#28388F',
    borderColor: '#28388F',
  },
  filterPillText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  sdcId: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  invoiceDesc: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  amountTotal: {
    color: '#28388F',
    fontSize: 16,
    fontWeight: '800',
  },
  metaValue: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  formBody: {
    paddingVertical: 12,
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    color: '#0F172A',
    fontSize: 14,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#28388F',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  studentDetailName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  studentDetailMeta: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  statusSelectText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
  },
});
