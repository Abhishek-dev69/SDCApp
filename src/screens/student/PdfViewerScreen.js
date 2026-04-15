import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export default function PdfViewerScreen({ route }) {
  const { pdfUrl, title } = route.params || {};
  const [status, setStatus] = useState(pdfUrl ? 'opening' : 'missing');

  useEffect(() => {
    let isMounted = true;

    async function openPdf() {
      if (!pdfUrl) {
        return;
      }

      try {
        await WebBrowser.openBrowserAsync(pdfUrl);
        if (isMounted) {
          setStatus('opened');
        }
      } catch (error) {
        console.log('PDF open error:', error);
        if (isMounted) {
          setStatus('error');
        }
      }
    }

    openPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  const handleOpenAgain = async () => {
    if (!pdfUrl) {
      return;
    }

    setStatus('opening');

    try {
      await WebBrowser.openBrowserAsync(pdfUrl);
      setStatus('opened');
    } catch (error) {
      console.log('PDF reopen error:', error);
      setStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      {status === 'opening' && (
        <>
          <ActivityIndicator size="large" color="#2b58ed" />
          <Text style={styles.message}>Opening PDF...</Text>
        </>
      )}

      {status === 'opened' && (
        <>
          <Text style={styles.title}>{title || 'PDF Document'}</Text>
          <Text style={styles.message}>
            The PDF has been opened in your browser or document viewer.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleOpenAgain}>
            <Text style={styles.buttonText}>Open Again</Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.title}>Unable to Open PDF</Text>
          <Text style={styles.message}>
            Please try again. If the file still does not open, the PDF link may be unavailable.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleOpenAgain}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'missing' && (
        <>
          <Text style={styles.title}>PDF Not Available</Text>
          <Text style={styles.message}>No PDF link was provided for this document.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#2b58ed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
