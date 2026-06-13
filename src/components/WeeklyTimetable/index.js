import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SUBJECT_COLORS = {
  Physics: '#28388f',
  Chemistry: '#10B981',
  Mathematics: '#F59E0B',
  Biology: '#EF4444',
  Default: '#64748b',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES = {
  scheduled:   { bg: '#e8eaf6', text: '#28388f', label: 'Scheduled' },
  in_progress: { bg: '#dcfce7', text: '#16a34a', label: 'Live' },
  conducted:   { bg: '#f1f5f9', text: '#94a3b8', label: 'Conducted' },
  cancelled:   { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return `${weekStart.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getLecturesForDay(lectures, date) {
  return lectures
    .filter(l => isSameDay(new Date(l.scheduled_at), date))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function WeeklyTimetable({ lectures = [], onLecturePress, filterComponent, weekStart, onPrevWeek, onNextWeek }) {

  const [selectedDay, setSelectedDay] = useState(new Date());

  const today = new Date();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const selectedLectures = getLecturesForDay(lectures, selectedDay);


  const dayHasLectures = (date) =>
    lectures.some(l => isSameDay(new Date(l.scheduled_at), date));

  const selectedDayLabel = selectedDay.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <View style={styles.container}>

      {filterComponent && (
        <View style={styles.filterWrapper}>
          {filterComponent}
        </View>

      )}

      <View style={styles.weekStrip}>
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={onPrevWeek} style={styles.navBtn}>
            <ChevronLeft size={18} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{formatWeekLabel(weekStart)}</Text>
          <TouchableOpacity onPress={onNextWeek} style={styles.navBtn}>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.daysRow}>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDay);
            const hasDot = dayHasLectures(day);
            return (
              <TouchableOpacity
                key={i}
                style={styles.dayItem}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={styles.dayName}>{DAYS[day.getDay()]}</Text>
                <View style={[
                  styles.dayNum,
                  isToday && styles.dayNumToday,
                  isSelected && !isToday && styles.dayNumSelected,
                ]}>
                  <Text style={[
                    styles.dayNumText,
                    isToday && styles.dayNumTextToday,
                    isSelected && !isToday && styles.dayNumTextSelected,
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
                <View style={[styles.dot, hasDot && styles.dotVisible]} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={styles.scheduleArea}
        contentContainerStyle={styles.scheduleContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.daySection}>{selectedDayLabel}</Text>

        {selectedLectures.length === 0 ? (
          <Text style={styles.emptyText}>No lectures scheduled for this day.</Text>
        ) : (
          selectedLectures.map((lecture) => {
            const subjectColor = SUBJECT_COLORS[lecture.subject] || SUBJECT_COLORS.Default;
            const statusStyle = STATUS_STYLES[lecture.status] || STATUS_STYLES.scheduled;
            return (
              <TouchableOpacity
                key={lecture.id}
                style={[styles.lectureCard, { borderLeftColor: subjectColor }]}
                onPress={() => onLecturePress && onLecturePress(lecture)}
                activeOpacity={0.7}
              >
                <View style={styles.lectureLeft}>
                  <Text style={styles.lectureSubject}>{lecture.subject}</Text>
                  <Text style={styles.lectureMeta}>
                    {formatTime(lecture.scheduled_at)} · {lecture.duration_mins} min
                    {lecture.teacher_name ? ` · ${lecture.teacher_name}` : ''}
                  </Text>
                  {lecture.batch_name && (
                    <View style={styles.batchTag}>
                      <Text style={styles.batchTagText}>{lecture.batch_name}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
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
  filterRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    maxHeight: 100,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  weekStrip: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    padding: 4,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 4,
  },
  dayName: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumToday: {
    backgroundColor: '#28388f',
  },
  dayNumSelected: {
    backgroundColor: '#e8eaf6',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  dayNumTextToday: {
    color: '#fff',
  },
  dayNumTextSelected: {
    color: '#28388f',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#28388f',
    opacity: 0,
  },
  dotVisible: {
    opacity: 1,
  },
  scheduleArea: {
    flex: 1,
  },
  scheduleContent: {
    padding: 20,
    paddingBottom: 100,
  },
  daySection: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    paddingVertical: 40,
  },
  lectureCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  lectureLeft: {
    flex: 1,
    marginRight: 10,
  },
  lectureSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  lectureMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  batchTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  batchTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  filterWrapper: {
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#f1f5f9',
  zIndex: 100,
  overflow: 'visible',
},
});