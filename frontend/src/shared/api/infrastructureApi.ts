import { apiClient } from './apiClient';
import { formatDistance, buildRouteUrl } from '../lib/infrastructureUtils';

export { formatDistance, buildRouteUrl };

export interface SupportPoint {
  id: string;
  name: string;
  type: string; // "COMPAZ" | "LIBRARY" | "INNOVATION_HUB" | "PUBLIC_WIFI"
  address: string;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  hasComputers: boolean;
  hasWifi: boolean;
  hasStudyTables: boolean;
  openingHours?: string | null;
  accessRules?: string | null;
  status: string;
  distanceKm?: number;
}

export interface FetchSupportPointsParams {
  lat?: number;
  lng?: number;
  hasComputers?: boolean;
  type?: string;
  city?: string;
}

export async function fetchSupportPoints(
  params?: FetchSupportPointsParams
): Promise<SupportPoint[]> {
  const queryParams: Record<string, string | number> = {};

  if (params?.lat !== undefined) queryParams.lat = params.lat;
  if (params?.lng !== undefined) queryParams.lng = params.lng;
  if (params?.hasComputers) queryParams.hasComputers = 'true';
  if (params?.type) queryParams.type = params.type;
  if (params?.city) queryParams.city = params.city;

  const response = await apiClient.get<SupportPoint[]>('/api/infrastructure', {
    params: queryParams,
  });

  return response.data;
}
