import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/entities/session';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { QuizScreen } from './src/pages/QuizScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <QuizScreen />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
