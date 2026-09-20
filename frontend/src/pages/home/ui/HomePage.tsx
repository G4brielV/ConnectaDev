import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '@/entities/session';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import { LogoutConfirmationModal } from '@/features/auth';

export function HomePage() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => setIsLogoutModalVisible(true)}>
            <Text style={styles.logo}>CONNECTA<Text style={styles.logoStrong}>DEV</Text></Text>
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>◯</Text>
          </View>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroBadge}>RECOMENDAÇÃO INTELIGENTE ✨</Text>
          <Text style={styles.greeting}>Cursos certos e vagas reais para seu perfil</Text>
          <Text style={styles.emailText}>
            {user?.email ? `Olá, ${user.email}` : 'Seu próximo passo na tecnologia começa aqui.'}
          </Text>
          <Text style={styles.infoText}>
            Faça o Quiz Vocacional para receber recomendações alinhadas aos seus interesses.
          </Text>
          <View style={styles.chips}>
            <Text style={styles.chip}>🎓 Cursos gratuitos</Text>
            <Text style={styles.chip}>💼 Vagas locais</Text>
            <Text style={styles.chip}>🏆 Seu perfil</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Quiz')}
            style={styles.quizButton}
          >
            <Text style={styles.quizButtonText}>Começar o Quiz Agora 🚀</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsLogoutModalVisible(true)}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Sair da conta</Text>
          </Pressable>
        </View>

        <LogoutConfirmationModal
          visible={isLogoutModalVisible}
          onConfirm={handleConfirmLogout}
          onCancel={() => setIsLogoutModalVisible(false)}
          isLoading={isLoggingOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: { flexGrow: 1, padding: 24, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  logo: { color: '#033649', fontSize: 18, letterSpacing: 1 },
  logoStrong: { fontWeight: '800', color: '#036564' },
  avatar: { backgroundColor: '#033649', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 20 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2F2',
    color: '#036564',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#031634',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 15,
    color: '#036564',
    fontWeight: '500',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  chip: { backgroundColor: '#F2EEE5', borderRadius: 999, color: '#033649', fontSize: 12, paddingHorizontal: 12, paddingVertical: 8 },
  footer: { gap: 12, marginTop: 32 },
  quizButton: { alignItems: 'center', backgroundColor: '#036564', borderRadius: 12, paddingVertical: 16 },
  quizButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  logoutButton: { alignItems: 'center', paddingVertical: 12 },
  logoutText: { color: '#60717A', fontSize: 14 },
});
