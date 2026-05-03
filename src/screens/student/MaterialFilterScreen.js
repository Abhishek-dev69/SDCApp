import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Filter,
  FilterX,
  Layers,
  NotebookPen,
  PlayCircle,
  Search,
} from 'lucide-react-native';
import PDF_DATA from '../../data/PDF_DATA';

const SUBJECT_LABELS = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  mathematics: 'Mathematics',
  biology: 'Biology',
};

const SOURCE_LABELS = {
  ncert: 'NCERT Textbook',
  maharashtra: 'Maharashtra Textbook',
};

const TYPE_CONFIG = {
  textbook: { icon: BookOpen, color: '#28388F', bg: '#EEF2FF', label: 'Textbook' },
  notes: { icon: NotebookPen, color: '#28388F', bg: '#EEF2FF', label: 'Notes' },
  pyq: { icon: FileText, color: '#F59E0B', bg: '#FEF3C7', label: 'PYQs' },
  assignment: { icon: ClipboardList, color: '#7C3AED', bg: '#F3E8FF', label: 'Assignments' },
  video: { icon: PlayCircle, color: '#DC2626', bg: '#FEE2E2', label: 'Videos' },
};

const CLASS_FILTERS = [
  { id: 11, label: '11th', helper: 'Std 11' },
  { id: 12, label: '12th', helper: 'Std 12' },
];

const NOTE_TYPES = [
  { id: 'notes', label: 'Notes', helper: 'Chapter wise revision' },
  { id: 'pyq', label: 'PYQs', helper: 'Previous papers' },
  { id: 'assignment', label: 'Assignments', helper: 'Practice tasks' },
  { id: 'video', label: 'Videos', helper: 'Lecture support' },
];

const PYQ_YEAR_FILTERS = [2026, 2025, 2024, 2023];

const PYQ_SORT_OPTIONS = [
  { id: 'latest', label: 'Latest first' },
  { id: 'oldest', label: 'Oldest first' },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatExamDate(examDate) {
  if (!examDate) return '';

  const [year, month, day] = examDate.split('-');
  return `${Number(day)} ${MONTH_LABELS[Number(month) - 1]} ${year}`;
}

function buildNotesItems(activeFilter, activeClass, subjectLabel, noteData) {
  if (activeFilter === 'pyq') {
    return [
      { id: 'pyq-2026-final', title: `${subjectLabel} Board Paper`, year: 2026, examDate: '2026-03-12', pdfUrl: noteData?.pyq || '' },
      { id: 'pyq-2025-march', title: `${subjectLabel} March Paper`, year: 2025, examDate: '2025-03-09', pdfUrl: noteData?.pyq || '' },
      { id: 'pyq-2024-practice', title: `${subjectLabel} Practice Paper`, year: 2024, examDate: '2024-02-28', pdfUrl: noteData?.pyq || '' },
      { id: 'pyq-2023-revision', title: `${subjectLabel} Revision Paper`, year: 2023, examDate: '2023-03-05', pdfUrl: noteData?.pyq || '' },
    ];
  }

  const label = TYPE_CONFIG[activeFilter]?.label || 'Material';

  return [1, 2, 3].map((item) => ({
    id: `${activeFilter}-${activeClass}-${item}`,
    title: `${subjectLabel} ${label} ${item}`,
    year: null,
    examDate: null,
    pdfUrl: noteData?.[activeFilter] || '',
    classLabel: `Class ${activeClass}`,
  }));
}

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProgressPill({ text }) {
  return (
    <View style={styles.progressPill}>
      <CheckCircle2 size={14} color="#28388F" />
      <Text style={styles.progressPillText}>{text}</Text>
    </View>
  );
}

export default function MaterialFilterScreen({ route, navigation }) {
  const { subjectId, type, source, class: selectedClass } = route.params;

  const subjectLabel = SUBJECT_LABELS[subjectId] || 'Subject';
  const isTextbook = type === 'textbook';
  const initialClass = selectedClass || 12;

  const [query, setQuery] = useState('');
  const [activeClass, setActiveClass] = useState(initialClass);
  const [activeFilter, setActiveFilter] = useState('notes');
  const [activeYear, setActiveYear] = useState('all');
  const [activeSort, setActiveSort] = useState('latest');

  const chapters = PDF_DATA?.[subjectId]?.textbook?.[source]?.[activeClass] || [];
  const noteData = PDF_DATA?.[subjectId]?.notes?.[activeClass] || {};
  const normalizedQuery = query.trim().toLowerCase();

  const textbookItems = useMemo(() => {
    return chapters.filter((chapter) => chapter?.title?.toLowerCase().includes(normalizedQuery));
  }, [chapters, normalizedQuery]);

  const noteItems = useMemo(() => {
    return buildNotesItems(activeFilter, activeClass, subjectLabel, noteData)
      .filter((item) => activeFilter !== 'pyq' || activeYear === 'all' || item.year === activeYear)
      .filter((item) => item.title.toLowerCase().includes(normalizedQuery))
      .sort((firstItem, secondItem) => {
        if (activeFilter !== 'pyq') return 0;

        const first = new Date(firstItem.examDate).getTime();
        const second = new Date(secondItem.examDate).getTime();
        return activeSort === 'latest' ? second - first : first - second;
      });
  }, [activeClass, activeFilter, activeSort, activeYear, normalizedQuery, noteData, subjectLabel]);

  const resultCount = isTextbook ? textbookItems.length : noteItems.length;
  const activeResourceLabel = isTextbook
    ? SOURCE_LABELS[source] || 'Textbook'
    : TYPE_CONFIG[activeFilter]?.label || 'Study Material';
  const activeSummary = [
    `Class ${activeClass}`,
    activeResourceLabel,
    !isTextbook && activeFilter === 'pyq' && activeYear !== 'all' ? `${activeYear}` : null,
    !isTextbook && activeFilter === 'pyq' ? PYQ_SORT_OPTIONS.find((item) => item.id === activeSort)?.label : null,
  ].filter(Boolean).join(' / ');

  const clearFilters = () => {
    setQuery('');
    setActiveClass(initialClass);
    setActiveFilter('notes');
    setActiveYear('all');
    setActiveSort('latest');
  };

  const handleTypeChange = (filterId) => {
    setActiveFilter(filterId);
    if (filterId !== 'pyq') {
      setActiveYear('all');
      setActiveSort('latest');
    }
  };

  const openMaterial = (item, materialType) => {
    navigation.navigate('PdfViewer', {
      pdfUrl: item.pdfUrl || item.url,
      title: item.title,
      type: materialType,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <LinearGradient colors={['#2B58ED', '#1E3A8A']} style={styles.heroGradient} />

          <View style={styles.heroTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.heroBadge}>
              <Layers size={14} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>{activeResourceLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{subjectLabel}</Text>
          <Text style={styles.heroSubtitle}>
            {isTextbook ? 'Textbook chapters' : 'Notes, PYQs, assignments, and videos'}
          </Text>

          <View style={styles.searchBox}>
            <Search size={18} color="#64748B" />
            <TextInput
              placeholder={isTextbook ? 'Search chapter name' : 'Search notes, PYQs, assignments'}
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.filterPanel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleRow}>
              <Filter size={18} color="#28388F" />
              <Text style={styles.panelTitle}>Filters</Text>
            </View>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterGroupLabel}>Class</Text>
          <View style={styles.classSegment}>
            {CLASS_FILTERS.map((item) => {
              const isActive = activeClass === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.classOption, isActive && styles.classOptionActive]}
                  onPress={() => setActiveClass(item.id)}
                >
                  <Text style={[styles.classLabel, isActive && styles.classLabelActive]}>{item.label}</Text>
                  <Text style={[styles.classHelper, isActive && styles.classHelperActive]}>{item.helper}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!isTextbook && (
            <>
              <Text style={styles.filterGroupLabel}>Resource Type</Text>
              <View style={styles.typeGrid}>
                {NOTE_TYPES.map((item) => {
                  const config = TYPE_CONFIG[item.id];
                  const Icon = config.icon;
                  const isActive = activeFilter === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.typeOption, isActive && styles.typeOptionActive]}
                      onPress={() => handleTypeChange(item.id)}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: config.bg }]}>
                        <Icon size={18} color={config.color} />
                      </View>
                      <View style={styles.typeCopy}>
                        <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>{item.label}</Text>
                        <Text style={styles.typeHelper}>{item.helper}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {!isTextbook && activeFilter === 'pyq' && (
            <View style={styles.pyqPanel}>
              <View style={styles.pyqTitleRow}>
                <CalendarDays size={17} color="#F59E0B" />
                <Text style={styles.pyqTitle}>PYQ Filters</Text>
              </View>

              <Text style={styles.filterGroupLabel}>Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                <FilterChip label="All years" active={activeYear === 'all'} onPress={() => setActiveYear('all')} />
                {PYQ_YEAR_FILTERS.map((year) => (
                  <FilterChip key={year} label={`${year}`} active={activeYear === year} onPress={() => setActiveYear(year)} />
                ))}
              </ScrollView>

              <Text style={styles.filterGroupLabel}>Date Order</Text>
              <View style={styles.sortSegment}>
                {PYQ_SORT_OPTIONS.map((option) => {
                  const isActive = activeSort === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.sortButton, isActive && styles.sortButtonActive]}
                      onPress={() => setActiveSort(option.id)}
                    >
                      <Text style={[styles.sortText, isActive && styles.sortTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.activeSummaryCard}>
            <ProgressPill text={activeSummary} />
            <Text style={styles.resultCountText}>
              {resultCount} result{resultCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>{activeResourceLabel}</Text>
            <Text style={styles.resultsCaption}>{subjectLabel} / Class {activeClass}</Text>
          </View>

          {isTextbook && textbookItems.map((chapter, index) => {
            const config = TYPE_CONFIG.textbook;
            const Icon = config.icon;

            return (
              <TouchableOpacity
                key={`${chapter.id}-${activeClass}-${index}`}
                style={styles.materialRow}
                onPress={() => openMaterial(chapter, 'textbook')}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIconWrap, { backgroundColor: config.bg }]}>
                    <Icon size={21} color={config.color} />
                  </View>

                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{chapter.title}</Text>
                    <Text style={styles.rowMeta}>{SOURCE_LABELS[source] || 'Textbook'} / Class {activeClass}</Text>
                  </View>
                </View>

                <View style={styles.openButton}>
                  <Text style={styles.openButtonText}>Open</Text>
                  <ChevronRight size={16} color="#28388F" />
                </View>
              </TouchableOpacity>
            );
          })}

          {!isTextbook && noteItems.map((item) => {
            const config = TYPE_CONFIG[activeFilter];
            const Icon = config.icon;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.materialRow}
                onPress={() => openMaterial(item, 'notes')}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIconWrap, { backgroundColor: config.bg }]}>
                    <Icon size={21} color={config.color} />
                  </View>

                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowMeta}>
                      {activeFilter === 'pyq'
                        ? `${item.year} / ${formatExamDate(item.examDate)}`
                        : `${item.classLabel} / ${activeResourceLabel}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.openButton}>
                  <Text style={styles.openButtonText}>Open</Text>
                  <ChevronRight size={16} color="#28388F" />
                </View>
              </TouchableOpacity>
            );
          })}

          {!resultCount && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <FilterX size={24} color="#64748B" />
              </View>
              <Text style={styles.emptyTitle}>No material found</Text>
              <Text style={styles.emptyText}>
                Try another class, type, year, or search term.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                <Text style={styles.emptyButtonText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    paddingBottom: 110,
  },
  heroCard: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  filterPanel: {
    marginHorizontal: 14,
    marginTop: -10,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  clearText: {
    color: '#28388F',
    fontSize: 13,
    fontWeight: '800',
  },
  filterGroupLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 10,
  },
  classSegment: {
    flexDirection: 'row',
    gap: 10,
  },
  classOption: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    alignItems: 'center',
  },
  classOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#28388F',
  },
  classLabel: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '800',
  },
  classLabelActive: {
    color: '#28388F',
  },
  classHelper: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  classHelperActive: {
    color: '#28388F',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  typeOption: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 11,
  },
  typeOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#28388F',
  },
  typeIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  typeCopy: {
    flex: 1,
  },
  typeLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  typeLabelActive: {
    color: '#28388F',
  },
  typeHelper: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  pyqPanel: {
    marginTop: 14,
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pyqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  pyqTitle: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '800',
  },
  horizontalChips: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#28388F',
    borderColor: '#28388F',
  },
  filterChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortSegment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sortButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 11,
    paddingVertical: 9,
  },
  sortButtonActive: {
    backgroundColor: '#28388F',
  },
  sortText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  sortTextActive: {
    color: '#FFFFFF',
  },
  activeSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  progressPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  progressPillText: {
    flex: 1,
    color: '#28388F',
    fontSize: 11,
    fontWeight: '800',
  },
  resultCountText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  resultsSection: {
    marginHorizontal: 14,
    marginTop: 16,
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsTitle: {
    color: '#0F172A',
    fontSize: 21,
    fontWeight: '800',
  },
  resultsCaption: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  rowIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  rowMeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  openButtonText: {
    color: '#28388F',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  emptyButton: {
    backgroundColor: '#28388F',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
