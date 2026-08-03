import { QueryClient } from '@tanstack/react-query';

let queryClientInstance: QueryClient | null = null;

/**
 * Set the global QueryClient instance
 * Called from main.tsx after creating the QueryClient
 */
export function setQueryClient(client: QueryClient) {
  queryClientInstance = client;
}

/**
 * Clear all cached queries and mutations
 * Should be called on logout to prevent data leakage between users
 */
export function clearAllCache() {
  if (!queryClientInstance) {
    console.warn('[CacheManager] QueryClient not initialized');
    return;
  }

  console.log('[CacheManager] Clearing all cached data...');
  
  // Clear all queries
  queryClientInstance.getQueryCache().clear();
  
  // Clear all mutations
  queryClientInstance.getMutationCache().clear();
  
  // Clear localStorage data that might contain user-specific info
  try {
    localStorage.removeItem('manus-runtime-user-info');
    console.log('[CacheManager] Cleared localStorage');
  } catch (error) {
    console.warn('[CacheManager] Failed to clear localStorage:', error);
  }
  
  console.log('[CacheManager] Cache cleared successfully');
}

/**
 * Get the QueryClient instance
 */
export function getQueryClient(): QueryClient | null {
  return queryClientInstance;
}
