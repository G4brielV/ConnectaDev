import { useCallback, useEffect, useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, spacing } from '@/shared/config/theme';
import { XpProgressBar } from '@/shared/ui/XpProgressBar/XpProgressBar';
import { fetchEvents } from '@/shared/api/eventsApi';
import type { EventItem } from '@/shared/api/eventsApi';

type EventFilter = 'Todos' | 'Hoje' | 'Esta semana';

const FILTERS: EventFilter[] = ['Todos', 'Hoje', 'Esta semana'];

export function EventsPage() {
  const [selectedFilter, setSelectedFilter] = useState<EventFilter>('Todos');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchEvents();
      setEvents(response.events);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os eventos.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const visibleEvents = useMemo(
    () => events.filter((event) => matchesFilter(event, selectedFilter)),
    [events, selectedFilter],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Buscando eventos...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => void loadEvents()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <XpProgressBar />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.eyebrow}>CONNECTA<Text style={styles.eyebrowStrong}>DEV</Text></Text>
            <Text style={styles.title}>Eventos próximos</Text>
          </View>
          <View style={styles.calendarIcon}>
            <Feather name="calendar" size={22} color={colors.primary} />
          </View>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Feather name="map-pin" size={20} color={colors.secondary} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Aprenda, conecte-se e cresça</Text>
            <Text style={styles.introDescription}>
              Encontre encontros e oportunidades perto de você.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>O que está acontecendo</Text>
          <Text style={styles.eventCount}>{visibleEvents.length} eventos</Text>
        </View>

        <View style={styles.filters}>
          {FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filter, isSelected && styles.filterSelected]}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.eventList}>
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>

        {visibleEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={28} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
            <Text style={styles.emptyText}>Tente selecionar outro período.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const openEvent = async () => {
    try {
      await Linking.openURL(event.link);
    } catch {
      Alert.alert('Não foi possível abrir o evento', 'Tente novamente em alguns instantes.');
    }
  };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Abrir evento ${event.title}`}
      onPress={() => void openEvent()}
      style={styles.eventCard}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{event.day}</Text>
        <Text style={styles.dateMonth}>{event.month}</Text>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={styles.metaRow}>
          <Feather name="clock" size={13} color={colors.textMuted} />
          <Text style={[styles.metaText, { flexShrink: 0 }]} >{event.time}</Text>
          <Feather name="map-pin" size={13} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
        </View>
        <View style={styles.formatBadge}>
          <Text style={styles.formatText}>{event.format}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.primary} />
    </Pressable>
  );
}

function matchesFilter(event: EventItem, filter: EventFilter): boolean {
  if (filter === 'Todos') return true;

  const eventDate = new Date(event.startsAt);
  const now = new Date();
  if (filter === 'Hoje') {
    return eventDate.getFullYear() === now.getFullYear()
      && eventDate.getMonth() === now.getMonth()
      && eventDate.getDate() === now.getDate();
  }

  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  return eventDate >= now && eventDate <= endOfWeek;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.secondary,
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.sans.semiBold,
    fontSize: 12,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  brand: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.secondary,
    fontFamily: fonts.sans.bold,
    fontSize: 12,
    letterSpacing: 1.3,
  },
  eyebrowStrong: {
    color: colors.primary,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.sans.bold,
    fontSize: 26,
  },
  calendarIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  introCard: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginBottom: spacing.xl,
    padding: spacing.md,
    ...shadow.card,
  },
  introIcon: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 42,
  },
  introText: {
    flex: 1,
  },
  introTitle: {
    color: colors.textOnDark,
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  introDescription: {
    color: colors.light,
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.secondary,
    fontFamily: fonts.sans.bold,
    fontSize: 18,
  },
  eventCount: {
    color: colors.textMuted,
    fontFamily: fonts.sans.medium,
    fontSize: 12,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filter: {
    borderColor: colors.light,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontFamily: fonts.sans.semiBold,
    fontSize: 12,
  },
  filterTextSelected: {
    color: colors.textOnPrimary,
  },
  eventList: {
    gap: spacing.md,
  },
  eventCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    padding: spacing.md,
    ...shadow.card,
  },
  dateBlock: {
    alignItems: 'center',
    backgroundColor: colors.creamSoft,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginRight: spacing.md,
    minHeight: 62,
    paddingHorizontal: spacing.sm,
    width: 58,
  },
  dateDay: {
    color: colors.secondary,
    fontFamily: fonts.sans.extraBold,
    fontSize: 22,
  },
  dateMonth: {
    color: colors.primary,
    fontFamily: fonts.sans.bold,
    fontSize: 10,
  },
  eventDetails: {
    flex: 1,
    minWidth: 0,
  },
  category: {
    color: colors.primary,
    fontFamily: fonts.sans.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  eventTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sans.semiBold,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    flexShrink: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 11,
    marginRight: spacing.xs,
  },
  formatBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  formatText: {
    color: colors.accentInk,
    fontFamily: fonts.sans.semiBold,
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.secondary,
    fontFamily: fonts.sans.semiBold,
    fontSize: 15,
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
