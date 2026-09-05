import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RegisterForm } from '@/features/auth';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export function RegisterPage() {
  const navigation = useNavigation<NavigationProp>();

  const handleNavigateToLogin = (initialEmail?: string) => {
    navigation.navigate('Login', initialEmail ? { initialEmail } : undefined);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logoTitle}>ConnectaDev</Text>
          <Text style={styles.subtitle}>
            Crie sua conta para explorar trilhas, desafios e o ecossistema tech de Pernambuco
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cadastro</Text>
          <RegisterForm onNavigateToLogin={handleNavigateToLogin} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => handleNavigateToLogin()}>
              <Text style={styles.footerLink}>Fazer Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 290,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
});
