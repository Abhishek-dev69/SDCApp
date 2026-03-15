import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import BatchSelectionScreen from './src/screens/BatchSelectionScreen';
import SubjectSelectionScreen from './src/screens/SubjectSelectionScreen';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('RoleSelection');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Welcome':
        return <WelcomeScreen onNavigate={setCurrentScreen} />;
      case 'RoleSelection':
        return <RoleSelectionScreen onNavigate={setCurrentScreen} />;
      case 'BatchSelection':
        return <BatchSelectionScreen onNavigate={setCurrentScreen} />;
      case 'SubjectSelection':
        return <SubjectSelectionScreen onNavigate={setCurrentScreen} />;
      case 'Login':
        return <LoginScreen onNavigate={setCurrentScreen} />;
      default:
        return <RoleSelectionScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {renderScreen()}
    </SafeAreaProvider>
  );
}
