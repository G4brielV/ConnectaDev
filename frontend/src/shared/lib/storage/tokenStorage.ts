import { keyValueStorage } from './keyValueStorage';

const ACCESS_TOKEN_KEY = 'connectadev_access_token';
const REFRESH_TOKEN_KEY = 'connectadev_refresh_token';

const { setItem, getItem, deleteItem } = keyValueStorage;

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => setItem(ACCESS_TOKEN_KEY, token),
  removeAccessToken: () => deleteItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => deleteItem(REFRESH_TOKEN_KEY),

  clearTokens: async (): Promise<void> => {
    await Promise.all([
      deleteItem(ACCESS_TOKEN_KEY),
      deleteItem(REFRESH_TOKEN_KEY),
    ]);
  },
};
