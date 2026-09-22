import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/entities/session';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { QuizScreen } from '@/pages/QuizScreen';
import { CoursesScreen } from '@/pages/CoursesScreen';
import { KnowledgeReviewScreen } from '@/pages/KnowledgeReviewScreen';
import { ReviewResultScreen } from '@/pages/ReviewResultScreen';
import { TrailsScreen } from '@/pages/TrailsScreen';
import { TrailLessonScreen } from '@/pages/TrailLessonScreen';
import type { ReviewSubmitResponse } from '@/shared/api/reviewApi';
import { MainTabNavigator } from './MainTabNavigator';

export type RootStackParamList = {
  Login: { initialEmail?: string; successMessage?: string } | undefined;
  Register: { initialEmail?: string } | undefined;
  Home: { tab?: 'home' | 'review' | 'forum' | 'jobs' } | undefined;
  Quiz: undefined;
  Courses: undefined;
  KnowledgeReview: { topicId: string; topicTitle?: string } | undefined;
  ReviewResult: { result: ReviewSubmitResponse; topicId: string };
  Trails: undefined;
  TrailLesson: { lessonId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
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
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="Courses" component={CoursesScreen} />
            <Stack.Screen
              name="KnowledgeReview"
              component={KnowledgeReviewScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="ReviewResult" component={ReviewResultScreen} />
            <Stack.Screen name="Trails" component={TrailsScreen} />
            <Stack.Screen name="TrailLesson" component={TrailLessonScreen} />
          </>
        ) : (
          <>
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
