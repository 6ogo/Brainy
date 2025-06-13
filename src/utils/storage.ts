type StorageKeys = 'voiceMode' | 'voiceSettings';

export const storage = {
  get: <T>(key: StorageKeys, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(`brainy_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  set: <T>(key: StorageKeys, value: T): void => {
    try {
      localStorage.setItem(`brainy_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  },
  remove: (key: StorageKeys): void => {
    try {
      localStorage.removeItem(`brainy_${key}`);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },
};
