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
import {
  ChevronRight,
  Search,
  BookOpen,
  NotebookPen,
  FileText,
  PlayCircle,
  ClipboardList,
} from 'lucide-react-native';

const PDF_DATA = {
  physics: {
    textbook: {
      ncert: [
        { id: 1, title: 'NCERT Chapter 1', url: 'https://yourlink.com/ncert-phy-1.pdf' },
        { id: 2, title: 'NCERT Chapter 2', url: 'https://yourlink.com/ncert-phy-2.pdf' },
        { id: 3, title: 'NCERT Chapter 3', url: 'https://yourlink.com/ncert-phy-3.pdf' },
        { id: 4, title: 'NCERT Chapter 4', url: 'https://yourlink.com/ncert-phy-4.pdf' },
        { id: 5, title: 'NCERT Chapter 5', url: 'https://yourlink.com/ncert-phy-5.pdf' },
        { id: 6, title: 'NCERT Chapter 6', url: 'https://yourlink.com/ncert-phy-6.pdf' },
        { id: 7, title: 'NCERT Chapter 7', url: 'https://yourlink.com/ncert-phy-7.pdf' },
        { id: 8, title: 'NCERT Chapter 8', url: 'https://yourlink.com/ncert-phy-8.pdf' },
        { id: 9, title: 'NCERT Chapter 9', url: 'https://yourlink.com/ncert-phy-9.pdf' },
        { id: 10, title: 'NCERT Chapter 10', url: 'https://yourlink.com/ncert-phy-10.pdf' },
        { id: 11, title: 'NCERT Chapter 11', url: 'https://yourlink.com/ncert-phy-11.pdf' },
        { id: 12, title: 'NCERT Chapter 12', url: 'https://yourlink.com/ncert-phy-12.pdf' },
      ],
      maharashtra: [
        { id: 1, title: 'MH Chapter 1', url: 'https://yourlink.com/mh-phy-1.pdf' },
        { id: 2, title: 'MH Chapter 2', url: 'https://yourlink.com/mh-phy-2.pdf' },
        { id: 3, title: 'MH Chapter 3', url: 'https://yourlink.com/mh-phy-3.pdf' },
        { id: 4, title: 'MH Chapter 4', url: 'https://yourlink.com/mh-phy-4.pdf' },
        { id: 5, title: 'MH Chapter 5', url: 'https://yourlink.com/mh-phy-5.pdf' },
        { id: 6, title: 'MH Chapter 6', url: 'https://yourlink.com/mh-phy-6.pdf' },
        { id: 7, title: 'MH Chapter 7', url: 'https://yourlink.com/mh-phy-7.pdf' },
        { id: 8, title: 'MH Chapter 8', url: 'https://yourlink.com/mh-phy-8.pdf' },
        { id: 9, title: 'MH Chapter 9', url: 'https://yourlink.com/mh-phy-9.pdf' },
        { id: 10, title: 'MH Chapter 10', url: 'https://yourlink.com/mh-phy-10.pdf' },
        { id: 11, title: 'MH Chapter 11', url: 'https://yourlink.com/mh-phy-11.pdf' },
        { id: 12, title: 'MH Chapter 12', url: 'https://yourlink.com/mh-phy-12.pdf' },

      ],
    },
    notes: {
      notes: 'https://yourlink.com/phy-notes.pdf',
      pyq: 'https://yourlink.com/phy-pyq.pdf',
      assignment: 'https://yourlink.com/phy-assignment.pdf',
      video: 'https://yourlink.com/phy-video.pdf',
    },
  },
  chemistry: {
    textbook: {
      ncert: [
        { id: 1, title: 'NCERT Chapter 1', url: 'https://yourlink.com/ncert-che-1.pdf' },
        { id: 2, title: 'NCERT Chapter 2', url: 'https://yourlink.com/ncert-che-2.pdf' },
        { id: 3, title: 'NCERT Chapter 3', url: 'https://yourlink.com/ncert-che-3.pdf' },
        { id: 4, title: 'NCERT Chapter 4', url: 'https://yourlink.com/ncert-che-4.pdf' },
        { id: 5, title: 'NCERT Chapter 5', url: 'https://yourlink.com/ncert-che-5.pdf' },
        { id: 6, title: 'NCERT Chapter 6', url: 'https://yourlink.com/ncert-che-6.pdf' },
        { id: 7, title: 'NCERT Chapter 7', url: 'https://yourlink.com/ncert-che-7.pdf' },
        { id: 8, title: 'NCERT Chapter 8', url: 'https://yourlink.com/ncert-che-8.pdf' },
        { id: 9, title: 'NCERT Chapter 9', url: 'https://yourlink.com/ncert-che-9.pdf' },
        { id: 10, title: 'NCERT Chapter 10', url: 'https://yourlink.com/ncert-che-10.pdf' },
      ],
      maharashtra: [
        { id: 1, title: 'MH Chapter 1', url: 'https://yourlink.com/mh-che-1.pdf' },
        { id: 2, title: 'MH Chapter 2', url: 'https://yourlink.com/mh-che-2.pdf' },
        { id: 3, title: 'MH Chapter 3', url: 'https://yourlink.com/mh-che-3.pdf' },
        { id: 4, title: 'MH Chapter 4', url: 'https://yourlink.com/mh-che-4.pdf' },
        { id: 5, title: 'MH Chapter 5', url: 'https://yourlink.com/mh-che-5.pdf' },
        { id: 6, title: 'MH Chapter 6', url: 'https://yourlink.com/mh-che-6.pdf' },
        { id: 7, title: 'MH Chapter 7', url: 'https://yourlink.com/mh-che-7.pdf' },
        { id: 8, title: 'MH Chapter 8', url: 'https://yourlink.com/mh-che-8.pdf' },
        { id: 9, title: 'MH Chapter 9', url: 'https://yourlink.com/mh-che-9.pdf' },
        { id: 10, title: 'MH Chapter 10', url: 'https://yourlink.com/mh-che-10.pdf' },
        { id: 11, title: 'MH Chapter 11', url: 'https://yourlink.com/mh-che-11.pdf' },
      ],
    },
    notes: {
      notes: 'https://yourlink.com/che-notes.pdf',
      pyq: 'https://yourlink.com/che-pyq.pdf',
      assignment: 'https://yourlink.com/che-assignment.pdf',
      video: 'https://yourlink.com/che-video.pdf',
    },
  },    
  mathematics: {
    textbook: {
      ncert: [
        { id: 1, title: 'NCERT Chapter 1', url: 'https://yourlink.com/ncert-math-1.pdf' },
        { id: 2, title: 'NCERT Chapter 2', url: 'https://yourlink.com/ncert-math-2.pdf' },
        { id: 3, title: 'NCERT Chapter 3', url: 'https://yourlink.com/ncert-math-3.pdf' },
        { id: 4, title: 'NCERT Chapter 4', url: 'https://yourlink.com/ncert-math-4.pdf' },
        { id: 5, title: 'NCERT Chapter 5', url: 'https://yourlink.com/ncert-math-5.pdf' },
        { id: 6, title: 'NCERT Chapter 6', url: 'https://yourlink.com/ncert-math-6.pdf' },
      ],
        maharashtra: [
        { id: 1, title: 'MH Chapter 1', url: 'https://yourlink.com/mh-math-1.pdf' },
        { id: 2, title: 'MH Chapter 2', url: 'https://yourlink.com/mh-math-2.pdf' },
        { id: 3, title: 'MH Chapter 3', url: 'https://yourlink.com/mh-math-3.pdf' },
        { id: 4, title: 'MH Chapter 4', url: 'https://yourlink.com/mh-math-4.pdf' },
        { id: 5, title: 'MH Chapter 5', url: 'https://yourlink.com/mh-math-5.pdf' },
        { id: 6, title: 'MH Chapter 6', url: 'https://yourlink.com/mh-math-6.pdf' },
      ],
    },
    notes: {
      notes: 'https://yourlink.com/math-notes.pdf',
      pyq: 'https://yourlink.com/math-pyq.pdf',
      assignment: 'https://yourlink.com/math-assignment.pdf',
      video: 'https://yourlink.com/math-video.pdf',
    },
  },
  biology: {
    textbook: {
      ncert: [
        { id: 1, title: 'NCERT Chapter 1', url: 'https://yourlink.com/ncert-bio-1.pdf' },
        { id: 2, title: 'NCERT Chapter 2', url: 'https://yourlink.com/ncert-bio-2.pdf' },
        { id: 3, title: 'NCERT Chapter 3', url: 'https://yourlink.com/ncert-bio-3.pdf' },
        ],
        maharashtra: [
        { id: 1, title: 'MH Chapter 1', url: 'https://yourlink.com/mh-bio-1.pdf' },
        { id: 2, title: 'MH Chapter 2', url: 'https://yourlink.com/mh-bio-2.pdf' },
        { id: 3, title: 'MH Chapter 3', url: 'https://yourlink.com/mh-bio-3.pdf' },
      ],    
    },
    notes: {
      notes: 'https://yourlink.com/bio-notes.pdf',
      pyq: 'https://yourlink.com/bio-pyq.pdf',
      assignment: 'https://yourlink.com/bio-assignment.pdf',
      video: 'https://yourlink.com/bio-video.pdf',
    },
  },
};

const TYPE_CONFIG = {
  textbook: { icon: BookOpen, color: '#3B82F6', bg: '#DBEAFE' },
  notes: { icon: NotebookPen, color: '#10B981', bg: '#D1FAE5' },
  pyq: { icon: FileText, color: '#F59E0B', bg: '#FEF3C7' },
  assignment: { icon: ClipboardList, color: '#8B5CF6', bg: '#EDE9FE' },
  video: { icon: PlayCircle, color: '#EF4444', bg: '#FEE2E2' },
};

export default function MaterialFilterScreen({ route, navigation }) {
  const { subjectId, type, source } = route.params;

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('notes');

  const chapters =
    PDF_DATA[subjectId]?.textbook?.[source] || [];

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
                c.title.toLowerCase().includes(query.toLowerCase())
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
                      pdfUrl:
                        PDF_DATA[subjectId]?.notes[activeFilter],
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