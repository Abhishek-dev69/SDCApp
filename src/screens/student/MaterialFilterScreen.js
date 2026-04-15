import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PDF_DATA from '../../data/PDF_DATA';
import {
  ChevronRight,
  Search,
  BookOpen,
  NotebookPen,
  FileText,
  PlayCircle,
  ClipboardList,
} from 'lucide-react-native';

const TYPE_CONFIG = {
  textbook: { icon: BookOpen, color: '#3B82F6', bg: '#DBEAFE' },
  notes: { icon: NotebookPen, color: '#10B981', bg: '#D1FAE5' },
  pyq: { icon: FileText, color: '#F59E0B', bg: '#FEF3C7' },
  assignment: { icon: ClipboardList, color: '#8B5CF6', bg: '#EDE9FE' },
  video: { icon: PlayCircle, color: '#EF4444', bg: '#FEE2E2' },
};

export default function MaterialFilterScreen({ route, navigation }) {
  const { subjectId, type, source, class: selectedClass } = route.params;

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('notes');

  const chapters =
    PDF_DATA?.[subjectId]?.textbook?.ncert?.[selectedClass] || [];

  const noteData =
    PDF_DATA?.[subjectId]?.notes?.[selectedClass] || {};

  const noteTypes = [
    { id: 'notes', label: 'Notes' },
    { id: 'pyq', label: 'PYQs' },
    { id: 'assignment', label: 'Assignments' },
    { id: 'video', label: 'Videos' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#2b58ed', '#2552cf']}
            style={styles.heroGradient}
          />

          <Text style={styles.heroTitle}>
            {type === 'textbook' ? 'Textbook' : 'Study Material'}
          </Text>

          <Text style={styles.heroSubtitle}>
            {subjectId?.toUpperCase()}
          </Text>

          <View style={styles.searchBox}>
            <Search size={18} color="#64748B" />
            <TextInput
              placeholder="Search..."
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
          </View>

          {type === 'notes' && (
            <ScrollView horizontal>
              {noteTypes.map((item) => {
                const isActive = activeFilter === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setActiveFilter(item.id)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 📚 TEXTBOOK */}
        {type === 'textbook' && (
          <View style={styles.sectionCard}>
            {chapters
              .filter((c) =>
                c?.title?.toLowerCase().includes(query.toLowerCase())
              )
              .map((chapter) => {
                const config = TYPE_CONFIG.textbook;
                const Icon = config.icon;

                return (
                  <TouchableOpacity
                    key={chapter.id}
                    style={styles.materialRow}
                    onPress={() =>
                      navigation.navigate('PdfViewer', {
                        pdfUrl: chapter.url,
                        type: 'textbook',
                      })
                    }
                  >
                    <View style={styles.rowLeft}>
                      <View style={[styles.rowIconWrap, { backgroundColor: config.bg }]}>
                        <Icon size={20} color={config.color} />
                      </View>

                      <View>
                        <Text style={styles.rowTitle}>{chapter.title}</Text>
                      </View>
                    </View>

                    <ChevronRight size={20} color="#94A3B8" />
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {/* 📝 NOTES */}
        {type === 'notes' && (
          <View style={styles.sectionCard}>
            {[1, 2, 3].map((item) => {
              const config = TYPE_CONFIG[activeFilter];
              const Icon = config.icon;

              return (
                <TouchableOpacity
                  key={item}
                  style={styles.materialRow}
                  onPress={() =>
                    navigation.navigate('PdfViewer', {
                      pdfUrl: noteData?.[activeFilter] || '',
                      type: 'notes',
                    })
                  }
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconWrap, { backgroundColor: config.bg }]}>
                      <Icon size={20} color={config.color} />
                    </View>

                    <View>
                      <Text style={styles.rowTitle}>
                        {activeFilter.toUpperCase()} {item}
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={20} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollContent: {
    paddingBottom: 24,
  },

  heroCard: {
    padding: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },

  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },

  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    padding: 10,
  },

  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    marginRight: 8,
  },

  chipActive: {
    backgroundColor: '#fff',
  },

  chipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  chipTextActive: {
    color: '#2b58ed',
  },

  sectionCard: {
    marginHorizontal: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#fff',
  },

  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  rowMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
});