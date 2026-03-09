import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Welcome');

  return (
    <>
      <StatusBar style="auto" />
      {currentScreen === 'Welcome' ? (
        <WelcomeScreen onNavigate={setCurrentScreen} />
      ) : (
        <RoleSelectionScreen onNavigate={setCurrentScreen} />
      )}
    </>
  );
}
