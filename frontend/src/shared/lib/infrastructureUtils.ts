/**
 * Formata a distância para exibição amigável no card.
 * Ex: 0.8 km -> "A 800m de você", 1.4 km -> "A 1,4 km de você".
 */
export function formatDistance(distanceKm?: number | null): string | null {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return null;
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `A ${meters}m de você`;
  }
  return `A ${distanceKm.toFixed(1).replace('.', ',')} km de você`;
}

/**
 * Gera URL de rota para abertura no Google Maps / Apple Maps.
 */
export function buildRouteUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
