import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Users, UserCheck, Plus } from 'lucide-react-native';

const MOCK_STUDENTS = [
  { id: '1', name: 'Kabir Singh', batch: 'Unassigned', currentClass: '12th' },
  { id: '2', name: 'Ishita Sharma', batch: 'NEET A7', currentClass: '12th' },
  { id: '3', name: 'Rahul Verma', batch: 'Unassigned', currentClass: '11th' },
];

const MOCK_TEACHERS = [
  { id: '1', name: 'Sanjay Gupta', subject: 'Biology', batch: 'NEET A7' },
  { id: '2', name: 'Dr. Meera Rao', subject: 'Physics', batch: 'Unassigned' },
];

const MOCK_BATCHES = ['NEET A7', 'JEE K8', 'Foundation B3'];

export default function AssignBatchScreen({ navigation }) {
  const [activeSegment, setActiveSegment] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);

  const handleAssign = (batch) => {
    Alert.alert(
      'Confirm Assignment',
      `Assign ${selectedPerson.name} to batch ${batch}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Assign', 
          onPress: () => {
            Alert.alert('Success', 'Assignment updated successfully!');
            setSelectedPerson(null);
          }
        }
      ]
    );
  };

  const renderPerson = ({ item }) => (
    <TouchableOpacity 
      style={[styles.personCard, selectedPerson?.id === item.id && styles.selectedCard]}
      onPress={() => setSelectedPerson(item)}
    >
      <View style={styles.personHeader}>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{item.name}</Text>
          <Text style={styles.personSubtext}>
            {activeSegment === 'students' ? item.currentClass : item.subject} • {item.batch}
          </Text>
        </View>
        <View style={[styles.statusBadge, item.batch === 'Unassigned' ? styles.unassignedBadge : styles.assignedBadge]}>
          <Text style={[styles.statusText, item.batch === 'Unassigned' ? styles.unassignedText : styles.assignedText]}>
            {item.batch === 'Unassigned' ? 'Unassigned' : 'Assigned'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Batch</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search by name..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentButton, activeSegment === 'students' && styles.activeSegment]}
          onPress={() => { setActiveSegment('students'); setSelectedPerson(null); }}
        >
          <Users size={18} color={activeSegment === 'students' ? '#28388f' : '#64748b'} />
          <Text style={[styles.segmentText, activeSegment === 'students' && styles.activeSegmentText]}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentButton, activeSegment === 'teachers' && styles.activeSegment]}
          onPress={() => { setActiveSegment('teachers'); setSelectedPerson(null); }}
        >
          <UserCheck size={18} color={activeSegment === 'teachers' ? '#28388f' : '#64748b'} />
          <Text style={[styles.segmentText, activeSegment === 'teachers' && styles.activeSegmentText]}>Teachers</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeSegment === 'students' ? MOCK_STUDENTS : MOCK_TEACHERS}
        keyExtractor={item => item.id}
        renderItem={renderPerson}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No {activeSegment} found matching your search.</Text>
        }
      />

      {selectedPerson && (
        <View style={styles.assignmentPanel}>
          <Text style={styles.panelTitle}>Assign {selectedPerson.name} to:</Text>
          <View style={styles.batchGrid}>
            {MOCK_BATCHES.map((batch) => (
              <TouchableOpacity 
                key={batch} 
                style={styles.batchChip}
                onPress={() => handleAssign(batch)}
              >
                <Plus size={16} color="#28388f" />
                <Text style={styles.batchChipText}>{batch}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeSegment: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeSegmentText: {
    color: '#28388f',
  },
  listContent: {
    padding: 20,
    paddingBottom: 20,
  },
  personCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectedCard: {
    borderColor: '#28388f',
    backgroundColor: '#f0f4ff',
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  personSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  unassignedBadge: {
    backgroundColor: '#fee2e2',
  },
  assignedBadge: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  unassignedText: {
    color: '#dc2626',
  },
  assignedText: {
    color: '#16a34a',
  },
  assignmentPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  batchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  batchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: '#28388f',
  },
  batchChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28388f',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 40,
  },
});
