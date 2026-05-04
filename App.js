import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import LoginScreen from './src/screens/LoginScreen';
import ChangePasswordScreen from './src/screens/auth/ChangePasswordScreen';
import BatchSelectionScreen from './src/screens/student/BatchSelectionScreen';
import StudentTabNavigator from './src/navigation/StudentTabNavigator';
import AdminTabNavigator from './src/navigation/AdminTabNavigator';
import OwnerTabNavigator from './src/navigation/OwnerTabNavigator';
import ParentTabNavigator from './src/navigation/ParentTabNavigator';
import AddStudentScreen from './src/screens/admin/AddStudentScreen';
import AddTeacherScreen from './src/screens/admin/AddTeacherScreen';
import AssignBatchScreen from './src/screens/admin/AssignBatchScreen';
import AddBatchScreen from './src/screens/admin/AddBatchScreen';
import EmailSignUpScreen from './src/screens/auth/EmailSignUpScreen';
import EmailSignInScreen from './src/screens/auth/EmailSignInScreen';
import PhoneLoginScreen from './src/screens/auth/PhoneLoginScreen';
import OTPVerificationScreen from './src/screens/auth/OTPVerificationScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import { StudentSessionProvider } from './src/context/StudentSessionContext';
import MaterialFilterScreen from './src/screens/student/MaterialFilterScreen';  
import LecturesScreen from './src/screens/student/LecturesScreen';
import PdfViewerScreen from './src/screens/student/PdfViewerScreen';
import CreateAccountScreen from './src/screens/auth/CreateAccountScreen';
import LinkGoogleScreen from './src/screens/auth/LinkGoogleScreen';
import SDCLoginScreen from './src/screens/auth/SDCLoginScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <StudentSessionProvider>
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
            <Stack.Screen name="MainTabs" component={StudentTabNavigator} />
            <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
            <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
            <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />
            <Stack.Screen name="AddStudent" component={AddStudentScreen} />
            <Stack.Screen name="AddTeacher" component={AddTeacherScreen} />
            <Stack.Screen name="AssignBatch" component={AssignBatchScreen} />
            <Stack.Screen name="AddBatch" component={AddBatchScreen} />
            <Stack.Screen name="EmailSignUp" component={EmailSignUpScreen} />
            <Stack.Screen name="EmailSignIn" component={EmailSignInScreen} />
            <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Lectures" component={LecturesScreen} />
            <Stack.Screen name="PDFViewer" component={PdfViewerScreen} />
            <Stack.Screen name="MaterialFilter" component={MaterialFilterScreen} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
            <Stack.Screen name="LinkGoogle" component={LinkGoogleScreen} />
            <Stack.Screen name="SDCLogin" component={SDCLoginScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </StudentSessionProvider>
  );
}
