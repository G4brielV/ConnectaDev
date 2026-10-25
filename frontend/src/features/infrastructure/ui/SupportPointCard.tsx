import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '@/shared/config/theme';
import { SupportPoint, formatDistance, buildRouteUrl } from '@/shared/api/infrastructureApi';

interface SupportPointCardProps {
  point: SupportPoint;
}

export function SupportPointCard({ point }: SupportPointCardProps) {
  const distanceText = formatDistance(point.distanceKm);

  const handleOpenRoute = () => {
    const url = buildRouteUrl(point.latitude, point.longitude);
    Linking.openURL(url).catch(() => undefined);
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'COMPAZ':
        return 'COMPAZ';
      case 'LIBRARY':
        return 'BIBLIOTECA PÚBLICA';
      case 'INNOVATION_HUB':
        return 'POLO DE INOVAÇÃO';
      case 'PUBLIC_WIFI':
        return 'WI-FI PÚBLICO';
      default:
        return 'PONTO DE APOIO';
    }
  };

  return (
    <View style={styles.card}>
      {/* Header do Card: Tipo e Distância */}
      <View style={styles.headerRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{getTypeLabel(point.type)}</Text>
        </View>
        {distanceText && (
          <View style={styles.distanceBadge}>
            <Feather name="map-pin" size={12} color={colors.primary} />
            <Text style={styles.distanceText}>{distanceText}</Text>
          </View>
        )}
      </View>

      {/* Nome do Local */}
      <Text style={styles.title}>{point.name}</Text>

      {/* Endereço */}
      <View style={styles.locationRow}>
        <Feather name="navigation" size={13} color={colors.textMuted} style={styles.iconOffset} />
        <Text style={styles.addressText} numberOfLines={2}>
          {point.address} • {point.neighborhood}, {point.city}
        </Text>
      </View>

      {/* Badges de Infraestrutura */}
      <View style={styles.badgesContainer}>
        <View style={styles.featureBadge}>
          <Feather name="wifi" size={12} color={colors.success} />
          <Text style={styles.featureText}>Wi-Fi Gratuito</Text>
        </View>

        {point.hasComputers && (
          <View style={[styles.featureBadge, styles.computerBadge]}>
            <Feather name="monitor" size={12} color={colors.primary} />
            <Text style={[styles.featureText, styles.computerText]}>Computadores Livres</Text>
          </View>
        )}

        {point.hasStudyTables && (
          <View style={styles.featureBadge}>
            <Feather name="book" size={12} color={colors.secondary} />
            <Text style={styles.featureText}>Mesas de Estudo</Text>
          </View>
        )}
      </View>

      {/* Horário de Funcionamento */}
      {point.openingHours && (
        <View style={styles.infoRow}>
          <Feather name="clock" size={13} color={colors.textMuted} />
          <Text style={styles.infoText}>{point.openingHours}</Text>
        </View>
      )}

      {/* Regras de Acesso */}
      {point.accessRules && (
        <View style={styles.infoRow}>
          <Feather name="info" size={13} color={colors.textMuted} />
          <Text style={styles.infoText} numberOfLines={2}>
            {point.accessRules}
          </Text>
        </View>
      )}

      {/* Botão de Ação: Como Chegar */}
      <Pressable
        style={({ pressed }) => [styles.routeButton, pressed && styles.routeButtonPressed]}
        onPress={handleOpenRoute}
        accessibilityRole="button"
        accessibilityLabel={`Traçar rota até ${point.name}`}
      >
        <Text style={styles.routeButtonText}>Como Chegar</Text>
        <Feather name="arrow-up-right" size={16} color={colors.textOnPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.light,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: colors.creamSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  typeText: {
    fontFamily: fonts.sans.bold,
    fontSize: 10,
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  distanceText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 11,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.sans.bold,
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconOffset: {
    marginTop: 2,
    marginRight: 6,
  },
  addressText: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  featureText: {
    fontFamily: fonts.sans.medium,
    fontSize: 11,
    color: colors.textBody,
  },
  computerBadge: {
    backgroundColor: '#E6F4F4',
  },
  computerText: {
    color: colors.primary,
    fontFamily: fonts.sans.bold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginTop: 6,
  },
  routeButtonPressed: {
    backgroundColor: colors.primaryActive,
  },
  routeButtonText: {
    fontFamily: fonts.sans.bold,
    fontSize: 14,
    color: colors.textOnPrimary,
  },
});
