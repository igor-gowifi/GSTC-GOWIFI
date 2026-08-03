import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { clearAllCache } from "@/lib/cacheManager";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const previousUserRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      console.log('[useAuth] Starting logout...');
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // CRITICAL: Clear ALL cached data immediately to prevent data leakage between users
      console.log('[useAuth] Clearing all cache after logout');
      clearAllCache();
      utils.auth.me.setData(undefined, null);
      previousUserRef.current = null;
      hasInitializedRef.current = false;
      // Also clear any localStorage that might have user data
      try {
        localStorage.removeItem('manus-runtime-user-info');
      } catch (e) {
        console.warn('[useAuth] Failed to clear localStorage:', e);
      }
      console.log('[useAuth] Logout complete - all cache cleared');
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // Invalidate all queries when user changes (different email or role)
  // This ensures data is fresh for the new user's role
  // BUT: Don't invalidate on first login, only on subsequent user changes
  useEffect(() => {
    if (!state.user) {
      previousUserRef.current = null;
      return;
    }

    const currentUserKey = `${state.user.email}:${state.user.role}`;
    
    // Only invalidate if we've already had a user before (not first login)
    if (hasInitializedRef.current && previousUserRef.current && previousUserRef.current !== currentUserKey) {
      console.log('[useAuth] User changed from', previousUserRef.current, 'to', currentUserKey);
      clearAllCache();
      utils.invalidate().catch(err => {
        console.warn('[useAuth] Failed to invalidate queries:', err);
      });
    }
    
    // Mark that we've initialized and track current user
    hasInitializedRef.current = true;
    previousUserRef.current = currentUserKey;
  }, [state.user?.email, state.user?.role, utils]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
