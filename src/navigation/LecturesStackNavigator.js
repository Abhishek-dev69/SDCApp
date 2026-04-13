import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LecturesScreen from '../screens/student/LecturesScreen';
import ChapterListScreen from '../screens/student/ChapterListScreen';
import PdfViewerScreen from '../screens/student/PdfViewerScreen'; 
import MaterialFilterScreen from '../screens/student/MaterialFilterScreen';

const Stack = createNativeStackNavigator();

export default function LecturesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      <Stack.Screen name="LecturesMain" component={LecturesScreen} />
      
      <Stack.Screen name="ChapterList" component={ChapterListScreen} />
      
      
      <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />

      <Stack.Screen name="MaterialFilter" component={MaterialFilterScreen} />

    </Stack.Navigator>
  );
}