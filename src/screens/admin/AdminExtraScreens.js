import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldAlert,
  BookOpen,
  MessageSquare,
  Send,
  Plus,
  Search,
  ChevronLeft,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Share2,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');

function Header({ title, onBack }) {
  return (
    <View style={styles.header}>
      <LinearGradient colors={['#2b58ed', '#1e3a8a']} style={styles.headerGradient} />
      <SafeAreaView edges={['top']}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// 1. DISCIPLINARY LOGS SCREEN
export function DisciplinaryManagerScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [studentSdcId, setStudentSdcId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [incidentType, setIncidentType] = useState('Late Arrival');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/disciplinary');
      setLogs(data || []);
    } catch (err) {
      console.log('Error fetching disciplinary logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleLogIncident = async () => {
    if (!studentSdcId.trim() || !incidentType.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in Student SDC ID, Incident Type and Description.');
      return;
    }

    try {
      await apiRequest('/admin/disciplinary', {
        method: 'POST',
        body: {
          studentSdcId: studentSdcId.trim(),
          studentName: studentName.trim() || 'Student',
          incidentType,
          description: description.trim(),
          actionTaken: actionTaken.trim() || 'Log created',
        },
      });
      Alert.alert('Success', 'Disciplinary incident logged successfully.');
      setModalVisible(false);
      // Reset form
      setStudentSdcId('');
      setStudentName('');
      setDescription('');
      setActionTaken('');
      fetchLogs();
    } catch (err) {
      Alert.alert('Error', 'Failed to log disciplinary incident.');
    }
  };

  const filteredLogs = logs.filter(log =>
    (log.student_name && log.student_name.toLowerCase().includes(search.toLowerCase())) ||
    log.student_sdc_id.includes(search) ||
    log.incident_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header title="Disciplinary Logs" onBack={() => navigation.goBack()} />

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" />
          <TextInput
            placeholder="Search by student name or ID..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Log</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2b58ed" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <ShieldAlert size={14} color="#dc2626" />
                  <Text style={styles.typeBadgeText}>{item.incident_type}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(item.incident_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </Text>
              </View>

              <Text style={styles.studentLabel}>{item.student_name} ({item.student_sdc_id})</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
              
              {!!item.action_taken && (
                <View style={styles.actionBlock}>
                  <Text style={styles.actionLabel}>Action: {item.action_taken}</Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No disciplinary logs found.</Text>
          }
        />
      )}

      {/* Log Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Disciplinary Incident</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Student SDC ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 26200414"
                value={studentSdcId}
                onChangeText={setStudentSdcId}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Student Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Aarav Patel"
                value={studentName}
                onChangeText={setStudentName}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Incident Type *</Text>
              <View style={styles.selectRow}>
                {['Late Arrival', 'Incomplete Homework', 'Disorderly Conduct', 'Other'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.selectChip, incidentType === type && styles.selectChipActive]}
                    onPress={() => setIncidentType(type)}
                  >
                    <Text style={[styles.selectChipText, incidentType === type && styles.selectChipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Incident Description *</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Provide a detailed description of the incident..."
                value={description}
                onChangeText={setDescription}
                multiline
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Action Taken</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Verbal warning, Parents notified"
                value={actionTaken}
                onChangeText={setActionTaken}
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleLogIncident}>
                  <Text style={styles.submitBtnText}>Submit Log</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 2. PORTION TRACKER SCREEN
export function PortionTrackerScreen({ navigation }) {
  const [portions, setPortions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [batchName, setBatchName] = useState('JEE K8');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [percentage, setPercentage] = useState('');
  const [loggedBy, setLoggedBy] = useState('');

  const fetchPortions = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/portions');
      setPortions(data || []);
    } catch (err) {
      console.log('Error fetching portions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortions();
  }, []);

  const handleUpdatePortion = async () => {
    if (!subject.trim() || !topic.trim() || !percentage.trim()) {
      Alert.alert('Error', 'Please fill in Subject, Topic, and Percentage.');
      return;
    }
    const percentVal = parseInt(percentage, 10);
    if (isNaN(percentVal) || percentVal < 0 || percentVal > 100) {
      Alert.alert('Error', 'Percentage must be between 0 and 100.');
      return;
    }

    try {
      await apiRequest('/admin/portions', {
        method: 'POST',
        body: {
          batchName,
          subject: subject.trim(),
          topic: topic.trim(),
          percentage: percentVal,
          loggedBy: loggedBy.trim() || 'Admin',
        },
      });
      Alert.alert('Success', 'Portion completion progress logged.');
      setModalVisible(false);
      setSubject('');
      setTopic('');
      setPercentage('');
      setLoggedBy('');
      fetchPortions();
    } catch (err) {
      Alert.alert('Error', 'Failed to log portion progress.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Portion Tracker" onBack={() => navigation.goBack()} />

      <View style={styles.portionHeaderSection}>
        <Text style={styles.sectionSubtitle}>Syllabus portion updates sent to Owner</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2b58ed" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={portions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.batchBadge}>
                  <BookOpen size={13} color="#2b58ed" />
                  <Text style={styles.batchBadgeText}>{item.batch_name}</Text>
                </View>
                <Text style={styles.progressPctText}>{item.percentage}%</Text>
              </View>

              <Text style={styles.portionSubject}>{item.subject} • {item.topic}</Text>
              
              <View style={styles.portionProgressBg}>
                <View style={[styles.portionProgressFill, { width: `${item.percentage}%` }]} />
              </View>

              <View style={styles.portionFooter}>
                <Text style={styles.loggedByText}>By: {item.logged_by || 'Admin'}</Text>
                <Text style={styles.dateText}>
                  {new Date(item.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No portion tracking logs found.</Text>
          }
        />
      )}

      {/* Portion Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Portions Completed</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Batch *</Text>
              <View style={styles.selectRow}>
                {['JEE K8', 'NEET A7', 'CET PCM1'].map(batch => (
                  <TouchableOpacity
                    key={batch}
                    style={[styles.selectChip, batchName === batch && styles.selectChipActive]}
                    onPress={() => setBatchName(batch)}
                  >
                    <Text style={[styles.selectChipText, batchName === batch && styles.selectChipTextActive]}>
                      {batch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Physics"
                value={subject}
                onChangeText={setSubject}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Topic / Chapter *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rotational Dynamics"
                value={topic}
                onChangeText={setTopic}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Percentage Completed (0-100) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 85"
                value={percentage}
                onChangeText={setPercentage}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Logged By / Teacher</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dr. Vivek Sharma"
                value={loggedBy}
                onChangeText={setLoggedBy}
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleUpdatePortion}>
                  <Text style={styles.submitBtnText}>Submit Progress</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 3. ANONYMOUS FEEDBACK VIEWER SCREEN
export function FeedbackViewerScreen({ navigation }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/feedback');
      setFeedbacks(data || []);
    } catch (err) {
      console.log('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Anonymous Feedback" onBack={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator size="large" color="#2b58ed" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={feedbacks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: item.category === 'Infrastructure' ? '#fee2e2' : item.category === 'Teaching' ? '#dcfce7' : '#fef9c3' }
                ]}>
                  <Text style={[
                    styles.categoryBadgeText,
                    { color: item.category === 'Infrastructure' ? '#991b1b' : item.category === 'Teaching' ? '#166534' : '#854d0e' }
                  ]}>
                    {item.category || 'General'}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </Text>
              </View>

              <Text style={styles.feedbackBody}>"{item.feedback_text}"</Text>
              
              <View style={styles.feedbackFooter}>
                <User size={13} color="#64748b" />
                <Text style={styles.roleLabelText}>Role: Anonymous ({item.user_role})</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No feedback messages received.</Text>
          }
        />
      )}
    </View>
  );
}

// 4. SMS / WHATSAPP BROADCAST SCREEN
export function SMSBroadcastScreen({ navigation }) {
  const [batch, setBatch] = useState('JEE K8');
  const [channel, setChannel] = useState('WhatsApp');
  const [template, setTemplate] = useState('Test Scores');
  const [customMsg, setCustomMsg] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/broadcast');
      setLogs(data || []);
    } catch (err) {
      console.log('Error fetching broadcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleSend = async () => {
    let msgPreview = '';
    if (template === 'Test Scores') {
      msgPreview = `Dear Parent, recent test results for ${batch} have been updated. Log in to your SDC app to view the performance trends.`;
    } else if (template === 'Attendance Alert') {
      msgPreview = `Alert: Your child was marked ABSENT for today's lecture in batch ${batch}. Contact SDC Admin for clarifications.`;
    } else {
      if (!customMsg.trim()) {
        Alert.alert('Error', 'Please enter your custom message text.');
        return;
      }
      msgPreview = customMsg.trim();
    }

    try {
      await apiRequest('/admin/broadcast', {
        method: 'POST',
        body: {
          batchName: batch,
          channel,
          template,
          message: msgPreview,
        },
      });

      Alert.alert(
        'Broadcast Sent!',
        `Successfully triggered real ${channel} broadcast logs to all parents of batch ${batch}.\n\nPreview:\n"${msgPreview}"`
      );

      setCustomMsg('');
      fetchBroadcasts();
    } catch (err) {
      Alert.alert('Error', 'Failed to trigger broadcast.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Broadcast SMS / WhatsApp" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={[styles.modalTitle, { marginBottom: 16 }]}>New Broadcast</Text>

          <Text style={styles.inputLabel}>Select Target Batch *</Text>
          <View style={styles.selectRow}>
            {['JEE K8', 'NEET A7', 'CET PCM1'].map(b => (
              <TouchableOpacity
                key={b}
                style={[styles.selectChip, batch === b && styles.selectChipActive]}
                onPress={() => setBatch(b)}
              >
                <Text style={[styles.selectChipText, batch === b && styles.selectChipTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Communication Channel *</Text>
          <View style={styles.selectRow}>
            {['SMS', 'WhatsApp'].map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.selectChip, channel === c && styles.selectChipActive]}
                onPress={() => setChannel(c)}
              >
                <Text style={[styles.selectChipText, channel === c && styles.selectChipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Message Template *</Text>
          <View style={styles.selectRow}>
            {['Test Scores', 'Attendance Alert', 'Custom'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.selectChip, template === t && styles.selectChipActive]}
                onPress={() => setTemplate(t)}
              >
                <Text style={[styles.selectChipText, template === t && styles.selectChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {template === 'Custom' ? (
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', marginTop: 12 }]}
              placeholder="Enter custom message to broadcast..."
              value={customMsg}
              onChangeText={setCustomMsg}
              multiline
              placeholderTextColor="#94a3b8"
            />
          ) : (
            <View style={styles.templatePreviewCard}>
              <Text style={styles.previewLabel}>Auto-generated Message Preview:</Text>
              <Text style={styles.previewText}>
                {template === 'Test Scores'
                  ? `Dear Parent, recent test results for ${batch} have been updated. Log in to your SDC app to view the performance trends.`
                  : `Alert: Your child was marked ABSENT for today's lecture in batch ${batch}. Contact SDC Admin for clarifications.`
                }
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Send size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sendButtonText}>Send Broadcast</Text>
          </TouchableOpacity>
        </View>

        {/* Broadcast History */}
        <Text style={styles.sectionHeaderTitle}>Broadcast History</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#2b58ed" style={{ marginTop: 10 }} />
        ) : (
          logs.map(log => (
            <View key={log.id} style={styles.historyCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.historyBatchText}>{log.batch_name} • {log.channel}</Text>
                  <Text style={styles.historyTemplateText}>Type: {log.template}</Text>
                  <Text style={[styles.previewText, { fontSize: 12, marginTop: 4, color: '#475569' }]} numberOfLines={2}>
                    "{log.message}"
                  </Text>
                </View>
                <View style={styles.rightHistoryAlign}>
                  <View style={styles.sentStatusBadge}>
                    <CheckCircle2 size={12} color="#166534" />
                    <Text style={styles.sentStatusText}>{log.status || 'Sent'}</Text>
                  </View>
                  <Text style={styles.historyDateText}>
                    {new Date(log.sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 120,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#2b58ed',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#2b58ed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  studentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  actionBlock: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 40,
    fontSize: 14,
  },
  portionHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  batchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  batchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2b58ed',
    marginLeft: 4,
  },
  progressPctText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
  },
  portionSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  portionProgressBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  portionProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  portionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loggedByText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feedbackBody: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabelText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectChipActive: {
    backgroundColor: '#2b58ed',
    borderColor: '#2b58ed',
  },
  selectChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  selectChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: 'bold',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2b58ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  templatePreviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 13,
    color: '#0f172a',
    lineHeight: 18,
  },
  sendButton: {
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  historyBatchText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  historyTemplateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightHistoryAlign: {
    alignItems: 'flex-end',
  },
  sentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  sentStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
    marginLeft: 3,
  },
  historyDateText: {
    fontSize: 10,
    color: '#94a3b8',
  },
});
