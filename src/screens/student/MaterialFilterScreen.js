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
  ChevronLeft,
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

const CLASS_FILTERS = [
  { id: 11, label: '11th' },
  { id: 12, label: '12th' },
];

const NOTE_TYPE_LABELS = {
  notes: 'Chapter Notes',
  pyq: 'PYQs',
  assignment: 'Assignments',
  video: 'Videos',
};

const PYQ_YEAR_FILTERS = [2026, 2025, 2024, 2023];

const PYQ_SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'oldest', label: 'Oldest' },
];

function buildNotesItems(activeFilter, activeClass, noteData) {
  if (activeFilter === 'pyq') {
    return [
      { id: 'pyq-1', title: 'Final Board Paper', year: 2026, examDate: '2026-03-12', pdfUrl: noteData?.pyq || '' },
      { id: 'pyq-2', title: 'March Board Paper', year: 2025, examDate: '2025-03-09', pdfUrl: noteData?.pyq || '' },
      { id: 'pyq-3', title: 'Practice Board Paper', year: 2024, examDate: '2024-02-28', pdfUrl: noteData?.pyq || '' },
      { id: 'pyq-4', title: 'Revision Paper', year: 2023, examDate: '2023-03-05', pdfUrl: noteData?.pyq || '' },
    ];
  }

  return [1, 2, 3].map((item) => ({
    id: `${activeFilter}-${item}`,
    title: `${NOTE_TYPE_LABELS[activeFilter]} ${item}`,
    year: null,
    examDate: null,
    pdfUrl: noteData?.[activeFilter] || '',
    classLabel: `Class ${activeClass}`,
  }));
}

export default function MaterialFilterScreen({ route, navigation }) {
  const { subjectId, type, source, class: selectedClass } = route.params;

  const [query, setQuery] = useState('');
  const [activeClass, setActiveClass] = useState(selectedClass || 12);
  const [activeFilter, setActiveFilter] = useState('notes');
  const [activeYear, setActiveYear] = useState('all');
  const [activeSort, setActiveSort] = useState('latest');

  const chapters =
    PDF_DATA?.[subjectId]?.textbook?.[source]?.[activeClass] || [];

  const noteData =
    PDF_DATA?.[subjectId]?.notes?.[activeClass] || {};

  const resourceLabel = NOTE_TYPE_LABELS[activeFilter];
  const noteItems = buildNotesItems(activeFilter, activeClass, noteData)
    .filter((item) => activeFilter !== 'pyq' || activeYear === 'all' || item.year === activeYear)
    .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (activeFilter !== 'pyq') {
        return 0;
      }

      const first = new Date(a.examDate).getTime();
      const second = new Date(b.examDate).getTime();
      return activeSort === 'latest' ? second - first : first - second;
    });

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

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>
            {type === 'textbook' ? 'Textbook' : 'Study Material'}
          </Text>

          <Text style={styles.heroSubtitle}>
            {subjectId?.toUpperCase()}
          </Text>

          <View style={styles.searchBox}>
            <Search size={18} color="#64748B" />
            <TextInput
              placeholder={type === 'textbook' ? 'Search chapters...' : 'Search material...'}
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CLASS_FILTERS.map((item) => {
                const isActive = activeClass === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setActiveClass(item.id)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {type === 'notes' && (
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
            </View>
          )}

          {type === 'notes' && activeFilter === 'pyq' && (
            <>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Year</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    onPress={() => setActiveYear('all')}
                    style={[styles.chip, activeYear === 'all' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, activeYear === 'all' && styles.chipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {PYQ_YEAR_FILTERS.map((year) => {
                    const isActive = activeYear === year;

                    return (
                      <TouchableOpacity
                        key={year}
                        onPress={() => setActiveYear(year)}
                        style={[styles.chip, isActive && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {PYQ_SORT_OPTIONS.map((option) => {
                    const isActive = activeSort === option.id;

                    return (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() => setActiveSort(option.id)}
                        style={[styles.chip, isActive && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          )}
        </View>

        {/* 📚 TEXTBOOK */}
        {type === 'textbook' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCaption}>
              {chapters.length} chapter{chapters.length === 1 ? '' : 's'} available
            </Text>
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
                        title: chapter.title,
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

            {!chapters
              .filter((c) =>
                c?.title?.toLowerCase().includes(query.toLowerCase())
              ).length && (
              <Text style={styles.emptyStateText}>
                No chapters found for {activeClass}th with this search.
              </Text>
            )}
          </View>
        )}

        {/* 📝 NOTES */}
        {type === 'notes' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCaption}>
              {activeFilter === 'pyq'
                ? `${noteItems.length} PYQ paper${noteItems.length === 1 ? '' : 's'} available`
                : `${resourceLabel} for Class ${activeClass}`}
            </Text>
            {noteItems.map((item) => {
              const config = TYPE_CONFIG[activeFilter];
              const Icon = config.icon;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.materialRow}
                  onPress={() =>
                    navigation.navigate('PdfViewer', {
                      pdfUrl: item.pdfUrl,
                      title: item.title,
                      type: 'notes',
                    })
                  }
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconWrap, { backgroundColor: config.bg }]}>
                      <Icon size={20} color={config.color} />
                    </View>

                    <View>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowMeta}>
                        {activeFilter === 'pyq'
                          ? `${item.year} • ${item.examDate}`
                          : item.classLabel}
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={20} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}

            {!noteItems.length && (
              <Text style={styles.emptyStateText}>
                No material found for this filter.
              </Text>
            )}
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

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
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

  filterRow: {
    marginBottom: 10,
  },

  filterLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
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

  sectionCaption: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
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

  emptyStateText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    paddingVertical: 20,
  },
});
