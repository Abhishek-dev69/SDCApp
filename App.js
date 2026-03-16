import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import LoginScreen from './src/screens/LoginScreen';
import BatchSelectionScreen from './src/screens/BatchSelectionScreen';
import SubjectSelectionScreen from './src/screens/SubjectSelectionScreen';
import StudentTabNavigator from './src/navigation/StudentTabNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="RoleSelection"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="BatchSelection" component={BatchSelectionScreen} />
          <Stack.Screen name="SubjectSelection" component={SubjectSelectionScreen} />
          <Stack.Screen name="MainTabs" component={StudentTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
