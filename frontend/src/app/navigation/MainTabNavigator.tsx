import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RouteProp, NavigationProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HomePage } from '@/pages/home';
import { TrailMapPage } from '@/pages/trail-map';
import { CoursesScreen } from '@/pages/CoursesScreen';
import { JobsScreen } from '@/pages/JobsScreen';
import { ForumScreen } from '@/pages/ForumScreen';
import { colors, fonts } from '@/shared/config/theme';
import type { RootStackParamList } from './RootNavigator';
import { EventsPage } from '@/pages/events/ui/EventsPage';

export type MainTabType = 'trail' | 'courses' | 'jobs' | 'events' | 'forum' | 'profile';

interface TabContextType {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
}

const TabContext = createContext<TabContextType>({
  activeTab: 'trail',
  setActiveTab: () => {},
});

export const useMainTab = () => useContext(TabContext);

interface TabItem {
  id: MainTabType;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

// Abas da tela "Trilha de Aprendizado" do Stitch. A aba Revisão saiu: a
// prova agora vive dentro de cada fase da trilha.
const TABS: TabItem[] = [
  { id: 'trail', label: 'Trilha', icon: 'map' },
  { id: 'courses', label: 'Cursos', icon: 'book-open' },
  { id: 'jobs', label: 'Vagas', icon: 'briefcase' },
  { id: 'events', label: 'Eventos', icon: 'calendar' },
  { id: 'forum', label: 'Fórum', icon: 'message-circle' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
];

export function MainTabNavigator() {
  const route = useRoute<RouteProp<RootStackParamList, 'Home'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<MainTabType>(route.params?.tab || 'trail');
  const [isQuickActionsVisible, setIsQuickActionsVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <View style={styles.container}>
        {/* Tab Screens - Keep state by rendering them in flex container with visibility toggled */}
        <View style={styles.screenContainer}>
          <View style={[styles.screenWrapper, activeTab === 'trail' ? styles.screenActive : styles.screenHidden]}>
            <TrailMapPage />
          </View>
          <View style={[styles.screenWrapper, activeTab === 'courses' ? styles.screenActive : styles.screenHidden]}>
            <CoursesScreen />
          </View>
          <View style={[styles.screenWrapper, activeTab === 'jobs' ? styles.screenActive : styles.screenHidden]}>
            <JobsScreen />
          </View>
          <View style={[styles.screenWrapper, activeTab === 'events' ? styles.screenActive : styles.screenHidden]}>
            <EventsPage />
          </View>
          <View style={[styles.screenWrapper, activeTab === 'forum' ? styles.screenActive : styles.screenHidden]}>
            <ForumScreen />
          </View>
          <View style={[styles.screenWrapper, activeTab === 'profile' ? styles.screenActive : styles.screenHidden]}>
            <HomePage />
          </View>
        </View>

        {/* Bottom Tab Bar */}
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {TABS.slice(0, 3).map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={tab.label}
              >
                <Feather
                  name={tab.icon}
                  size={22}
                  color={isSelected ? colors.primary : colors.textMuted}
                  style={styles.icon}
                />
                <Text style={[styles.tabLabel, isSelected ? styles.tabLabelActive : styles.tabLabelInactive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={styles.plusButtonContainer}
            onPress={() => setIsQuickActionsVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir hub de ações"
          >
            <View style={styles.plusButton}>
              <Feather name="plus" size={28} color={colors.textOnPrimary} />
            </View>
            <Text style={styles.plusLabel}>Mais</Text>
          </Pressable>
          {TABS.slice(3).map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={tab.label}
              >
                <Feather
                  name={tab.icon}
                  size={22}
                  color={isSelected ? colors.primary : colors.textMuted}
                  style={styles.icon}
                />
                <Text style={[styles.tabLabel, isSelected ? styles.tabLabelActive : styles.tabLabelInactive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Modal
          transparent
          visible={isQuickActionsVisible}
          animationType="fade"
          onRequestClose={() => setIsQuickActionsVisible(false)}
        >
          <Pressable
            style={styles.quickActionsOverlay}
            onPress={() => setIsQuickActionsVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar hub de ações"
          >
            <Pressable
              style={[styles.quickActionsSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.quickActionsHandle} />
              <Text style={styles.quickActionsTitle}>Hub de ações</Text>
              <Pressable
                style={styles.quickAction}
                accessibilityRole="button"
                onPress={() => {
                  setIsQuickActionsVisible(false);
                  navigation.navigate('SupportPoints');
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Feather name="map-pin" size={22} color={colors.primary} />
                </View>
                <View style={styles.quickActionTexts}>
                  <Text style={styles.quickActionTitle}>Pontos de Apoio na RMR</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Wi-Fi gratuito, computadores e locais de estudo próximos.
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
              <Pressable
                style={[styles.quickAction, styles.quickActionSpaced]}
                accessibilityRole="button"
                onPress={() => {
                  setIsQuickActionsVisible(false);
                  navigation.navigate('Courses');
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Feather name="book-open" size={22} color={colors.primary} />
                </View>
                <View style={styles.quickActionTexts}>
                  <Text style={styles.quickActionTitle}>Meus cursos</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Veja seus cursos, favoritos e avaliações.
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </TabContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  screenContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  screenActive: {
    display: 'flex',
  },
  screenHidden: {
    display: 'none',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopColor: colors.light,
    borderTopWidth: 1,
    paddingTop: 8,
    elevation: 8,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    marginBottom: 4,
  },
  plusButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    elevation: 6,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  plusLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.sans.semiBold,
    marginTop: 1,
  },
  quickActionsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3, 22, 52, 0.45)',
  },
  quickActionsSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  quickActionsHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.light,
    marginBottom: 14,
  },
  quickActionsTitle: {
    color: colors.dark,
    fontSize: 20,
    fontFamily: fonts.sans.bold,
    marginBottom: 14,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 16,
    backgroundColor: colors.canvas,
    padding: 14,
    gap: 12,
  },
  quickActionSpaced: {
    marginTop: 10,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTexts: {
    flex: 1,
  },
  quickActionTitle: {
    color: colors.dark,
    fontSize: 15,
    fontFamily: fonts.sans.bold,
  },
  quickActionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 11,
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: fonts.sans.bold,
  },
  tabLabelInactive: {
    color: colors.textMuted,
    fontFamily: fonts.sans.semiBold,
  },
});
