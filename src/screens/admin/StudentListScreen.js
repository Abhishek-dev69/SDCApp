import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2, Search } from 'lucide-react-native';
import { apiRequest, getDecodedToken } from '../../services/api';

export default function StudentListScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchText, setSearchText] = useState('');

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);

  const debounceRef = useRef(null);
  const adminLocationRef = useRef(null);
  const hasAppliedDefaultBranch = useRef(false);

  // Load branch + batch dropdown options once on mount
  useEffect(() => {
  apiRequest('/admin/students/branches')
    .then(data => setBranches(Array.isArray(data?.branches) ? data.branches : []))
    .catch(err => console.log('Branches fetch failed:', err.message));

  apiRequest('/admin/students/batches')
    .then(data => setBatches(Array.isArray(data?.batches) ? data.batches : []))
    .catch(err => console.log('Batches fetch failed:', err.message));

  getDecodedToken().then(decoded => {
    adminLocationRef.current = decoded?.location || null;
    setStudentsLoaded(true);
  });
}, []);

  // Once branches arrive, default-select the admin's own branch (match by prefix)
  useEffect(() => {
  if (!studentsLoaded || branches.length === 0) return;
  if (hasAppliedDefaultBranch.current) return;

  const match = adminLocationRef.current
    ? branches.find(b => b.toLowerCase().startsWith(adminLocationRef.current.toLowerCase()))
    : null;

  hasAppliedDefaultBranch.current = true;
  setSelectedBranch(match || null);
}, [branches, studentsLoaded]);

  const loadStudents = useCallback(async (branch, batch, search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branch) params.append('branch', branch);
      if (batch) params.append('batch', batch);
      if (search) params.append('search', search);

      const query = params.toString();
      const data = await apiRequest(`/admin/students${query ? `?${query}` : ''}`);
      setStudents(Array.isArray(data?.students) ? data.students : []);
    } catch (err) {
      Alert.alert('Unable to Load Students', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever branch or batch changes
  useEffect(() => {
    loadStudents(selectedBranch, selectedBatch, searchText);
  }, [selectedBranch, selectedBatch]);

  // Debounced re-fetch on search text changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadStudents(selectedBranch, selectedBatch, searchText);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchText]);

  // Refresh list whenever screen regains focus (e.g. after add/edit)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStudents(selectedBranch, selectedBatch, searchText);
    });
    return unsubscribe;
  }, [navigation, selectedBranch, selectedBatch, searchText]);

  const handleDeactivate = (student) => {
    Alert.alert(
      'Deactivate Student',
      `Are you sure you want to deactivate ${student.student_name}? This can be reversed later if needed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/admin/students/${student.id}/deactivate`, { method: 'PATCH' });
              loadStudents(selectedBranch, selectedBatch, searchText);
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not deactivate student.');
            }
          },
        },
      ]
    );
  };

  const renderStudentRow = ({ item }) => (
    <View style={styles.studentRow}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.student_name}</Text>
        <Text style={styles.studentMeta}>
          {item.sdc_id} · {item.sdc_branch} · {item.sdc_batch}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('AddEditStudentScreen', { studentId: item.id })}
        >
          <Pencil size={18} color="#28388f" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleDeactivate(item)}
        >
          <Trash2 size={18} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
const filteredBatches = batches.filter(b =>
  !selectedBranch || selectedBranch.toLowerCase().startsWith(b.location.toLowerCase())
);
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Students</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddEditStudentScreen')}
        >
          <Plus size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={16} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or SDC ID"
          placeholderTextColor="#94a3b8"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setBranchDropdownOpen(prev => !prev);
              setBatchDropdownOpen(false);
            }}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedBranch || 'All Branches'}
            </Text>
            <Text style={styles.dropdownArrow}>{branchDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {branchDropdownOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => { setSelectedBranch(null);setSelectedBatch(null); setBranchDropdownOpen(false); }}
              >
                <Text style={styles.dropdownItemText}>All Branches</Text>
              </TouchableOpacity>
              {branches.map(branch => (
                <TouchableOpacity
                  key={branch}
                  style={[styles.dropdownItem, selectedBranch === branch && styles.dropdownItemActive]}
                  onPress={() => { setSelectedBranch(branch); setSelectedBatch(null); setBranchDropdownOpen(false); }}
                >
                  <Text style={[styles.dropdownItemText, selectedBranch === branch && styles.dropdownItemTextActive]}>
                    {branch}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
</View>
<View style={{ height: 44}}>
        <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.batchChipRow}
  
>
  <TouchableOpacity
    style={[styles.batchChip, !selectedBatch && styles.batchChipActive]}
    onPress={() => setSelectedBatch(null)}
  >
    <Text style={[styles.batchChipText, !selectedBatch && styles.batchChipTextActive]}>All</Text>
  </TouchableOpacity>
  {filteredBatches.map(batch => (
    <TouchableOpacity
      key={batch.id}
      style={[styles.batchChip, selectedBatch === batch.name && styles.batchChipActive]}
      onPress={() => setSelectedBatch(prev => prev === batch.name ? null : batch.name)}
    >
      <Text style={[styles.batchChipText, selectedBatch === batch.name && styles.batchChipTextActive]}>
        {batch.name}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#28388f" />
        </View>
      ) : (
        
        <FlatList
          data={students}
          keyExtractor={item => String(item.id)}
          renderItem={renderStudentRow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>No students found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    // backgroundColor: 'red',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    zIndex: 100,
    height:60,
  },
  dropdownWrapper: {
    flex: 1,
    overflow: 'visible',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flexShrink: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 6,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#e8eaf6',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#1e293b',
  },
  dropdownItemTextActive: {
    color: '#28388f',
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,

  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 3,
  },
  studentMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchChipRow: {
  paddingHorizontal: 20,
  paddingTop: 12,
  paddingBottom: 4,
  marginBottom: 16,
  gap: 8,
  flexDirection: 'row',
  alignItems: 'center',
  height: 44,
},
batchChip: {
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
  backgroundColor: '#f1f5f9',
},
batchChipActive: {
  backgroundColor: '#28388f',
},
batchChipText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#64748b',
},
batchChipTextActive: {
  color: '#fff',
},
});