import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setQueryClient } from "@/lib/cacheManager";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { supabaseAuth } from "./services/supabase-auth";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
setQueryClient(queryClient);

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${window.location.origin}/api/trpc`,
      transformer: superjson,
      async fetch(input, init) {
        const headers = new Headers((init?.headers as HeadersInit) || {});
        
        try {
          const { data } = await supabaseAuth.auth.getSession();
          const session = data?.session;
          
          if (session?.access_token) {
            headers.set('Authorization', `Bearer ${session.access_token}`);
          }
        } catch (error) {
          console.error('[tRPC] Error getting session:', error);
        }
        
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers,
        });
      },
    }),
  ],
});

let root: ReturnType<typeof createRoot> | null = null;

const renderApp = () => {
  const container = document.getElementById("root");
  if (!container) return;

  if (!root) {
    root = createRoot(container);
  }

  root.render(
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <App />
            <Toaster />
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

console.log('[Main] Initializing app...');

let hasInitialRender = false;
supabaseAuth.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase] Auth state changed:', event);
  renderApp();
  hasInitialRender = true;
});

setTimeout(() => {
  if (!hasInitialRender) {
    console.log('[Main] No auth state change within 1s, rendering anyway');
    renderApp();
  }
}, 1000);
