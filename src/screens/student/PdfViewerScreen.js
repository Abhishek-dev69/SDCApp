import React from 'react';
import { View, StyleSheet } from 'react-native';
import Pdf from 'react-native-pdf';

export default function PdfViewerScreen({ route }) {
  const { pdfUrl } = route.params;

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: pdfUrl }}
        style={styles.pdf}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdf: {
    flex: 1,
  },
});