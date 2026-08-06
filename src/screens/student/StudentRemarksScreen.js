import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, RefreshCw, Star } from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { useUserSession } from '../../context/UserSessionContext';

export default function StudentRemarksScreen({ navigation }) {
  const { userProfile } = useUserSession();
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const isParent = userProfile?.role === 'parent';

  const loadRemarks = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/operations/remarks').catch(() => []);
      setRemarks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRemarks);
    loadRemarks();
    return unsubscribe;
  }, [navigation]);

  const renderRemarkItem = ({ item }) => {
    const dateStr = new Date(item.created_at || item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return (
      <View style={styles.remarkCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.teacherName}>By: {item.teacher_name || 'Teacher'}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
        
        {isParent && (
          <Text style={styles.childNameLabel}>For: {item.student_name || 'Child'}</Text>
        )}

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>

        <Text style={styles.remarkBody}>{item.remark_text}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28388F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isParent ? "Kids' Remarks & Performance" : "My Teacher Remarks"}
        </Text>
        <TouchableOpacity onPress={loadRemarks} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#28388F" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={remarks}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRemarkItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Award size={46} color="#94A3B8" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>
              No teacher remarks or notices have been logged.
            </Text>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
  },
  remarkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teacherName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  childNameLabel: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  categoryBadgeText: {
    color: '#6B21A8',
    fontSize: 11,
    fontWeight: '800',
  },
  remarkBody: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
