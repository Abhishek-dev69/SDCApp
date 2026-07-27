import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Megaphone } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

export default function PostAnnouncementScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [batchId, setBatchId] = useState(null);
  const [batches, setBatches] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/admin/batches')
      .then((data) => setBatches(Array.isArray(data) ? data : []))
      .catch((err) => Alert.alert('Unable to Load Batches', err.message));
  }, []);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required Fields', 'Enter both a title and message.');
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/announcements', {
        method: 'POST',
        body: {
          title: title.trim(),
          content: content.trim(),
          batch_id: batchId,
        },
      });
      Alert.alert('Announcement Posted', 'The announcement is now visible to the selected audience.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Unable to Post', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Announcement</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.audienceSection}>
          <Text style={styles.label}>Audience</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.chip, batchId === null && styles.chipActive]}
              onPress={() => setBatchId(null)}
            >
              <Text style={[styles.chipText, batchId === null && styles.chipTextActive]}>Everyone</Text>
            </TouchableOpacity>
            {batches.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                style={[styles.chip, batchId === batch.id && styles.chipActive]}
                onPress={() => setBatchId(batch.id)}
              >
                <Text style={[styles.chipText, batchId === batch.id && styles.chipTextActive]}>
                  {batch.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Announcement title"
          maxLength={120}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={content}
          onChangeText={setContent}
          placeholder="Write the announcement"
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Megaphone size={19} color="#FFFFFF" />
              <Text style={styles.submitText}>Post Announcement</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  content: { padding: 20, paddingBottom: 48 },
  audienceSection: { marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
  chip: {
    minHeight: 38,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#28388F', borderColor: '#28388F' },
  chipText: { color: '#475569', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 20,
  },
  messageInput: { minHeight: 170, paddingTop: 14 },
  submitButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#28388F',
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
