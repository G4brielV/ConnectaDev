import React, { useCallback, useState } from 'react';
import { Pressable, View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/entities/session';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import { LogoutConfirmationModal } from '@/features/auth';
import { useGamification } from '@/entities/gamification';
import { fetchQuizDiagnosis } from '@/shared/api/quizApi';
import { colors, fonts, radius, shadow, spacing } from '@/shared/config/theme';
import { Logo } from '@/shared/ui/Logo';
import { XpProgressBar } from '@/shared/ui/XpProgressBar/XpProgressBar';
import { RestartTrailModal } from './RestartTrailModal';

function getUserInitials(name?: string | null, email?: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const first = words[0][0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
    return `${first}${last}`.toUpperCase();
  }
  const fromEmail = (email ?? '').trim()[0];
  return fromEmail ? fromEmail.toUpperCase() : '?';
}

export function HomePage() {
  const { user, token, logout } = useAuth();
  const { refresh } = useGamification();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [currentArea, setCurrentArea] = useState<string | null>(null);
  const [isRestartTrailModalVisible, setIsRestartTrailModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Atualiza XP/ofensiva e área atual sempre que o Perfil volta ao foco
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void refresh();

      if (token) {
        fetchQuizDiagnosis(token)
          .then((diagnosis) => {
            if (isActive) {
              setCurrentArea(diagnosis.completed ? diagnosis.areaPrincipal : null);
            }
          })
          .catch(() => {
            // Mantém o estado anterior caso não seja possível consultar o diagnóstico
          });
      }

      return () => {
        isActive = false;
      };
    }, [refresh, token]),
  );

  const handleConfirmRestartTrail = () => {
    setIsRestartTrailModalVisible(false);
    navigation.navigate('Quiz');
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalVisible(false);
    }
  };

  const displayName = user?.name?.trim() || 'Estudante ConnectaDev';
  const initials = getUserInitials(user?.name, user?.email);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Logo size={34} showWordmark={false} />
          <View style={styles.headerTexts}>
            <Text style={styles.headerEyebrow}>CONNECTADEV</Text>
            <Text style={styles.headerTitle}>Perfil</Text>
          </View>
        </View>
      </View>
      <XpProgressBar />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            {user?.email ? (
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
            {currentArea ? (
              <View style={styles.areaBadge}>
                <Feather name="compass" size={12} color={colors.primary} />
                <Text style={styles.areaBadgeText} numberOfLines={1}>
                  {currentArea}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>JORNADA E CONTA</Text>
          <View style={styles.actionsCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recomeçar trilha"
              onPress={() => setIsRestartTrailModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.actionRowPressed,
              ]}
            >
              <View style={styles.actionIconPrimary}>
                <Feather name="refresh-cw" size={19} color={colors.primary} />
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitle}>Recomeçar trilha</Text>
                <Text style={styles.actionSubtitle}>
                  Refaça o teste vocacional para iniciar uma nova trilha
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
              onPress={() => setIsLogoutModalVisible(true)}
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.actionRowDangerPressed,
              ]}
            >
              <View style={styles.actionIconDanger}>
                <Feather name="log-out" size={19} color={colors.danger} />
              </View>
              <View style={styles.actionTexts}>
                <Text style={styles.actionTitleDanger}>Sair da conta</Text>
                <Text style={styles.actionSubtitle}>
                  Encerrar sua sessão neste dispositivo
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <RestartTrailModal
          visible={isRestartTrailModalVisible}
          currentArea={currentArea}
          onConfirm={handleConfirmRestartTrail}
          onCancel={() => setIsRestartTrailModalVisible(false)}
        />

        <LogoutConfirmationModal
          visible={isLogoutModalVisible}
          onConfirm={handleConfirmLogout}
          onCancel={() => setIsLogoutModalVisible(false)}
          isLoading={isLoggingOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: colors.canvas,
  },
  headerBrand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTexts: {
    flex: 1,
  },
  headerEyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  headerTitle: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: spacing.xl,
    gap: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    padding: 18,
    ...shadow.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sans.bold,
    fontSize: 20,
    color: colors.textOnPrimary,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontFamily: fonts.sans.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  areaBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  areaBadgeText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 12,
    color: colors.primary,
    flexShrink: 1,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 0.9,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    overflow: 'hidden',
    ...shadow.card,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowPressed: {
    backgroundColor: colors.creamSoft,
  },
  actionRowDangerPressed: {
    backgroundColor: '#FDECEC',
  },
  actionIconPrimary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDanger: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTexts: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  actionTitleDanger: {
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    color: colors.danger,
  },
  actionSubtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.creamSoft,
    marginHorizontal: 16,
  },
});
