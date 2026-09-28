import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { HomePage } from '@/pages/home';
import { TrailMapPage } from '@/pages/trail-map';
import { CoursesScreen } from '@/pages/CoursesScreen';
import { JobsScreen } from '@/pages/JobsScreen';
import { colors, fonts } from '@/shared/config/theme';
import type { RootStackParamList } from './RootNavigator';

export type MainTabType = 'trail' | 'courses' | 'jobs' | 'profile';

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
  { id: 'profile', label: 'Perfil', icon: 'user' },
];

export function MainTabNavigator() {
  const route = useRoute<RouteProp<RootStackParamList, 'Home'>>();
  const [activeTab, setActiveTab] = useState<MainTabType>(route.params?.tab || 'trail');
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
          <View style={[styles.screenWrapper, activeTab === 'profile' ? styles.screenActive : styles.screenHidden]}>
            <HomePage />
          </View>
        </View>

        {/* Bottom Tab Bar */}
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {TABS.map((tab) => {
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
