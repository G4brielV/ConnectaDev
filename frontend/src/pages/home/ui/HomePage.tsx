import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '@/entities/session';
import { Button } from '@/shared/ui/Button/Button';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.welcomeCard}>
          <Text style={styles.badge}>Autenticado</Text>
          <Text style={styles.greeting}>Bem-vindo ao ConnectaDev! 🚀</Text>
          <Text style={styles.emailText}>
            {user?.email ? `Conectado como: ${user.email}` : 'Sessão ativa com token JWT'}
          </Text>
          <Text style={styles.infoText}>
            Navegação resetada com sucesso. Você não consegue retornar para o login pressionando "Voltar".
          </Text>
        </View>

        <Button
          title="Sair da Conta"
          variant="outline"
          onPress={logout}
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DEF7EC',
    color: '#03543F',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 15,
    color: '#0284C7',
    fontWeight: '500',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  logoutButton: {
    marginBottom: 16,
    borderColor: '#EF4444',
  },
});
