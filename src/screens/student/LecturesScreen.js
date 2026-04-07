import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Zap,
  FlaskConical,
  Ruler,
  Dna,
  BookOpen,
  NotebookPen,
} from 'lucide-react-native';
import { useStudentSession } from '../../context/StudentSessionContext';
import {
  getAvailableMaterialTabs,
  getNotesSectionForBatch,
  getTextbookSectionsForBatch,
} from '../../data/studentBatches';

const SUBJECT_ICONS = {
  physics: Zap,
  chemistry: FlaskConical,
  mathematics: Ruler,
  biology: Dna,
};

const NOTES_BADGES = {
  physics: { label: 'Updated', backgroundColor: '#DBEAFE', textColor: '#2563EB' },
  biology: { label: 'AI Curated', backgroundColor: '#F3E8FF', textColor: '#9333EA' },
};

const SUBJECT_SHORT_NAMES = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  mathematics: 'Math',
  biology: 'Biology',
};

function getStudentDescriptor(batch) {
  if (!batch) {
    return '12th Science';
  }

  const programLabel = batch.program === 'CET'
    ? 'JEE Batch'
    : batch.program === 'NEET'
      ? 'NEET Batch'
      : `${batch.program} Batch`;

  return `12th Science • ${programLabel} ${batch.label}`;
}

function getSourceIntro(source) {
  return source === 'ncert'
    ? 'NCERT focus for NEET preparation'
    : 'Maharashtra board focus for CET/JEE preparation';
}

function getTextbookItemTitle(source, subject) {
  const sourcePrefix = source === 'ncert' ? 'NCERT' : 'Maharashtra';
  return `${sourcePrefix} ${SUBJECT_SHORT_NAMES[subject.id]}`;
}

export default function LecturesScreen({ navigation }) {
  const { selectedBatch } = useStudentSession();
  const notesSection = getNotesSectionForBatch(selectedBatch);
  const materialTabs = getAvailableMaterialTabs(selectedBatch);
  const textbookSections = getTextbookSectionsForBatch(selectedBatch);

  const defaultSource = materialTabs.find((tab) => tab.enabled)?.id || 'maharashtra';
  const [activeSource, setActiveSource] = useState(defaultSource);

  useEffect(() => {
    setActiveSource(defaultSource);
  }, [defaultSource]);

  const activeTextbookSection = useMemo(
    () => textbookSections.find((section) => section.source === activeSource) || textbookSections[0],
    [activeSource, textbookSections]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#2b58ed', '#2552cf']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          />
          <SafeAreaView edges={['top']}>
            <Text style={styles.heroTitle}>Study Material</Text>
            <Text style={styles.heroSubtitle}>{getStudentDescriptor(selectedBatch)}</Text>

            <View style={styles.segmentedControl}>
              {materialTabs.map((tab) => {
                const isActive = tab.id === activeSource;
                const isDisabled = !tab.enabled;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.segmentButton,
                      isActive && styles.segmentButtonActive,
                      isDisabled && styles.segmentButtonDisabled,
                    ]}
                    disabled={isDisabled}
                    onPress={() => setActiveSource(tab.id)}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        isActive && styles.segmentButtonTextActive,
                        isDisabled && styles.segmentButtonTextDisabled,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SafeAreaView>
        </View>

        {activeTextbookSection && (
          <View style={[styles.sectionCard, styles.booksCard]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, styles.booksIconWrap]}>
                <BookOpen size={18} color="#7C3AED" />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={styles.sectionTitle}>Books & Textbooks</Text>
                <Text style={styles.sectionSubtitle}>{getSourceIntro(activeTextbookSection.source)}</Text>
              </View>
            </View>

            {activeTextbookSection.subjects.map((subject, index) => {
              const IconComponent = SUBJECT_ICONS[subject.id];
              const badge = index === 0
                ? { label: 'Primary', backgroundColor: '#DCFCE7', textColor: '#16A34A' }
                : null;

              return (
                <TouchableOpacity
                  key={`${activeTextbookSection.id}-${subject.id}`}
                  style={styles.materialRow}
                  onPress={() =>
                    navigation.navigate('ChapterList', {
                      subject: subject.title,
                      materialSource: activeTextbookSection.title,
                    })
                  }
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconWrap, { backgroundColor: `${subject.accentColor}18` }]}>
                      <IconComponent size={24} color={subject.accentColor} />
                    </View>
                    <View style={styles.rowTextWrap}>
                      <View style={styles.rowTitleLine}>
                        <Text style={styles.rowTitle}>
                          {getTextbookItemTitle(activeTextbookSection.source, subject)}
                        </Text>
                        {badge && (
                          <View style={[styles.inlineBadge, { backgroundColor: badge.backgroundColor }]}>
                            <Text style={[styles.inlineBadgeText, { color: badge.textColor }]}>
                              {badge.label}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.rowMeta}>{subject.chapters}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, styles.notesIconWrap]}>
              <NotebookPen size={18} color="#FFFFFF" />
            </View>
            <View style={styles.sectionTextWrap}>
              <Text style={styles.sectionTitle}>{notesSection.title}</Text>
              <Text style={styles.sectionSubtitle}>Chapter-wise curated notes</Text>
            </View>
          </View>

          {notesSection.subjects.map((subject) => {
            const IconComponent = SUBJECT_ICONS[subject.id];
            const badge = NOTES_BADGES[subject.id];

            return (
              <TouchableOpacity
                key={`${notesSection.id}-${subject.id}`}
                style={styles.notesRow}
                onPress={() =>
                  navigation.navigate('ChapterList', {
                    subject: subject.title,
                    materialSource: notesSection.title,
                  })
                }
              >
                <View style={[styles.notesAccentBar, { backgroundColor: subject.borderColor }]} />
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIconWrap, { backgroundColor: `${subject.accentColor}18` }]}>
                    <IconComponent size={22} color={subject.accentColor} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <View style={styles.rowTitleLine}>
                      <Text style={styles.rowTitle}>{SUBJECT_SHORT_NAMES[subject.id]} Notes</Text>
                      {badge && (
                        <View style={[styles.inlineBadge, { backgroundColor: badge.backgroundColor }]}>
                          <Text style={[styles.inlineBadgeText, { color: badge.textColor }]}>
                            {badge.label}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowMeta}>{subject.chapters} Notes Available</Text>
                  </View>
                </View>
                <View style={styles.rowActionWrap}>
                  <Text style={styles.rowActionText}>View Notes</Text>
                  <ChevronRight size={18} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            );
          })}
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
    paddingBottom: 24,
  },
  heroCard: {
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTitle: {
    paddingHorizontal: 16,
    paddingTop: 18,
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    paddingHorizontal: 16,
    marginTop: 4,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentButtonDisabled: {
    opacity: 0.45,
  },
  segmentButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentButtonTextActive: {
    color: '#64748B',
  },
  segmentButtonTextDisabled: {
    color: '#CBD5E1',
  },
  sectionCard: {
    marginHorizontal: 14,
    marginBottom: 18,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  booksCard: {
    backgroundColor: '#FBF4FF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  booksIconWrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  notesIconWrap: {
    backgroundColor: '#7C3AED',
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  notesAccentBar: {
    width: 4,
    height: 44,
    borderRadius: 999,
    marginRight: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  rowMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  inlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  inlineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rowActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  rowActionText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
    marginRight: 4,
  },
});
