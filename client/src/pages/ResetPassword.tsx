import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { updatePasswordWithToken, getSession } from '@/services/supabase-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [, setLocation] = useLocation();

  // Validate that user has a valid reset token
  useEffect(() => {
    const validateToken = async () => {
      try {
        const { data: session } = await getSession();
        if (!session) {
          setError('Link de reset inválido ou expirado. Solicite um novo.');
        }
        setValidating(false);
      } catch (err) {
        setError('Erro ao validar link de reset');
        setValidating(false);
      }
    };

    validateToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { data, error: updateError } = await updatePasswordWithToken(newPassword);

      if (updateError) {
        setError(updateError.message || 'Erro ao resetar senha');
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao resetar senha');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Validando link de reset...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Senha Resetada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
              ✅ Sua senha foi resetada com sucesso!
            </div>
            <p className="text-sm text-gray-600">
              Você pode agora fazer login com sua nova senha.
            </p>
            <Button
              onClick={() => setLocation('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Resetar Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                Nova Senha
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Senha
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Resetando...' : 'Resetar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
