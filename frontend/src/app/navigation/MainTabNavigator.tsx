import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { HomePage } from '@/pages/home';
import { ReviewHubScreen } from '@/pages/ReviewHubScreen';
import { ForumScreen } from '@/pages/ForumScreen';
import { JobsScreen } from '@/pages/JobsScreen';
import type { RootStackParamList } from './RootNavigator';

export type MainTabType = 'home' | 'review' | 'forum' | 'jobs';

export type MainTabParamList = {
  HomeTab: undefined;
  ReviewTab: undefined;
  ForumTab: undefined;
  JobsTab: undefined;
};

interface TabContextType {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
}

const TabContext = createContext<TabContextType>({
  activeTab: 'home',
  setActiveTab: () => {},
});

export const useMainTab = () => useContext(TabContext);

interface TabItem {
  id: MainTabType;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { id: 'home', label: 'Início', icon: '🏠' },
  { id: 'review', label: 'Revisão', icon: '📝' },
  { id: 'forum', label: 'Fórum', icon: '💬' },
  { id: 'jobs', label: 'Vagas', icon: '💼' },
];

export function MainTabNavigator() {
  const route = useRoute<RouteProp<RootStackParamList, 'Home'>>();
  const [activeTab, setActiveTab] = useState<MainTabType>(route.params?.tab || 'home');
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
          <View style={[styles.screenWrapper, activeTab === 'home' ? styles.screenActive : styles.screenHidden]}>
            <HomePage />
          </View>
          <View style={[styles.screenWrapper, activeTab === 'review' ? styles.screenActive : styles.screenHidden]}>
            <ReviewHubScreen />
          </View>
          <View style={[styles.screenWrapper, activeTab === 'forum' ? styles.screenActive : styles.screenHidden]}>
            <ForumScreen />
          </View>
          <View style={[styles.screenWrapper, activeTab === 'jobs' ? styles.screenActive : styles.screenHidden]}>
            <JobsScreen />
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
                <Text style={[styles.icon, isSelected && styles.iconActive]}>{tab.icon}</Text>
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
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
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.8,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#036564',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#94A3B8',
  },
});
