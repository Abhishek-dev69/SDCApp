import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Pdf from 'react-native-pdf';

export default function PdfViewerScreen({ route }) {
  const { pdfUrl } = route.params || {};
  const [loading, setLoading] = useState(true);

  if (!pdfUrl) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#2b58ed"
          style={{ position: 'absolute', top: '50%', left: '50%' }}
        />
      )}

      <Pdf
        source={{ uri: pdfUrl }}
        style={styles.pdf}
        onLoadComplete={() => setLoading(false)}
        onError={(error) => console.log('PDF error:', error)}
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