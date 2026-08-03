import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Perfil() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const [passwordValidated, setPasswordValidated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch user profile
  const { data: profile, isLoading, refetch } = trpc.profile.getProfile.useQuery();
  
  // Update profile mutation
  const updateMutation = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      setIsEditMode(false);
      setPasswordValidated(false);
      setFormData(prev => ({ 
        ...prev, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      }));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar perfil');
    }
  });

  // Validate current password mutation
  const validatePasswordMutation = trpc.profile.validatePassword.useMutation({
    onSuccess: () => {
      toast.success('Senha atual validada!');
      setPasswordValidated(true);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Senha atual incorreta');
      setPasswordValidated(false);
    }
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
      }));
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleValidatePassword = async () => {
    if (!formData.currentPassword.trim()) {
      toast.error('Digite sua senha atual');
      return;
    }

    setIsValidatingPassword(true);
    try {
      await validatePasswordMutation.mutateAsync({
        currentPassword: formData.currentPassword,
      });
    } finally {
      setIsValidatingPassword(false);
    }
  };

  const handleSave = async () => {
    // Validations
    if (!formData.name.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    // If trying to change password, validate it first
    if (formData.newPassword) {
      if (!passwordValidated) {
        toast.error('Valide sua senha atual primeiro');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }

      if (formData.newPassword.length < 6) {
        toast.error('A senha deve ter no mínimo 6 caracteres');
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        name: formData.name,
        password: formData.newPassword || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setPasswordValidated(false);
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meu Perfil</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        {/* Profile Card */}
        <Card className="max-w-2xl bg-white border-gray-200">
          <div className="p-6 space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nome Completo
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditMode}
                placeholder="Seu nome completo"
                className="text-sm"
              />
              {!isEditMode && formData.name && (
                <p className="text-xs text-gray-500">Clique em Editar para alterar</p>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled={true}
                  placeholder="seu@email.com"
                  className="pl-10 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500">
                O email não pode ser alterado. Contate um administrador se precisar mudar.
              </p>
            </div>

            {/* Password Validation Section (only in edit mode) */}
            {isEditMode && !passwordValidated && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-4">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Validação de Segurança
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                      Para alterar sua senha, primeiro valide sua senha atual
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha Atual
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Digite sua senha atual"
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>

                  <Button
                    onClick={handleValidatePassword}
                    disabled={isValidatingPassword || !formData.currentPassword}
                    className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white"
                  >
                  {isValidatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Validando...
                    </>
                  ) : (
                    'Validar Senha'
                  )}
                </Button>
              </div>
            )}

            {/* Password Fields (only after validation) */}
            {isEditMode && passwordValidated && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-4">
                <div className="flex gap-2 items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Senha Validada
                    </p>
                    <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                      Agora você pode alterar sua senha
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nova Senha (opcional)
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Digite sua nova senha"
                      className="pl-10 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirme a nova senha"
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setPasswordValidated(false);
                    setFormData(prev => ({
                      ...prev,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    }));
                  }}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar Alteração de Senha
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {!isEditMode ? (
                <Button
                  onClick={() => setIsEditMode(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900 dark:border-blue-700">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Informações de Segurança</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Seu email não pode ser alterado por você</li>
                    <li>Apenas administradores podem mudar seu email</li>
                    <li>Para alterar senha, você deve validar sua senha atual</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
