import { useState } from 'react';
import { useLocation } from 'wouter';
import { sendPasswordResetEmail } from '@/services/supabase-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: resetError } = await sendPasswordResetEmail(email);

      if (resetError) {
        setError(resetError.message || 'Erro ao enviar email de reset');
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de reset');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Email Enviado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
              ✅ Email de reset de senha enviado para <strong>{email}</strong>
            </div>
            <p className="text-sm text-gray-600">
              Verifique seu email e clique no link para resetar sua senha. O link expira em 24 horas.
            </p>
            <Button
              onClick={() => setLocation('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Voltar para Login
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
          <CardTitle className="text-2xl">Esqueci minha Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de reset
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

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Reset'}
            </Button>

            <div className="text-center">
              <a
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Voltar para Login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
