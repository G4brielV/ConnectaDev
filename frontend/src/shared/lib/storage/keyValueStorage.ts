import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStorage: Record<string, string> = {};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback para memória caso localStorage não esteja disponível
    }
    memoryStorage[key] = value;
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback para memória
    }
    return memoryStorage[key] || null;
  }

  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback para memória
    }
    delete memoryStorage[key];
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

// Armazenamento chave-valor: SecureStore no nativo, localStorage no web (com fallback em memória)
export const keyValueStorage = { setItem, getItem, deleteItem };
