import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, UploadCloud, FileText, CheckCircle2 } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

const TYPES = ['notes', 'assignment', 'textbook', 'pyq', 'video'];

export default function UploadMaterialModalScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('');
  const [type, setType] = useState('notes');
  const [batchCode, setBatchCode] = useState('NEET-A7');
  const [gcsPath, setGcsPath] = useState('');
  const [fileSizeMB, setFileSizeMB] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpload = async () => {
    if (!title.trim() || !gcsPath.trim()) {
      Alert.alert('Validation Error', 'Title and File Path / URL are required.');
      return;
    }

    // Check max file size limit (15MB)
    const size = parseFloat(fileSizeMB);
    if (!isNaN(size) && size > 15) {
      Alert.alert('File Size Exceeded', 'Selected file size exceeds maximum limit of 15MB.');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest('/materials', {
        method: 'POST',
        body: {
          title: title.trim(),
          subject: subject.trim(),
          chapter: chapter.trim() || 'General',
          type,
          batchCode: batchCode.trim(),
          gcsPath: gcsPath.trim(),
        },
      });

      Alert.alert('Success', 'Study material uploaded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to upload study material');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.headerGradient} />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Upload Study Material</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <UploadCloud size={24} color="#2563EB" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Batch Study Material Upload</Text>
            <Text style={styles.infoSub}>Max size limit per file: 15MB (PDF/Notes/Sheets)</Text>
          </View>
        </View>

        <Text style={styles.label}>Material Title:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chapter 4 - Magnetic Effects Notes"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Subject:</Text>
            <TextInput
              style={styles.input}
              placeholder="Subject"
              value={subject}
              onChangeText={setSubject}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Batch Code:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. NEET-A7"
              value={batchCode}
              onChangeText={setBatchCode}
            />
          </View>
        </View>

        <Text style={styles.label}>Chapter Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Electrostatics"
          value={chapter}
          onChangeText={setChapter}
        />

        <Text style={styles.label}>Material Type:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>File Path / URL (GCS path or link):</Text>
        <TextInput
          style={styles.input}
          placeholder="materials/physics/notes-ch4.pdf"
          value={gcsPath}
          onChangeText={setGcsPath}
        />

        <Text style={styles.label}>File Size (MB) (Max 15MB):</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 4.5"
          keyboardType="numeric"
          value={fileSizeMB}
          onChangeText={setFileSizeMB}
        />

        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <UploadCloud size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload Material</Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingBottom: 16,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  infoSub: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  typeSelector: {
    marginVertical: 6,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#2563EB',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  uploadBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
