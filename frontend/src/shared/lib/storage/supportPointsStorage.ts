import { keyValueStorage } from './keyValueStorage';
import { SupportPoint } from '@/shared/api/infrastructureApi';

const SUPPORT_POINTS_CACHE_KEY = 'connectadev_support_points_cache';

export const supportPointsStorage = {
  getCachedPoints: async (): Promise<SupportPoint[] | null> => {
    try {
      const data = await keyValueStorage.getItem(SUPPORT_POINTS_CACHE_KEY);
      return data ? (JSON.parse(data) as SupportPoint[]) : null;
    } catch {
      return null;
    }
  },
  saveCachedPoints: async (points: SupportPoint[]): Promise<void> => {
    try {
      await keyValueStorage.setItem(SUPPORT_POINTS_CACHE_KEY, JSON.stringify(points));
    } catch {
      // Falha silenciosa no cache
    }
  },
};
