import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LecturesScreen from '../screens/LecturesScreen';
import ChapterListScreen from '../screens/ChapterListScreen';

const Stack = createNativeStackNavigator();

export default function LecturesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LecturesMain" component={LecturesScreen} />
      <Stack.Screen name="ChapterList" component={ChapterListScreen} />
    </Stack.Navigator>
  );
}
