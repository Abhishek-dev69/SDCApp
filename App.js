import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import ClassSelectionScreen from './src/screens/ClassSelectionScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Welcome');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Welcome':
        return <WelcomeScreen onNavigate={setCurrentScreen} />;
      case 'RoleSelection':
        return <RoleSelectionScreen onNavigate={setCurrentScreen} />;
      case 'ClassSelection':
        return <ClassSelectionScreen onNavigate={setCurrentScreen} />;
      default:
        return <WelcomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {renderScreen()}
    </SafeAreaProvider>
  );
}
