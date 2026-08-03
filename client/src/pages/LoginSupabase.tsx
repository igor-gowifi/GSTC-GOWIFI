import { useState } from 'react';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { signIn } from '@/services/supabase-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';

export default function LoginSupabase() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [hasLoggedAudit, setHasLoggedAudit] = useState(false);

  // Log login event when user is authenticated
  useEffect(() => {
    if (user && !hasLoggedAudit) {
      // Use public endpoint to log login
      fetch('/api/trpc/audit.loginPublic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            usuario: user.email,
            usuarioNome: user.name,
            idDocumento: user.uid,
          },
        }),
      })
        .then((res) => {
          if (res.ok) {
            console.log('[Login] Login event registered successfully');
          } else {
            console.warn('[Login] Failed to register login:', res.statusText);
          }
        })
        .catch((err) => console.error('[Login] Failed to log login:', err));
      setHasLoggedAudit(true);
    }
  }, [user, hasLoggedAudit]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || 'Erro ao fazer login');
        return;
      }

      if (data?.user) {
        // Wait a bit for the session to be fully established
        // Then redirect to dashboard
        setTimeout(() => {
          setLocation('/');
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">GoWiFi</CardTitle>
          <CardDescription>Gerenciamento de Solicitações Técnicas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <a href="/forgot-password" className="text-sm text-blue-600 hover:underline block text-center">
              Esqueci minha senha
            </a>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
