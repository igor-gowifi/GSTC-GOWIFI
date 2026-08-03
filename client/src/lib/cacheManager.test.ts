import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { setQueryClient, clearAllCache, getQueryClient } from './cacheManager';

describe('Cache Manager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    setQueryClient(queryClient);
    localStorage.clear();
  });

  it('should register QueryClient instance', () => {
    const registered = getQueryClient();
    expect(registered).toBe(queryClient);
  });

  it('should clear all cached queries', () => {
    // Add some data to the cache
    queryClient.setQueryData(['test'], { data: 'test' });
    expect(queryClient.getQueryData(['test'])).toEqual({ data: 'test' });

    // Clear cache
    clearAllCache();

    // Verify cache is empty
    expect(queryClient.getQueryData(['test'])).toBeUndefined();
  });

  it('should clear localStorage on logout', () => {
    // Set localStorage data
    localStorage.setItem('manus-runtime-user-info', JSON.stringify({ email: 'test@example.com' }));
    expect(localStorage.getItem('manus-runtime-user-info')).toBeTruthy();

    // Clear cache
    clearAllCache();

    // Verify localStorage is cleared
    expect(localStorage.getItem('manus-runtime-user-info')).toBeNull();
  });

  it('should handle clearing cache when QueryClient not initialized', () => {
    // This should not throw an error
    setQueryClient(null as any);
    expect(() => clearAllCache()).not.toThrow();
  });

  it('should clear multiple cached queries', () => {
    // Add multiple queries to cache
    queryClient.setQueryData(['users'], [{ id: 1, name: 'Admin' }]);
    queryClient.setQueryData(['solicitacoes'], [{ id: 1, status: 'pendente' }]);
    queryClient.setQueryData(['tecnicos'], [{ id: 1, name: 'Tech' }]);

    expect(queryClient.getQueryData(['users'])).toBeDefined();
    expect(queryClient.getQueryData(['solicitacoes'])).toBeDefined();
    expect(queryClient.getQueryData(['tecnicos'])).toBeDefined();

    // Clear all cache
    clearAllCache();

    // Verify all are cleared
    expect(queryClient.getQueryData(['users'])).toBeUndefined();
    expect(queryClient.getQueryData(['solicitacoes'])).toBeUndefined();
    expect(queryClient.getQueryData(['tecnicos'])).toBeUndefined();
  });
});
