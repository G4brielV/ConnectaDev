import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, radius } from '@/shared/config/theme';
import {
  SupportPoint,
  fetchSupportPoints,
} from '@/shared/api/infrastructureApi';
import { supportPointsStorage } from '@/shared/lib/storage/supportPointsStorage';
import { SupportPointCard } from '@/features/infrastructure/ui/SupportPointCard';

type FilterType = 'ALL' | 'COMPUTERS' | 'COMPAZ' | 'LIBRARY';

// Coordenadas padrão da RMR (Marco Zero do Recife) caso GPS não esteja disponível
const DEFAULT_RECIFE_COORDS = {
  lat: -8.0632,
  lng: -34.8718,
};

export function SupportPointsPage() {
  const navigation = useNavigation();

  const [points, setPoints] = useState<SupportPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(
    DEFAULT_RECIFE_COORDS
  );

  // Obtém geolocalização do dispositivo se disponível
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Mantém as coordenadas de referência de Recife em caso de recusa/erro
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const loadPoints = useCallback(
    async (showLoadingIndicator = true) => {
      if (showLoadingIndicator) setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await fetchSupportPoints({
          lat: userCoords.lat,
          lng: userCoords.lng,
        });

        setPoints(data);
        setIsOfflineMode(false);
        // Atualiza o cache local para uso offline futuro
        await supportPointsStorage.saveCachedPoints(data);
      } catch {
        // Fallback: tenta recuperar do cache offline
        const cached = await supportPointsStorage.getCachedPoints();
        if (cached && cached.length > 0) {
          setPoints(cached);
          setIsOfflineMode(true);
        } else {
          setErrorMessage(
            'Não foi possível carregar os pontos de apoio. Verifique sua conexão e tente novamente.'
          );
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userCoords]
  );

  useEffect(() => {
    void loadPoints(true);
  }, [loadPoints]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadPoints(false);
  };

  // Filtragem dos pontos em memória
  const filteredPoints = useMemo(() => {
    return points.filter((point) => {
      if (activeFilter === 'COMPUTERS') {
        return point.hasComputers;
      }
      if (activeFilter === 'COMPAZ') {
        return point.type === 'COMPAZ';
      }
      if (activeFilter === 'LIBRARY') {
        return point.type === 'LIBRARY';
      }
      return true;
    });
  }, [points, activeFilter]);

  const filterButtons: { id: FilterType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: 'ALL', label: 'Todos', icon: 'grid' },
    { id: 'COMPUTERS', label: 'Com Computador', icon: 'monitor' },
    { id: 'COMPAZ', label: 'Compaz', icon: 'shield' },
    { id: 'LIBRARY', label: 'Bibliotecas', icon: 'book' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Pontos de Apoio</Text>
          <Text style={styles.headerSubtitle}>
            Wi-Fi gratuito e locais de estudo na RMR
          </Text>
        </View>
      </View>

      {/* Banner de Modo Offline */}
      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Feather name="cloud-off" size={14} color="#856404" />
          <Text style={styles.offlineBannerText}>
            Modo Offline: Exibindo locais salvos no seu aparelho.
          </Text>
        </View>
      )}

      {/* Barra de Filtros */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterButtons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filtersContainer}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.id;
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Feather
                  name={item.icon}
                  size={14}
                  color={isActive ? colors.textOnPrimary : colors.textBody}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Conteúdo Principal: Loading, Erro ou Lista */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Buscando pontos com Wi-Fi na RMR...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={40} color={colors.danger} />
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadPoints(true)}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredPoints}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="map-pin" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum local encontrado</Text>
              <Text style={styles.emptyText}>
                Nenhum ponto de apoio corresponde ao filtro selecionado. Tente selecionar outro filtro.
              </Text>
            </View>
          }
          renderItem={({ item }) => <SupportPointCard point={item} />}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEEBA',
  },
  offlineBannerText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: '#856404',
  },
  filtersWrapper: {
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textBody,
  },
  filterChipTextActive: {
    color: colors.textOnPrimary,
    fontFamily: fonts.sans.bold,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
  },
  errorTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 12,
  },
  errorMessage: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  retryButtonText: {
    fontFamily: fonts.sans.bold,
    fontSize: 13,
    color: colors.textOnPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptyText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
