// import React, { useMemo, useState, useEffect } from 'react';
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   ActivityIndicator
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import {
//   BookOpen,
//   CalendarDays,
//   CheckCircle2,
//   ChevronLeft,
//   ChevronRight,
//   ClipboardList,
//   FileText,
//   Filter,
//   FilterX,
//   Layers,
//   NotebookPen,
//   PlayCircle,
//   Search,
// } from 'lucide-react-native';
// import { apiRequest } from '../../services/api';
// import { useUserSession } from '../../context/UserSessionContext';

// const SUBJECT_LABELS = {
//   physics: 'Physics',
//   chemistry: 'Chemistry',
//   mathematics: 'Mathematics',
//   biology: 'Biology',
// };

// const SOURCE_LABELS = {
//   ncert: 'NCERT Textbook',
//   maharashtra: 'Maharashtra Textbook',
// };

// const TYPE_CONFIG = {
//   textbook: { icon: BookOpen, color: '#28388F', bg: '#EEF2FF', label: 'Textbook' },
//   notes: { icon: NotebookPen, color: '#28388F', bg: '#EEF2FF', label: 'Notes' },
//   pyq: { icon: FileText, color: '#F59E0B', bg: '#FEF3C7', label: 'PYQs' },
//   assignment: { icon: ClipboardList, color: '#7C3AED', bg: '#F3E8FF', label: 'Assignments' },
//   video: { icon: PlayCircle, color: '#DC2626', bg: '#FEE2E2', label: 'Videos' },
// };

// const CLASS_FILTERS = [
//   { id: 11, label: '11th', helper: 'Std 11' },
//   { id: 12, label: '12th', helper: 'Std 12' },
// ];

// const NOTE_TYPES = [
//   { id: 'notes', label: 'Notes', helper: 'Chapter wise revision' },
//   { id: 'pyq', label: 'PYQs', helper: 'Previous papers' },
//   { id: 'assignment', label: 'Assignments', helper: 'Practice tasks' },
//   { id: 'video', label: 'Videos', helper: 'Lecture support' },
// ];

// const PYQ_YEAR_FILTERS = [2024, 2023, 2022, 2021, 2020, 2019];

// const PYQ_SORT_OPTIONS = [
//   { id: 'latest', label: 'Latest first' },
//   { id: 'oldest', label: 'Oldest first' },
// ];

// const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// function formatPyqTitle(item) {
//   const month = item.month ? MONTH_LABELS[item.month - 1] : null;
//   const subject = item.subject ? ` ${item.subject}` : '';
//   return `${item.exam}${subject} ${item.year}${month ? ` ${month}` : ''} Paper ${item.paper_number}`;
// }

// function formatExamDate(examDate) {
//   if (!examDate) return '';

//   const [year, month, day] = examDate.split('-');
//   return `${Number(day)} ${MONTH_LABELS[Number(month) - 1]} ${year}`;
// }

// function buildNotesItems(activeFilter, activeClass, subjectLabel, noteData) {
//   if (activeFilter === 'pyq') {
//     return [
//       { id: 'pyq-2024-final', title: `${subjectLabel} Board Paper`, year: 2024, examDate: '2024-03-12', pdfUrl: noteData?.pyq || '' },
//       { id: 'pyq-2023-march', title: `${subjectLabel} March Paper`, year: 2023, examDate: '2023-03-09', pdfUrl: noteData?.pyq || '' },
//       { id: 'pyq-2022-practice', title: `${subjectLabel} Practice Paper`, year: 2022, examDate: '2022-02-28', pdfUrl: noteData?.pyq || '' },
//       { id: 'pyq-2021-revision', title: `${subjectLabel} Revision Paper`, year: 2021, examDate: '2021-03-05', pdfUrl: noteData?.pyq || '' },
//     ];
//   }

//   const label = TYPE_CONFIG[activeFilter]?.label || 'Material';

//   return [1, 2, 3].map((item) => ({
//     id: `${activeFilter}-${activeClass}-${item}`,
//     title: `${subjectLabel} ${label} ${item}`,
//     year: null,
//     examDate: null,
//     pdfUrl: noteData?.[activeFilter] || '',
//     classLabel: `Class ${activeClass}`,
//   }));
// }

// function FilterChip({ label, active, onPress }) {
//   return (
//     <TouchableOpacity style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
//       <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

// function ProgressPill({ text }) {
//   return (
//     <View style={styles.progressPill}>
//       <CheckCircle2 size={14} color="#28388F" />
//       <Text style={styles.progressPillText}>{text}</Text>
//     </View>
//   );
// }

// export default function MaterialFilterScreen({ route, navigation }) {
//   const { subjectId, type, source, class: selectedClass } = route.params;
//   const { selectedBatch } = useUserSession();

//   const subjectLabel = SUBJECT_LABELS[subjectId] || 'Subject';
//   const isTextbook = type === 'textbook';
//   const initialClass = selectedClass || 12;

//   const [query, setQuery] = useState('');
//   const [activeClass, setActiveClass] = useState(initialClass);
//   const [activeFilter, setActiveFilter] = useState('notes');
//   const [activeYear, setActiveYear] = useState('all');
//   const [activeSort, setActiveSort] = useState('latest');

//   const [exam, setExam] = useState('JEE');
//   const [pyqData, setPyqData] = useState([]);
//   const [pyqLoading, setPyqLoading] = useState(false);
//   const [activeMonth, setActiveMonth] = useState(null);
//   const [activeSubject, setActiveSubject] = useState(null);
//   const [materials, setMaterials] = useState([]);
//   const [materialsLoading, setMaterialsLoading] = useState(false);


//   const normalizedQuery = query.trim().toLowerCase();

//   const materialItems = useMemo(() => {
//     return (materials || []).map((item) => ({
//       ...item,
//       fromBackend: true,
//       classLabel: `Class ${item.classLevel || activeClass}`,
//     }));
//   }, [activeClass, materials]);

//   const textbookItems = useMemo(() => {
//     return materialItems.filter((chapter) => chapter?.title?.toLowerCase().includes(normalizedQuery));
//   }, [materialItems, normalizedQuery]);

//   const noteItems = useMemo(() => {
//     return materialItems
//       .filter((item) => item.title.toLowerCase().includes(normalizedQuery))
//       .sort((firstItem, secondItem) => {
//         const first = new Date(firstItem.uploadedAt || 0).getTime();
//         const second = new Date(secondItem.uploadedAt || 0).getTime();
//         return activeSort === 'latest' ? second - first : first - second;
//       });
//   }, [activeSort, materialItems, normalizedQuery]);

//   const resultCount = isTextbook ? textbookItems.length : activeFilter === 'pyq' ? (pyqData || []).length : noteItems.length;
//   const activeResourceLabel = isTextbook
//     ? SOURCE_LABELS[source] || 'Textbook'
//     : TYPE_CONFIG[activeFilter]?.label || 'Study Material';
//   const activeSummary = [
//     `Class ${activeClass}`,
//     activeResourceLabel,
//     !isTextbook && activeFilter === 'pyq' && activeYear !== 'all' ? `${activeYear}` : null,
//     !isTextbook && activeFilter === 'pyq' ? PYQ_SORT_OPTIONS.find((item) => item.id === activeSort)?.label : null,
//   ].filter(Boolean).join(' / ');

//   const clearFilters = () => {
//     setQuery('');
//     setActiveClass(initialClass);
//     setActiveFilter('notes');
//     setActiveYear('all');
//     setActiveSort('latest');
//   };

//   const handleTypeChange = (filterId) => {
//     setActiveFilter(filterId);
//     if (filterId !== 'pyq') {
//       setActiveYear('all');
//       setActiveSort('latest');
//     }
//   };

  
  
//   const fetchPyqs = async () => {
//     setPyqLoading(true);
//     try {
//       const params = new URLSearchParams({ exam });
//       if (activeYear !== 'all') params.append('year', activeYear);
//       if (exam === 'JEE' && activeMonth) params.append('month', activeMonth);
//       if (exam === 'MHTCET' && activeSubject) params.append('subject', activeSubject);

//       const data = await apiRequest(`/pdfview?${params.toString()}`);
//       setPyqData(data);
//     } catch (err) {
//       console.log('PYQ fetch error:', err);
//     } finally {
//       setPyqLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (activeFilter === 'pyq') fetchPyqs();
//   }, [exam, activeFilter, activeYear, activeMonth, activeSubject]);

//   const fetchMaterials = async () => {
//     if (!isTextbook && activeFilter === 'pyq') return;

//     setMaterialsLoading(true);
//     try {
//       const params = new URLSearchParams({
//         subject: subjectId,
//         type: isTextbook ? 'textbook' : activeFilter,
//         class: String(activeClass),
//       });

//       if (source) params.append('source', source);
//       if (selectedBatch?.label) params.append('batch', selectedBatch.label);

//       const data = await apiRequest(`/materials?${params.toString()}`);
//       setMaterials(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.log('Material fetch error:', err);
//       setMaterials([]);
//     } finally {
//       setMaterialsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchMaterials();
//   }, [activeClass, activeFilter, source, subjectId, selectedBatch?.label, type]);

//   const openMaterial = async (item, materialType, pyqType = 'paper') => {
//   if (materialType === 'pyq') {
//     try {
//       const data = await apiRequest(`/pdfview/${item.id}/url?type=${pyqType}`);
//       navigation.navigate('PdfViewer', { pdfUrl: data.url, title: formatPyqTitle(item) });
//     } catch (err) {
//       console.log('Signed URL error:', err);
//     }
//   } else {
//     try {
//       const data = await apiRequest(`/materials/${item.id}/download`);
//       navigation.navigate('PdfViewer', {
//         pdfUrl: data.url,
//         title: data.title || item.title,
//         type: materialType,
//       });
//     } catch (err) {
//       console.log('Material URL error:', err);
//     }
//   }
// };

import React, { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { apiRequest } from '../../services/api';
import { useUserSession } from '../../context/UserSessionContext';

const SUBJECTS = [
  { id: 'Physics', label: 'Physics' },
  { id: 'Chemistry', label: 'Chemistry' },
  { id: 'Math', label: 'Mathematics' },
  { id: 'Biology', label: 'Biology' },
];

const BOARD_FILTERS = [
  { id: 'NCERT', label: 'NCERT' },
  { id: 'Maharashtra board', label: 'Maharashtra Board' },
];

const SOURCE_LABELS = {
  NCERT: 'NCERT',
  Maharashtra_board: 'Maharashtra Board',
};

const TYPE_CONFIG = {
  notes: { icon: NotebookPen, color: '#28388F', bg: '#EEF2FF', label: 'Notes' },
  pyq: { icon: FileText, color: '#F59E0B', bg: '#FEF3C7', label: 'PYQs' },
  assignment: { icon: ClipboardList, color: '#7C3AED', bg: '#F3E8FF', label: 'Assignments' },
  video: { icon: PlayCircle, color: '#DC2626', bg: '#FEE2E2', label: 'Videos' },
};

const NOTE_TYPES = [
  { id: 'notes', label: 'Notes', disabled: false },
  { id: 'pyq', label: 'PYQs', disabled: false },
  { id: 'assignment', label: 'Assignments', disabled: true },
  { id: 'video', label: 'Videos', disabled: true },
];

const PYQ_YEAR_FILTERS = [2024, 2023, 2022, 2021, 2020, 2019];

const PYQ_SORT_OPTIONS = [
  { id: 'latest', label: 'Latest first' },
  { id: 'oldest', label: 'Oldest first' },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatPyqTitle(item) {
  const month = item.month ? MONTH_LABELS[item.month - 1] : null;
  const subject = item.subject ? ` ${item.subject}` : '';
  return `${item.exam}${subject} ${item.year}${month ? ` ${month}` : ''} Paper ${item.paper_number}`;
}

export default function MaterialFilterScreen({ route, navigation }) {
  const { subjectId: initialSubjectId } = route.params || {};
  const { userProfile } = useUserSession();

  const studentStd = userProfile?.student_std;

  const [query, setQuery] = useState('');
  const [activeSubjectId, setActiveSubjectId] = useState(initialSubjectId || 'Physics');
  const [activeFilter, setActiveFilter] = useState('notes');
  const [activeBoard, setActiveBoard] = useState('NCERT');
  const [activeYear, setActiveYear] = useState('all');
  const [activeSort, setActiveSort] = useState('latest');
  const [exam, setExam] = useState('JEE');
  const [activeMonth, setActiveMonth] = useState(null);

  const [pyqData, setPyqData] = useState([]);
  const [pyqLoading, setPyqLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const activeSubjectLabel = SUBJECTS.find((s) => s.id === activeSubjectId)?.label || 'Subject';
  const normalizedQuery = query.trim().toLowerCase();

  const noteItems = useMemo(() => {
    return (materials || [])
      .filter((item) => item.title.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        const first = new Date(a.uploadedAt || 0).getTime();
        const second = new Date(b.uploadedAt || 0).getTime();
        return activeSort === 'latest' ? second - first : first - second;
      });
  }, [materials, normalizedQuery, activeSort]);

  const resultCount = activeFilter === 'pyq' ? (pyqData || []).length : noteItems.length;

  const clearFilters = () => {
    setQuery('');
    setActiveSubjectId(initialSubjectId || 'Physics');
    setActiveFilter('notes');
    setActiveBoard('NCERT');
    setActiveYear('all');
    setActiveSort('latest');
    setExam('JEE');
    setActiveMonth(null);
  };

  const handleTypeChange = (filterId) => {
    setActiveFilter(filterId);
    if (filterId !== 'pyq') {
      setActiveYear('all');
      setActiveSort('latest');
      setActiveMonth(null);
    }
  };

  // const fetchPyqs = async () => {
  //   setPyqLoading(true);
  //   try {
  //     const params = new URLSearchParams({ exam, subject: activeSubjectId });
  //     if (activeYear !== 'all') params.append('year', activeYear);
  //     if (exam === 'JEE' && activeMonth) params.append('month', activeMonth);

  //     const data = await apiRequest(`/pdfview?${params.toString()}`);
  //     setPyqData(data);
  //   } catch (err) {
  //     console.log('PYQ fetch error:', err);
  //   } finally {
  //     setPyqLoading(false);
  //   }
  // };

  const fetchPyqs = async () => {
  setPyqLoading(true);
  try {
    const params = new URLSearchParams({ exam });
    if (activeYear !== 'all') params.append('year', activeYear);
    if (exam === 'JEE' && activeMonth) params.append('month', activeMonth);

    const data = await apiRequest(`/materials/pyq?${params.toString()}`);
    setPyqData(data);
  } catch (err) {
    console.log('PYQ fetch error:', err);
  } finally {
    setPyqLoading(false);
  }
};

  const fetchMaterials = async () => {
    if (activeFilter === 'pyq') return;
    setMaterialsLoading(true);
    try {
      const params = new URLSearchParams({
        subject: activeSubjectId.charAt(0).toUpperCase() + activeSubjectId.slice(1),
        board: activeBoard,
      });
      if (studentStd) params.append('standard', `${studentStd}th`);
      console.log('Fetching materials with:', params.toString());

      const data = await apiRequest(`/materials?${params.toString()}`);

      console.log('Materials response:', data);
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Material fetch error:', err);
      setMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    if (activeFilter === 'pyq') fetchPyqs();
  }, [exam, activeFilter, activeYear, activeMonth, activeSubjectId]);

  useEffect(() => {
    if (activeFilter !== 'pyq') fetchMaterials();
  }, [activeFilter, activeBoard, activeSubjectId, studentStd]);

  const openMaterial = async (item, materialType, pyqType = 'paper') => {
    if (materialType === 'pyq') {
      try {
        const data = await apiRequest(`/materials/pyq/${item.id}/url?type=${pyqType}`);
        navigation.navigate('PDFViewer', { pdfUrl: data.url, title: formatPyqTitle(item) });
      } catch (err) {
        console.log('Signed URL error:', err);
      }
    } else {
      try {
        const data = await apiRequest(`/materials/${item.id}/download`);
        navigation.navigate('PDFViewer', { pdfUrl: data.url, title: data.title || item.title });
      } catch (err) {
        console.log('Material URL error:', err);
      }
    }
  };















//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//         <View style={styles.heroCard}>
//           <LinearGradient colors={['#2B58ED', '#1E3A8A']} style={styles.heroGradient} />

//           <View style={styles.heroTopRow}>
//             <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//               <ChevronLeft size={24} color="#FFFFFF" />
//             </TouchableOpacity>

//             <View style={styles.heroBadge}>
//               <Layers size={14} color="#FFFFFF" />
//               <Text style={styles.heroBadgeText}>{activeResourceLabel}</Text>
//             </View>
//           </View>

//           <Text style={styles.heroTitle}>{subjectLabel}</Text>
//           <Text style={styles.heroSubtitle}>
//             {isTextbook ? 'Textbook chapters' : 'Notes, PYQs, assignments, and videos'}
//           </Text>

//           <View style={styles.searchBox}>
//             <Search size={18} color="#64748B" />
//             <TextInput
//               placeholder={isTextbook ? 'Search chapter name' : 'Search notes, PYQs, assignments'}
//               placeholderTextColor="#94A3B8"
//               value={query}
//               onChangeText={setQuery}
//               style={styles.input}
//             />
//           </View>
//         </View>

//         <View style={styles.filterPanel}>
//           <View style={styles.panelHeader}>
//             <View style={styles.panelTitleRow}>
//               <Filter size={18} color="#28388F" />
//               <Text style={styles.panelTitle}>Filters</Text>
//             </View>
//             <TouchableOpacity onPress={clearFilters}>
//               <Text style={styles.clearText}>Reset</Text>
//             </TouchableOpacity>
//           </View>

//           <Text style={styles.filterGroupLabel}>Class</Text>
//           <View style={styles.classSegment}>
//             {CLASS_FILTERS.map((item) => {
//               const isActive = activeClass === item.id;

//               return (
//                 <TouchableOpacity
//                   key={item.id}
//                   style={[styles.classOption, isActive && styles.classOptionActive]}
//                   onPress={() => setActiveClass(item.id)}
//                 >
//                   <Text style={[styles.classLabel, isActive && styles.classLabelActive]}>{item.label}</Text>
//                   <Text style={[styles.classHelper, isActive && styles.classHelperActive]}>{item.helper}</Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>

//           {!isTextbook && (
//             <>
//             <Text style={styles.filterGroupLabel}>Exam</Text>
//             <View style={styles.classSegment}>
//               {['JEE', 'MHTCET'].map((e) => (
//                 <TouchableOpacity
//                   key={e}
//                   style={[styles.classOption, exam === e && styles.classOptionActive]}
//                   onPress={() => { setExam(e); setActiveMonth(null); setActiveSubject(null); }}
//                 >
//                   <Text style={[styles.classLabel, exam === e && styles.classLabelActive]}>{e}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//               <Text style={styles.filterGroupLabel}>Resource Type</Text>
//               <View style={styles.typeGrid}>
//                 {NOTE_TYPES.map((item) => {
//                   const config = TYPE_CONFIG[item.id];
//                   const Icon = config.icon;
//                   const isActive = activeFilter === item.id;

//                   return (
//                     <TouchableOpacity
//                       key={item.id}
//                       style={[styles.typeOption, isActive && styles.typeOptionActive]}
//                       onPress={() => handleTypeChange(item.id)}
//                     >
//                       <View style={[styles.typeIcon, { backgroundColor: config.bg }]}>
//                         <Icon size={18} color={config.color} />
//                       </View>
//                       <View style={styles.typeCopy}>
//                         <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>{item.label}</Text>
//                         <Text style={styles.typeHelper}>{item.helper}</Text>
//                       </View>
//                     </TouchableOpacity>
//                   );
//                 })}
//               </View>
//             </>
//           )}

//           {!isTextbook && activeFilter === 'pyq' && (
//             <View style={styles.pyqPanel}>
//               <View style={styles.pyqTitleRow}>
//                 <CalendarDays size={17} color="#F59E0B" />
//                 <Text style={styles.pyqTitle}>PYQ Filters</Text>
//               </View>

//               <Text style={styles.filterGroupLabel}>Year</Text>
//               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
//                 <FilterChip label="All years" active={activeYear === 'all'} onPress={() => setActiveYear('all')} />
//                 {PYQ_YEAR_FILTERS.map((year) => (
//                   <FilterChip key={year} label={`${year}`} active={activeYear === year} onPress={() => setActiveYear(year)} />
//                 ))}
//               </ScrollView>
//                 {exam === 'JEE' && (
//                   <>
//                     <Text style={styles.filterGroupLabel}>Month</Text>
//                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
//                       <FilterChip label="All" active={activeMonth === null} onPress={() => setActiveMonth(null)} />
//                       <FilterChip label="January" active={activeMonth === 1} onPress={() => setActiveMonth(1)} />
//                       <FilterChip label="April" active={activeMonth === 4} onPress={() => setActiveMonth(4)} />
//                     </ScrollView>
//                   </>
//                 )}
//               <Text style={styles.filterGroupLabel}>Date Order</Text>
//               <View style={styles.sortSegment}>
//                 {PYQ_SORT_OPTIONS.map((option) => {
//                   const isActive = activeSort === option.id;

//                   return (
//                     <TouchableOpacity
//                       key={option.id}
//                       style={[styles.sortButton, isActive && styles.sortButtonActive]}
//                       onPress={() => setActiveSort(option.id)}
//                     >
//                       <Text style={[styles.sortText, isActive && styles.sortTextActive]}>{option.label}</Text>
//                     </TouchableOpacity>
//                   );
//                 })}
//               </View>
//             </View>
//           )}

//           <View style={styles.activeSummaryCard}>
//             <ProgressPill text={activeSummary} />
//             <Text style={styles.resultCountText}>
//               {resultCount} result{resultCount === 1 ? '' : 's'}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.resultsSection}>
//           <View style={styles.resultsHeader}>
//             <Text style={styles.resultsTitle}>{activeResourceLabel}</Text>
//             <Text style={styles.resultsCaption}>{subjectLabel} / Class {activeClass}</Text>
//           </View>

//           {isTextbook && textbookItems.map((chapter, index) => {
//             const config = TYPE_CONFIG.textbook;
//             const Icon = config.icon;

//             return (
//               <TouchableOpacity
//                 key={`${chapter.id}-${activeClass}-${index}`}
//                 style={styles.materialRow}
//                 onPress={() => openMaterial(chapter, 'textbook')}
//               >
//                 <View style={styles.rowLeft}>
//                   <View style={[styles.rowIconWrap, { backgroundColor: config.bg }]}>
//                     <Icon size={21} color={config.color} />
//                   </View>

//                   <View style={styles.rowCopy}>
//                     <Text style={styles.rowTitle}>{chapter.title}</Text>
//                     <Text style={styles.rowMeta}>{SOURCE_LABELS[source] || 'Textbook'} / Class {activeClass}</Text>
//                   </View>
//                 </View>

//                 <View style={styles.openButton}>
//                   <Text style={styles.openButtonText}>Open</Text>
//                   <ChevronRight size={16} color="#28388F" />
//                 </View>
//               </TouchableOpacity>
//             );
//           })}

//           {!isTextbook && (activeFilter === 'pyq' 
//             ? [...(pyqData || [])].sort((a, b) => {
//                 if (a.year !== b.year) return activeSort === 'latest' ? b.year - a.year : a.year - b.year;
//                 return activeSort === 'latest' ? (b.month || 0) - (a.month || 0) : (a.month || 0) - (b.month || 0);
//               })
//             : noteItems
//           ).map((item) => {
//             const config = TYPE_CONFIG[activeFilter];
//             const Icon = config.icon;

//             return (
//               <TouchableOpacity
//                 key={item.id}
//                 style={styles.materialRow}
//                 onPress={() => openMaterial(item, 'notes')}
//               >
//                 <View style={styles.rowLeft}>
//                   <View style={[styles.rowIconWrap, { backgroundColor: config.bg }]}>
//                     <Icon size={21} color={config.color} />
//                   </View>

//                   <View style={styles.rowCopy}>
//                     <Text style={styles.rowTitle}>
//                       {activeFilter === 'pyq' ? formatPyqTitle(item) : item.title}
//                     </Text>
//                     {activeFilter !== 'pyq' && (
//                       <Text style={styles.rowMeta}>
//                         {`${item.classLabel} / ${activeResourceLabel}`}
//                       </Text>
//                     )}
//                   </View>
//                 </View>

//                 {/* <View style={styles.openButton}>
//                   <Text style={styles.openButtonText}>Open</Text>
//                   <ChevronRight size={16} color="#28388F" />
//                 </View> */}


//                 {activeFilter === 'pyq' ? (
//                   <View style={{ flexDirection: 'row', gap: 8 }}>
//                     <TouchableOpacity
//                       style={styles.openButton}
//                       onPress={() => openMaterial(item, 'pyq', 'paper')}
//                     >
//                       <Text style={styles.openButtonText}>Ques</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={styles.openButton}
//                       onPress={() => openMaterial(item, 'pyq', 'solution')}
//                     >
//                       <Text style={styles.openButtonText}>Ans</Text>
//                     </TouchableOpacity>
//                   </View>
//                 ) : (
//                   <View style={styles.openButton}>
//                     <Text style={styles.openButtonText}>Open</Text>
//                     <ChevronRight size={16} color="#28388F" />
//                   </View>
//                 )}
//               </TouchableOpacity>
//             );
//           })}
//           {activeFilter === 'pyq' && pyqLoading && (
//             <ActivityIndicator color="#28388F" style={{ marginTop: 24 }} />
//           )}
//           {activeFilter !== 'pyq' && materialsLoading && (
//             <ActivityIndicator color="#28388F" style={{ marginTop: 24 }} />
//           )}
//           {!resultCount && !pyqLoading && !materialsLoading && (
//             <View style={styles.emptyState}>
//               <View style={styles.emptyIcon}>
//                 <FilterX size={24} color="#64748B" />
//               </View>
//               <Text style={styles.emptyTitle}>No material found</Text>
//               <Text style={styles.emptyText}>
//                 Try another class, type, year, or search term.
//               </Text>
//               <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
//                 <Text style={styles.emptyButtonText}>Clear filters</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

return (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Material</Text>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchBox}>
        <Search size={16} color="#94A3B8" />
        <TextInput
          placeholder="Search by title..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      {/* ── Resource type tabs ── */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.typeRow}>
          {NOTE_TYPES.map((item) => {
            const config = TYPE_CONFIG[item.id];
            const Icon = config.icon;
            const isActive = activeFilter === item.id;
            const isDisabled = item.disabled;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.typeCard,
                  isActive && styles.typeCardActive,
                  isDisabled && styles.typeCardDisabled,
                ]}
                onPress={() => !isDisabled && handleTypeChange(item.id)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <View style={[styles.typeIconWrap, { backgroundColor: isDisabled ? '#F1F5F9' : config.bg }]}>
                  <Icon size={18} color={isDisabled ? '#CBD5E1' : isActive ? config.color : '#94A3B8'} />
                </View>
                <Text style={[styles.typeLabel, isActive && styles.typeLabelActive, isDisabled && styles.typeLabelDisabled]}>
                  {item.label}
                </Text>
                {isDisabled && <Text style={styles.soonBadge}>Soon</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
{/* ── Notes filters ── */}
{activeFilter === 'notes' && (
  <View style={styles.sectionBlock}>
    <Text style={styles.sectionLabel}>Subject</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {SUBJECTS.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={[styles.chip, activeSubjectId === s.id && styles.chipActive]}
          onPress={() => setActiveSubjectId(s.id)}
        >
          <Text style={[styles.chipText, activeSubjectId === s.id && styles.chipTextActive]}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>

    <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Board</Text>
    <View style={styles.chipRow}>
      {BOARD_FILTERS.map((b) => (
        <TouchableOpacity
          key={b.id}
          style={[styles.chip, activeBoard === b.id && styles.chipActive]}
          onPress={() => setActiveBoard(b.id)}
        >
          <Text style={[styles.chipText, activeBoard === b.id && styles.chipTextActive]}>{b.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}
      {/* ── PYQ filters ── */}
      {activeFilter === 'pyq' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Exam</Text>
          <View style={styles.chipRow}>
            {['JEE', 'MHTCET'].map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.chip, exam === e && styles.chipActive]}
                onPress={() => { setExam(e); setActiveMonth(null); }}
              >
                <Text style={[styles.chipText, exam === e && styles.chipTextActive]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, activeYear === 'all' && styles.chipActive]}
              onPress={() => setActiveYear('all')}
            >
              <Text style={[styles.chipText, activeYear === 'all' && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {PYQ_YEAR_FILTERS.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.chip, activeYear === year && styles.chipActive]}
                onPress={() => setActiveYear(year)}
              >
                <Text style={[styles.chipText, activeYear === year && styles.chipTextActive]}>{year}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {exam === 'JEE' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Month</Text>
              <View style={styles.chipRow}>
                {[{ label: 'All', value: null }, { label: 'January', value: 1 }, { label: 'April', value: 4 }].map((m) => (
                  <TouchableOpacity
                    key={m.label}
                    style={[styles.chip, activeMonth === m.value && styles.chipActive]}
                    onPress={() => setActiveMonth(m.value)}
                  >
                    <Text style={[styles.chipText, activeMonth === m.value && styles.chipTextActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Order</Text>
          <View style={styles.chipRow}>
            {PYQ_SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, activeSort === opt.id && styles.chipActive]}
                onPress={() => setActiveSort(opt.id)}
              >
                <Text style={[styles.chipText, activeSort === opt.id && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Divider + result count ── */}
      <View style={styles.resultBar}>
        <Text style={styles.resultBarText}>
          {resultCount} result{resultCount === 1 ? '' : 's'} · {activeSubjectLabel} · {TYPE_CONFIG[activeFilter]?.label}
        </Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* ── Results list ── */}
      <View style={styles.resultsList}>

        {(activeFilter === 'pyq' ? pyqLoading : materialsLoading) && (
          <ActivityIndicator color="#2B58ED" style={{ marginTop: 32 }} />
        )}

        {activeFilter === 'pyq' && !pyqLoading &&
          [...(pyqData || [])].sort((a, b) => {
            if (a.year !== b.year) return activeSort === 'latest' ? b.year - a.year : a.year - b.year;
            return activeSort === 'latest' ? (b.month || 0) - (a.month || 0) : (a.month || 0) - (b.month || 0);
          }).map((item) => (
            <View key={item.id} style={styles.resultRow}>
              <View style={[styles.resultIconWrap, { backgroundColor: TYPE_CONFIG.pyq.bg }]}>
                <FileText size={18} color={TYPE_CONFIG.pyq.color} />
              </View>
              <View style={styles.resultCopy}>
                <Text style={styles.resultTitle}>{formatPyqTitle(item)}</Text>
                <Text style={styles.resultMeta}>{exam} · {item.year}</Text>
              </View>
              <View style={styles.pyqButtons}>
                <TouchableOpacity style={styles.pillButton} onPress={() => openMaterial(item, 'pyq', 'paper')}>
                  <Text style={styles.pillButtonText}>Ques</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pillButton, styles.pillButtonAlt]} onPress={() => openMaterial(item, 'pyq', 'solution')}>
                  <Text style={[styles.pillButtonText, styles.pillButtonAltText]}>Ans</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        }

        {activeFilter === 'notes' && !materialsLoading &&
          noteItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.resultRow} onPress={() => openMaterial(item, 'notes')}>
              <View style={[styles.resultIconWrap, { backgroundColor: TYPE_CONFIG.notes.bg }]}>
                <NotebookPen size={18} color={TYPE_CONFIG.notes.color} />
              </View>
              <View style={styles.resultCopy}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultMeta}>{activeBoard === 'ncert' ? 'NCERT' : 'Maharashtra Board'} · Std {userProfile?.student_std}</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))
        }

        {!resultCount && !pyqLoading && !materialsLoading && (
          <View style={styles.emptyState}>
            <FilterX size={28} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptyText}>Try changing your filters or search term.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
              <Text style={styles.emptyButtonText}>Reset filters</Text>
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
  // backButton: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   backgroundColor: 'rgba(255,255,255,0.16)',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
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
  // searchBox: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: '#FFFFFF',
  //   borderRadius: 16,
  //   paddingHorizontal: 14,
  //   minHeight: 52,
  // },
  // input: {
  //   flex: 1,
  //   color: '#0F172A',
  //   fontSize: 15,
  //   paddingHorizontal: 10,
  //   paddingVertical: 12,
  // },
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
  resultRow: {
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
  resultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultCopy: {
    flex: 1,
  },
  resultTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  resultMeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillButtonText: {
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
pillButtonAlt: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F0FDF4',
  borderRadius: 16,
  paddingHorizontal: 10,
  paddingVertical: 7,
},
pillButtonAltText: {
  color: '#16A34A',
  fontSize: 12,
  fontWeight: '800',
},
pyqButtons: {
  flexDirection: 'row',
  gap: 8,
},
resultBar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginHorizontal: 14,
  marginTop: 10,
  marginBottom: 6,
},
resultBarText: {
  color: '#64748B',
  fontSize: 12,
  fontWeight: '600',
},
resetText: {
  color: '#2B58ED',
  fontSize: 12,
  fontWeight: '800',
},
resultsList: {
  marginHorizontal: 14,
  marginTop: 8,
},
header: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  paddingHorizontal: 14,
  paddingTop: 16,
  paddingBottom: 8,
},
headerTitle: {
  color: '#0F172A',
  fontSize: 20,
  fontWeight: '800',
},
searchBox: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  paddingHorizontal: 14,
  marginHorizontal: 14,
  marginTop: 12,
  marginBottom: 4,
  minHeight: 48,
},
searchInput: {
  flex: 1,
  color: '#0F172A',
  fontSize: 14,
  paddingHorizontal: 8,
  paddingVertical: 10,
},
sectionBlock: {
  marginHorizontal: 14,
  marginTop: 16,
},
sectionLabel: {
  color: '#475569',
  fontSize: 12,
  fontWeight: '800',
  marginBottom: 8,
},
chipRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},
chip: {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 12,
  paddingVertical: 8,
},
chipActive: {
  backgroundColor: '#28388F',
  borderColor: '#28388F',
},
chipText: {
  color: '#475569',
  fontSize: 12,
  fontWeight: '800',
},
chipTextActive: {
  color: '#FFFFFF',
},
typeRow: {
  flexDirection: 'row',
  gap: 8,
},
typeCard: {
  flex: 1,
  alignItems: 'center',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  backgroundColor: '#F8FAFC',
  paddingVertical: 10,
  paddingHorizontal: 6,
  gap: 6,
},
typeCardActive: {
  backgroundColor: '#EEF2FF',
  borderColor: '#28388F',
},
typeCardDisabled: {
  backgroundColor: '#F8FAFC',
  borderColor: '#E2E8F0',
  opacity: 0.6,
},
typeIconWrap: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},
typeLabelDisabled: {
  color: '#CBD5E1',
},
soonBadge: {
  color: '#94A3B8',
  fontSize: 9,
  fontWeight: '800',
  backgroundColor: '#F1F5F9',
  borderRadius: 8,
  paddingHorizontal: 6,
  paddingVertical: 2,
},
backButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#EEF2FF',
  alignItems: 'center',
  justifyContent: 'center',
},

});
