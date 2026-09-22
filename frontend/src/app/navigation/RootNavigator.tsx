import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/entities/session';
import { OnboardingPage } from '@/pages/onboarding';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { HomePage } from '@/pages/home';
import { QuizIntroPage } from '@/pages/quiz-intro';
import { QuizScreen } from '@/pages/QuizScreen';
import { CoursesScreen } from '@/pages/CoursesScreen';
import { KnowledgeReviewScreen } from '@/pages/KnowledgeReviewScreen';
import { ReviewResultScreen } from '@/pages/ReviewResultScreen';
import type { ReviewSubmitResponse } from '@/shared/api/reviewApi';
import { onboardingStorage } from '@/shared/lib/storage/onboardingStorage';
import { colors } from '@/shared/config/theme';
import { MainTabNavigator } from './MainTabNavigator';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: { initialEmail?: string; successMessage?: string } | undefined;
  Register: { initialEmail?: string } | undefined;
  Home: { tab?: 'home' | 'review' | 'forum' | 'jobs' } | undefined;
  QuizIntro: undefined;
  Quiz: undefined;
  Courses: undefined;
  KnowledgeReview: { topicId: string; topicTitle?: string } | undefined;
  ReviewResult: { result: ReviewSubmitResponse; topicId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  // null = ainda carregando a flag; onboarding só aparece na primeira abertura.
  // Relido a cada troca de autenticação para não reaparecer após logout.
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    onboardingStorage
      .hasSeen()
      .then(setHasSeenOnboarding)
      .catch(() => setHasSeenOnboarding(true));
  }, [isAuthenticated]);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // TT-50 & TT-56: Ao alternar o estado de autenticação, o React Navigation desmonta a pilha anterior
  // executando o reset completo de navegação e direcionando diretamente para a HomeScreen
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={MainTabNavigator} />
            <Stack.Screen name="QuizIntro" component={QuizIntroPage} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="Courses" component={CoursesScreen} />
            <Stack.Screen
              name="KnowledgeReview"
              component={KnowledgeReviewScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="ReviewResult" component={ReviewResultScreen} />
          </>
        ) : (
          <>
            {!hasSeenOnboarding && <Stack.Screen name="Onboarding" component={OnboardingPage} />}
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="Register" component={RegisterPage} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
