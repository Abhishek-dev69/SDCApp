import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronRight, Zap, TrendingUp, CheckCircle2, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');

const FILTERS = ['All', 'Physics', 'Chemistry', 'Math'];

export default function DoubtsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [doubts, setDoubts] = useState([]);

  const loadDoubts = () => {
    apiRequest('/operations/doubts')
      .then((data) => setDoubts(Array.isArray(data) ? data : []))
      .catch((err) => console.log('Doubts live data unavailable:', err.message));
  };

  useEffect(loadDoubts, []);

  const visibleDoubts = useMemo(
    () => doubts.filter((doubt) => (
      (activeFilter === 'All' || doubt.subject === activeFilter)
      && `${doubt.title} ${doubt.description}`.toLowerCase().includes(query.toLowerCase())
    )),
    [activeFilter, doubts, query]
  );

  const createDoubt = async () => {
    if (!query.trim()) {
      Alert.alert('Enter Your Doubt', 'Type your question in the search box first.');
      return;
    }
    try {
      await apiRequest('/operations/doubts', {
        method: 'POST',
        body: {
          subject: activeFilter === 'All' ? 'General' : activeFilter,
          title: query.trim().slice(0, 120),
          description: query.trim(),
        },
      });
      setQuery('');
      loadDoubts();
      Alert.alert('Doubt Submitted', 'Your question has been sent to the academic team.');
    } catch (err) {
      Alert.alert('Unable to Submit', err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Purple Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Doubts & AI Help</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#94A3B8" />
              <TextInput 
                placeholder="Search your doubt..." 
                style={styles.searchInput}
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Academic support submission */}
        <TouchableOpacity style={styles.aiBanner} onPress={createDoubt}>
          <LinearGradient
            colors={['#8E24AA', '#6A1B9A']}
            style={styles.aiBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.aiBannerContent}>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiBannerTitle}>Ask the Academic Team</Text>
              <Text style={styles.aiBannerSubtitle}>Send your question to your assigned faculty</Text>
            </View>
            <View style={styles.aiArrowBtn}>
              <ChevronRight size={24} color="#6A1B9A" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity 
              key={filter} 
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === filter && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trending Doubts */}
        <View style={styles.sectionHeader}>
          <View style={styles.trendingHeader}>
            <TrendingUp size={20} color="#28388f" />
            <Text style={styles.sectionTitle}>My Doubts</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {visibleDoubts.map((doubt) => (
          <TouchableOpacity key={doubt.id} style={styles.doubtCard}>
            <Text style={styles.doubtQuestion} numberOfLines={2}>{doubt.title}</Text>
            
            <View style={styles.doubtFooter}>
              <View style={styles.tagGroup}>
                <View style={styles.subjectTag}>
                  <Text style={styles.subjectTagText}>{doubt.subject}</Text>
                </View>
                {doubt.status === 'answered' || doubt.status === 'closed' ? (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={styles.verifiedText}>Faculty Answered</Text>
                  </View>
                ) : null}
              </View>
              
              <View style={styles.answerCount}>
                <MessageSquare size={16} color="#64748B" />
                <Text style={styles.answerText}>{doubt.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {visibleDoubts.length === 0 && (
          <Text style={styles.emptyText}>No doubts found. Type a question above and send it to the academic team.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#9b59b6',
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
  },
  aiBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    // shadow
    shadowColor: '#8E24AA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  aiBannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  aiBannerContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiTextContainer: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  aiArrowBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  filterBarContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#28388f',
    borderColor: '#28388f',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 24,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  viewAllText: {
    fontSize: 14,
    color: '#28388f',
    fontWeight: '600',
  },
  doubtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  doubtQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    lineHeight: 24,
    marginBottom: 16,
  },
  doubtFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectTagText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  answerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerText: {
    fontSize: 12,
    color: '#64748B',
  },
});
