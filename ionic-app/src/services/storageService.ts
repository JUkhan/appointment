import { Preferences } from '@capacitor/preferences';

/**
 * Storage service wrapping Capacitor Preferences API
 * Provides AsyncStorage-like interface for cross-platform storage
 */

export const storageService = {
  /**
   * Set a single item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get a single item from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove a single item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  },

  /**
   * Set multiple items in storage
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      const promises = keyValuePairs.map(([key, value]) =>
        Preferences.set({ key, value })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error setting multiple items:', error);
      throw error;
    }
  },

  /**
   * Remove multiple items from storage
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      const promises = keys.map((key) => Preferences.remove({ key }));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error removing multiple items:', error);
      throw error;
    }
  },

  /**
   * Clear all items from storage
   */
  async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  /**
   * Get all keys from storage
   */
  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  },
};

export default storageService;
