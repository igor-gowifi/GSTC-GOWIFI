import { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabaseAuth } from '@/services/supabase-auth';
import { signOutUser } from '@/services/supabase-auth';
import { User } from '@/types';
import { DataProvider } from '@/contexts/DataContext';
import { registrarAuditLog } from '@/utils/auditLog';
import { trpc } from '@/lib/trpc';
import LoginSupabase from '@/pages/LoginSupabase';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Tecnicos from '@/pages/Tecnicos';
import Solicitacoes from '@/pages/Solicitacoes';
import NovaSolicitacao from '@/pages/NovaSolicitacao';
import Consulta from '@/pages/Consulta';
import DetalheSolicitacao from '@/pages/DetalheSolicitacao';
import DetalheTecnico from '@/pages/DetalheTecnico';
import DetalheEquipamento from '@/pages/DetalheEquipamento';
import Console from '@/pages/Console';
import Usuarios from '@/pages/Usuarios';
import HistoricoEquipamentos from '@/pages/EquipamentosPendentes';
import Perfil from '@/pages/Perfil';
import Navigation from '@/components/Navigation';
import { canAccessPage } from '@/utils/rolePermissions';
import { useInactivityLogout } from '@/_core/hooks/useInactivityLogout';


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginTime, setLoginTime] = useState<number | null>(null);
  const [location, setLocation] = useLocation();
  
  // Refs to track state
  const hasInitializedRef = useRef(false);
  const hasRegisteredLoginRef = useRef(false);
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enable inactivity logout (30 minutes)
  useInactivityLogout();

  // Route matching
  const [matchDashboard] = useRoute('/');
  const [matchDashboardPath] = useRoute('/dashboard');
  const [matchTecnicos] = useRoute('/tecnicos');
  const [matchDetalheTecnico, tecnicoParams] = useRoute('/tecnicos/:id');
  const [matchSolicitacoes] = useRoute('/solicitacoes');
  const [matchDetalheSolicitacao, params] = useRoute('/detalhes/:id');
  const [matchNovaSolicitacao] = useRoute('/nova-solicitacao');
  const [matchConsulta] = useRoute('/consulta');
  const [matchConsole] = useRoute('/console');
  const [matchUsuarios] = useRoute('/usuarios');
  const [matchHistoricoEquipamentos] = useRoute('/historico-equipamentos');
  const [matchDetalheEquipamento, equipamentoParams] = useRoute('/historico-equipamentos/:id');
  const [matchPerfil] = useRoute('/perfil');
  const [matchLogin] = useRoute('/login');
  const [matchForgotPassword] = useRoute('/forgot-password');
  const [matchResetPassword] = useRoute('/reset-password');

  // Determine active section from URL
  const getActiveSection = () => {
    if (matchDashboard || matchDashboardPath) return 'dashboard';
    if (matchTecnicos || matchDetalheTecnico) return 'tecnicos';
    if (matchSolicitacoes || matchDetalheSolicitacao) return 'solicitacoes';
    if (matchNovaSolicitacao) return 'nova-solicitacao';
    if (matchConsulta) return 'consulta';
    if (matchConsole) return 'console';
    if (matchUsuarios) return 'usuarios';
    if (matchHistoricoEquipamentos) return 'historico-equipamentos';
    if (matchPerfil) return 'perfil';
    return 'dashboard';
  };

  const activeSection = getActiveSection();
  const detalheSolicitacaoId = matchDetalheSolicitacao ? params?.id : null;

  // Fetch user from backend to get correct role - only when we have a session
  const { data: backendUser, isLoading: isLoadingBackendUser, error: backendUserError, refetch: refetchBackendUser } = trpc.auth.me.useQuery(undefined, {
    retry: 2, // Retry up to 2 times on failure
    retryDelay: 500, // Wait 500ms between retries
    enabled: user !== null && user !== undefined, // Only query when we know user is authenticated
  });

  // Initialize session on app mount - check if user is already logged in
  useEffect(() => {
    const initializeSession = async () => {
      console.log('[App] Initializing session...');
      
      try {
        // Check if there's an existing session in Supabase
        const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
        
        if (sessionError) {
          console.error('[App] Error getting session:', sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[App] Found existing session for:', session.user.email);
          // Session exists - the trpc.auth.me query will handle getting user data
          // Just mark that we're checking backend data
        } else {
          console.log('[App] No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('[App] Error during session initialization:', error);
        setLoading(false);
      }
    };

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeSession();
    }
  }, []);

  // Listen to Supabase auth state changes (handles login/logout)
  useEffect(() => {
    console.log('[App] Setting up auth state listener');
    
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state changed:', event, 'Session:', session?.user?.email);
      
      if (session?.user) {
        // User is authenticated - backend query will fetch full user data
        console.log('[App] User authenticated:', session.user.email);
        // Set a temporary user state to enable the query
        setUser({
          uid: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          role: 'analista', // Temporary - will be updated by backend
        });
        // Add small delay to ensure session is fully initialized
        // This prevents race condition where tRPC tries to fetch token before session is ready
        setTimeout(() => {
          console.log('[App] Session ready, triggering auth.me query');
          // Trigger refetch to ensure we get fresh data
          refetchBackendUser().catch(err => {
            console.warn('[App] Initial auth.me refetch failed:', err);
          });
        }, 100);
      } else {
        // User is not authenticated
        console.log('[App] User not authenticated');
        setUser(null);
        setLoading(false);
        hasRegisteredLoginRef.current = false;
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Update user state when backend user data is available
  useEffect(() => {
    if (backendUser) {
      console.log('[App] Backend user data received:', backendUser.email);
      setUser(backendUser);
      
      // Register login only once per user
      if (!hasRegisteredLoginRef.current) {
        hasRegisteredLoginRef.current = true;
        setLoginTime(Date.now());
        
        // TODO: Implementar audit log de forma adequada com tRPC
        // registrarAuditLog(
        //   backendUser.email || '',
        //   backendUser.email || '',
        //   'USUARIO_LOGADO',
        //   `Usuario "${backendUser.email}" fez login`,
        //   'login',
        //   backendUser.uid,
        //   undefined,
        //   { email: backendUser.email, role: backendUser.role }
        // ).catch((err) => {
        //   console.error('Erro ao registrar login:', err);
        // });
      }
      
      setLoading(false);
    } else if (!isLoadingBackendUser && backendUserError) {
      // Backend query finished with error - only redirect if we have a Supabase session
      console.log('[App] Backend query finished with error:', backendUserError);
      setUser(null);
      setLoading(false);
    }
  }, [backendUser, isLoadingBackendUser, backendUserError, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && !isLoadingBackendUser &&
        location !== '/login' && location !== '/forgot-password' && location !== '/reset-password') {
      console.log('[App] Redirecting to login - user not authenticated');
      setLocation('/login');
    }
  }, [loading, user, location, setLocation, isLoadingBackendUser]);

  const handleSectionChange = (section: string) => {
    switch (section) {
      case 'dashboard':
        setLocation('/');
        break;
      case 'tecnicos':
        setLocation('/tecnicos');
        break;
      case 'solicitacoes':
        setLocation('/solicitacoes');
        break;
      case 'nova-solicitacao':
        setLocation('/nova-solicitacao');
        break;
      case 'consulta':
        setLocation('/consulta');
        break;
      case 'console':
        setLocation('/console');
        break;
      case 'usuarios':
        setLocation('/usuarios');
        break;
      case 'historico-equipamentos':
        setLocation('/historico-equipamentos');
        break;
      case 'perfil':
        setLocation('/perfil');
        break;
      default:
        setLocation('/');
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.email) {
        try {
          console.log('[Logout] Registering logout event for:', user.email);
          const response = await fetch('/api/trpc/audit.logoutPublic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              json: {
                usuario: user.email,
                usuarioNome: user.name,
                idDocumento: user.uid,
              },
            }),
          });
          if (response.ok) {
            console.log('[Logout] Logout event registered successfully');
          } else {
            console.warn('[Logout] Failed to register logout:', response.statusText);
          }
        } catch (err) {
          console.error('[Logout] Failed to log logout:', err);
        }
      }
      
      await signOutUser();
      setUser(null);
      setLoginTime(null);
      hasRegisteredLoginRef.current = false;
      setLocation('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (matchLogin) {
    return <LoginSupabase />;
  }

  if (matchForgotPassword) {
    return <ForgotPassword />;
  }

  if (matchResetPassword) {
    return <ResetPassword />;
  }

  // If not authenticated and not on a public page, show loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Check if user has access to current page
  const hasAccess = canAccessPage(user.role as any, activeSection);

  // Main app layout
  return (
    <DataProvider>
      <div className="flex h-screen bg-background">
        <Navigation 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          userEmail={user.email}
          userName={user.name}
          userRole={user.role}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto bg-background text-foreground px-4 md:px-0 pt-16 md:pt-0">
            {!hasAccess && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
                  <p className="text-muted-foreground mb-6">Você não tem permissão para acessar esta página.</p>
                  <button
                    onClick={() => setLocation('/')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Voltar ao Dashboard
                  </button>
                </div>
              </div>
            )}
            {hasAccess && (
              <>
                {(matchDashboard || matchDashboardPath) && <Dashboard />}
                {matchTecnicos && !matchDetalheTecnico && <Tecnicos />}
                {matchDetalheTecnico && <DetalheTecnico />}
                {matchSolicitacoes && !matchDetalheSolicitacao && <Solicitacoes />}
                {matchDetalheSolicitacao && <DetalheSolicitacao />}
                {matchNovaSolicitacao && <NovaSolicitacao />}
                {matchConsulta && <Consulta />}
                {matchConsole && <Console />}
                {matchUsuarios && <Usuarios />}
                {matchHistoricoEquipamentos && !matchDetalheEquipamento && <HistoricoEquipamentos />}
                {matchDetalheEquipamento && <DetalheEquipamento />}
                {matchPerfil && <Perfil />}
              </>
            )}
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
