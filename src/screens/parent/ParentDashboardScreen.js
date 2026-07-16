import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Calendar, 
  FileText, 
  Banknote, 
  TrendingUp, 
  Bell, 
  ChevronRight,
  AlertCircle,
  Check
} from 'lucide-react-native';
import { useUserSession } from '../../context/UserSessionContext';
import { apiRequest } from '../../services/api';

export default function ParentDashboardScreen() {
  const { userProfile, activeChild, setActiveChild } = useUserSession();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [childData, setChildData] = useState({
    attendance: null,
    performance: null,
    fees: null,
  });
  const [showChildModal, setShowChildModal] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [callbackMessage, setCallbackMessage] = useState('');
  const [sendingCallback, setSendingCallback] = useState(false);

  const parentName = userProfile ? (userProfile.father_name || userProfile.mother_name || userProfile.name) : 'Parent';

  const fetchChildren = async () => {
    try {
      const data = await apiRequest('/parent/children');
      if (data.children && data.children.length > 0) {
        setChildren(data.children);
        // Default to first child if activeChild is not set
        if (!activeChild) {
          setActiveChild(data.children[0]);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch children:', err);
      setLoading(false);
    }
  };

  const fetchChildDetails = async (studentSdcId) => {
    try {
      const [attData, perfData, feeData] = await Promise.all([
        apiRequest(`/parent/child/${studentSdcId}/attendance`),
        apiRequest(`/parent/child/${studentSdcId}/performance`),
        apiRequest(`/parent/child/${studentSdcId}/fees`),
      ]);

      setChildData({
        attendance: attData,
        performance: perfData,
        fees: feeData,
      });
    } catch (err) {
      console.error('Failed to fetch child data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (activeChild) {
      setLoading(true);
      fetchChildDetails(activeChild.student_sdc_id);
    }
  }, [activeChild]);

  const selectChild = (child) => {
    setActiveChild(child);
    setShowChildModal(false);
  };

  const handleRequestCallback = async () => {
    if (!activeChild) return;
    setSendingCallback(true);
    try {
      const res = await apiRequest('/parent/request-callback', {
        method: 'POST',
        body: {
          studentSdcId: activeChild.student_sdc_id,
          subject: selectedSubject,
          message: callbackMessage || 'Requesting a phone callback to discuss recent academic progress.',
        }
      });
      
      Alert.alert(
        'Request Sent',
        res.message || 'Callback request submitted successfully!',
        [{ text: 'OK' }]
      );
      setShowCallbackModal(false);
      setCallbackMessage('');
    } catch (err) {
      console.error('Callback request failed:', err);
      Alert.alert('Request Failed', err.message || 'Unable to request callback. Please try again.');
    } finally {
      setSendingCallback(false);
    }
  };

  if (loading && !activeChild) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2b58ed" />
      </View>
    );
  }

  // Calculate upcoming tests (future dates)
  const upcomingTestsCount = childData.performance?.tests?.filter(
    (t) => t.due_at && new Date(t.due_at) > new Date()
  )?.length || 0;

  // Recent graded tests
  const recentTests = childData.performance?.tests?.filter((t) => t.score !== null).slice(0, 3) || [];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={['#2b58ed', '#1e3a8a']}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greetingText}>Good Morning,</Text>
                <Text style={styles.userNameText}>{parentName}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>Parent</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.inviteButton}
                  onPress={() => Alert.alert(
                    'Invite Co-Parent',
                    `Share SDC ID: "${activeChild?.student_sdc_id || 'N/A'}" with another parent to link their account.`,
                    [{ text: 'OK' }]
                  )}
                >
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={() => Alert.alert(
                    'Notifications',
                    `1. Attendance Marked: ${activeChild?.student_name || 'Ayush'} was marked PRESENT for Chemistry.\n\n2. New Test Published: Physics Electromagnetism Quiz is scheduled in 4 days.\n\n3. Fees Due: Outstanding course balance is unpaid.`,
                    [{ text: 'Dismiss' }]
                  )}
                >
                  <Bell size={24} color="#fff" />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Child Summary Card */}
            <TouchableOpacity 
              style={styles.childCard} 
              onPress={() => children.length > 1 && setShowChildModal(true)}
              disabled={children.length <= 1}
            >
              <View style={styles.childHeader}>
                <View style={styles.childAvatar}>
                  <Users size={24} color="#28388f" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.childName}>{activeChild?.student_name || 'No Child Assigned'}</Text>
                  <Text style={styles.childInfo}>
                    {activeChild ? `${activeChild.student_std} • ${activeChild.sdc_batch}` : 'Unassigned'}
                  </Text>
                </View>
                {children.length > 1 && (
                  <View style={styles.switchButton}>
                    <ChevronRight size={20} color="#64748b" />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.requestCallbackBtn}
              onPress={() => setShowCallbackModal(true)}
            >
              <Text style={styles.requestCallbackBtnText}>📞 Request Teacher Callback</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <MetricCard 
              title="Attendance" 
              value={childData.attendance ? `${childData.attendance.overall}%` : '0%'} 
              icon={Calendar} 
              color="#10b981" 
              bgColor="#ecfdf5" 
            />
            <MetricCard 
              title="Upcoming Tests" 
              value={String(upcomingTestsCount)} 
              icon={FileText} 
              color="#3b82f6" 
              bgColor="#eff6ff" 
            />
            <MetricCard 
              title="Fee Status" 
              value={childData.fees?.pendingFees > 0 ? "Due" : "Paid"} 
              icon={Banknote} 
              color={childData.fees?.pendingFees > 0 ? "#ef4444" : "#10b981"} 
              bgColor={childData.fees?.pendingFees > 0 ? "#fef2f2" : "#ecfdf5"} 
            />
            <MetricCard 
              title="Performance" 
              value={childData.performance ? `${childData.performance.averageScore}%` : '0%'} 
              icon={TrendingUp} 
              color="#8b5cf6" 
              bgColor="#f5f3ff" 
            />
          </View>

          {/* Fee Payment Alert */}
          {childData.fees?.pendingFees > 0 && (
            <TouchableOpacity style={styles.feeAlertCard}>
              <View style={[styles.alertIconBox, { backgroundColor: '#fee2e2' }]}>
                <AlertCircle size={24} color="#ef4444" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Fee Payment Due</Text>
                <Text style={styles.alertDescription}>
                  Outstanding balance of ₹{childData.fees.pendingFees.toLocaleString('en-IN')} is due.
                </Text>
              </View>
              <TouchableOpacity style={styles.payNowButton}>
                <Text style={styles.payNowText}>Pay Now</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Recent Results Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Test Results</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentTests.length > 0 ? (
            recentTests.map((test) => (
              <ResultItem 
                key={test.id}
                subject={`${test.subject} - ${test.title}`} 
                score={`${test.score}/${test.total_marks}`} 
                rank={`#${test.rank}`} 
                date={test.due_at ? new Date(test.due_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} 
              />
            ))
          ) : (
            <Text style={styles.noResultsText}>No recent test results available.</Text>
          )}
        </View>
      </ScrollView>

      {/* Sibling Switching Modal */}
      <Modal
        visible={showChildModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChildModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Child</Text>
            <FlatList
              data={children}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.childSelectItem, 
                    item.id === activeChild?.id && styles.childSelectItemActive
                  ]}
                  onPress={() => selectChild(item)}
                >
                  <View>
                    <Text style={styles.selectItemName}>{item.student_name}</Text>
                    <Text style={styles.selectItemDetails}>{item.student_std} • {item.sdc_batch}</Text>
                  </View>
                  {item.id === activeChild?.id && <Check size={20} color="#2b58ed" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowChildModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Callback Request Modal */}
      <Modal
        visible={showCallbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCallbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>Request Callback</Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              Select subject to request a callback from the teacher:
            </Text>
            
            <View style={styles.subjectContainer}>
              {['Mathematics', 'Physics', 'Chemistry', 'Biology'].map((subj) => (
                <TouchableOpacity
                  key={subj}
                  style={[
                    styles.subjectOption,
                    selectedSubject === subj && styles.subjectOptionActive
                  ]}
                  onPress={() => setSelectedSubject(subj)}
                >
                  <Text style={[
                    styles.subjectOptionText,
                    selectedSubject === subj && styles.subjectOptionTextActive
                  ]}>
                    {subj}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
              Optional message or reason for discussion:
            </Text>
            <TextInput
              style={styles.textInput}
              multiline={true}
              numberOfLines={4}
              placeholder="e.g., Discuss child's performance in recent Chemistry unit test."
              placeholderTextColor="#94a3b8"
              value={callbackMessage}
              onChangeText={setCallbackMessage}
            />

            <TouchableOpacity 
              style={[styles.submitModalButton, sendingCallback && { backgroundColor: '#94a3b8' }]}
              onPress={handleRequestCallback}
              disabled={sendingCallback}
            >
              <Text style={styles.submitModalButtonText}>
                {sendingCallback ? 'Submitting...' : 'Submit Request'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowCallbackModal(false)}
              disabled={sendingCallback}
            >
              <Text style={styles.closeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MetricCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconBox, { backgroundColor: bgColor }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
}

function ResultItem({ subject, score, rank, date }) {
  return (
    <View style={styles.resultItem}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultSubject}>{subject}</Text>
        <Text style={styles.resultDate}>{date}</Text>
      </View>
      <View style={styles.resultFooter}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
          <Text style={styles.rankLabel}> Rank</Text>
        </View>
      </View>
    </View>
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
  header: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 25,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#2b58ed',
  },
  childCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  childInfo: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  switchButton: {
    marginLeft: 'auto',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metricTitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  feeAlertCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 24,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  alertIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b91c1c',
  },
  alertDescription: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  },
  payNowButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payNowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2b58ed',
    fontWeight: '600',
  },
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2b58ed',
  },
  rankLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 20,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
  },
  childSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  childSelectItemActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  selectItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  selectItemDetails: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  closeModalButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
  },
  requestCallbackBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  requestCallbackBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  subjectOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    marginBottom: 8,
  },
  subjectOptionActive: {
    backgroundColor: '#2b58ed',
  },
  subjectOptionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  subjectOptionTextActive: {
    color: '#ffffff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: '#1e293b',
  },
  submitModalButton: {
    backgroundColor: '#2b58ed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
