const SUBJECT_LIBRARY = {
  physics: {
    id: 'physics',
    title: 'Physics',
    subtitle: 'Full syllabus coverage',
    chapters: '24 Chapters Available',
    accentColor: '#F59E0B',
    borderColor: '#3B82F6',
    iconKey: 'physics',
  },
  chemistry: {
    id: 'chemistry',
    title: 'Chemistry',
    subtitle: 'Full syllabus coverage',
    chapters: '28 Chapters Available',
    accentColor: '#10B981',
    borderColor: '#8B5CF6',
    iconKey: 'chemistry',
  },
  mathematics: {
    id: 'mathematics',
    title: 'Mathematics',
    subtitle: 'Full syllabus coverage',
    chapters: '32 Chapters Available',
    accentColor: '#64748B',
    borderColor: '#10B981',
    iconKey: 'mathematics',
  },
  biology: {
    id: 'biology',
    title: 'Biology',
    subtitle: 'Full syllabus coverage',
    chapters: '26 Chapters Available',
    accentColor: '#EC4899',
    borderColor: '#F97316',
    iconKey: 'biology',
  },
};

const SUBJECTS_BY_STREAM = {
  PCM: ['physics', 'chemistry', 'mathematics'],
  PCB: ['physics', 'chemistry', 'biology'],
  PCMB: ['physics', 'chemistry', 'mathematics', 'biology'],
};

export const BATCHES = [
  { id: 'A1', label: 'A1', branch: 'Andheri', stream: 'PCM', program: 'CET', textbookSources: ['maharashtra'] },
  { id: 'A2', label: 'A2', branch: 'Andheri', stream: 'PCM', program: 'CET', textbookSources: ['maharashtra'] },
  { id: 'A3', label: 'A3', branch: 'Andheri', stream: 'PCM', program: 'CET', textbookSources: ['maharashtra'] },
  { id: 'G1', label: 'G1', branch: 'Goregaon', stream: 'PCMB', program: 'CET + NEET', textbookSources: ['ncert', 'maharashtra'] },
  { id: 'K1', label: 'K1', branch: 'Kandivali', stream: 'PCM', program: 'CET', textbookSources: ['maharashtra'] },
  { id: 'K2', label: 'K2', branch: 'Kandivali', stream: 'PCMB', program: 'JEE + NEET', textbookSources: ['ncert', 'maharashtra'] },
  { id: 'K3', label: 'K3', branch: 'Kandivali', stream: 'PCM', program: 'CET', textbookSources: ['maharashtra'] },
  { id: 'S1', label: 'S1', branch: 'Dahisar', stream: 'PCM', program: 'CET', textbookSources: ['maharashtra'] },
  { id: 'S2', label: 'S2', branch: 'Dahisar', stream: 'PCB', program: 'NEET', textbookSources: ['ncert'] },
  { id: 'S3', label: 'S3', branch: 'Dahisar', stream: 'PCMB', program: 'PCMB', textbookSources: ['ncert', 'maharashtra'] },
];

export const MATERIAL_SOURCE_LABELS = {
  ncert: 'NCERT Textbooks',
  maharashtra: 'Maharashtra Govt Textbooks',
  notes: 'SDC Notes',
};

export const MATERIAL_SOURCE_TABS = {
  ncert: 'NEET',
  maharashtra: 'JEE/CET',
};

export function findBatchById(batchId) {
  return BATCHES.find((batch) => batch.id === batchId) || null;
}

export function getSubjectsForBatch(batch) {
  const subjectIds = SUBJECTS_BY_STREAM[batch?.stream] || SUBJECTS_BY_STREAM.PCM;
  return subjectIds.map((subjectId) => SUBJECT_LIBRARY[subjectId]);
}

export function getTextbookSectionsForBatch(batch) {
  const subjects = getSubjectsForBatch(batch);
  const textbookSources = batch?.textbookSources?.length ? batch.textbookSources : ['maharashtra'];

  return textbookSources.map((source) => ({
    id: `${source}-textbooks`,
    title: MATERIAL_SOURCE_LABELS[source],
    source,
    subjects,
  }));
}

export function getNotesSectionForBatch(batch) {
  return {
    id: 'sdc-notes',
    title: MATERIAL_SOURCE_LABELS.notes,
    source: 'notes',
    subjects: getSubjectsForBatch(batch),
  };
}

export function getAvailableMaterialTabs(batch) {
  const textbookSources = batch?.textbookSources?.length ? batch.textbookSources : ['maharashtra'];

  return ['ncert', 'maharashtra'].map((source) => ({
    id: source,
    label: MATERIAL_SOURCE_TABS[source],
    enabled: textbookSources.includes(source),
  }));
}
