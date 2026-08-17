import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Edit2, Plus, Search, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Usuario {
  id: number;
  uid: string;
  email: string;
  name: any;
  role: any;
  login_method: string;
  created_at: string;
  updated_at: string | undefined;
  last_sign_in_at?: string | null;
}

export default function Usuarios() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    email: string;
    name: string;
    role: 'adminmaster' | 'admin' | 'analista';
    password: string;
  }>({
    email: '',
    name: '',
    role: 'analista',
    password: ''
  });

  // tRPC queries and mutations
  const { data: usuarios = [], isLoading, refetch } = trpc.usuarios.list.useQuery(undefined, {
    enabled: !!user && (user.role === 'adminmaster' || user.role === 'admin'),
  });

  const createMutation = trpc.usuarios.create.useMutation({
    onSuccess: () => {
      toast.success('Usuário criado com sucesso');
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  const updateMutation = trpc.usuarios.update.useMutation({
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso');
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar usuário');
    },
  });

  const deleteMutation = trpc.usuarios.delete.useMutation({
    onSuccess: () => {
      toast.success('Usuário deletado com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao deletar usuário');
    },
  });

  const resetForm = () => {
    setFormData({ email: '', name: '', role: 'analista', password: '' });
    setEditingId(null);
  };

  // Check if current user can perform actions on target user
  const canEditUser = (targetRole: string) => {
    if (user?.role === 'adminmaster') return true;
    if (user?.role === 'admin' && (targetRole === 'admin' || targetRole === 'analista')) return true;
    return false;
  };

  const canDeleteUser = (targetRole: string) => {
    if (user?.role === 'adminmaster') return true;
    if (user?.role === 'admin' && (targetRole === 'admin' || targetRole === 'analista')) return true;
    return false;
  };

  // Filter users
  const usuariosFiltrados = usuarios.filter((u: Usuario) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSalvar = async () => {
    if (!user) return;

    if (!formData.email || !formData.name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        password: formData.password || undefined,
      });
    } else {
      if (!formData.password || formData.password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      createMutation.mutate({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        password: formData.password,
      });
    }
  };

  const handleDeletar = async (id: number, role: string) => {
    if (!canDeleteUser(role)) {
      toast.error('Você não tem permissão para deletar este usuário');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    deleteMutation.mutate({ id });
  };

  const handleEditar = (usuario: Usuario) => {
    if (!canEditUser(usuario.role)) {
      toast.error('Você não tem permissão para editar este usuário');
      return;
    }

    setFormData({
      email: usuario.email,
      name: usuario.name || '',
      role: usuario.role,
      password: ''
    });
    setEditingId(usuario.id);
    setShowModal(true);
  };

  const handleNovoUsuario = () => {
    resetForm();
    setShowModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'adminmaster':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'analista':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'adminmaster':
        return 'Admin Master';
      case 'admin':
        return 'Admin';
      case 'analista':
        return 'Analista';
      default:
        return role;
    }
  };

  // Get available roles for dropdown based on current user's role
  const getAvailableRoles = () => {
    if (user?.role === 'adminmaster') {
      return [
        { value: 'analista', label: 'Analista' },
        { value: 'admin', label: 'Admin' },
        { value: 'adminmaster', label: 'Admin Master' },
      ];
    }
    if (user?.role === 'admin') {
      return [
        { value: 'analista', label: 'Analista' },
        { value: 'admin', label: 'Admin' },
      ];
    }
    return [];
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  // Permission check - only adminmaster and admin can access
  if (!user || (user.role !== 'adminmaster' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center max-w-md">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          <p className="text-sm text-gray-500 mt-2">
            Apenas administradores podem gerenciar usuários.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user.role === 'adminmaster' 
                ? 'Você tem acesso completo para gerenciar todos os usuários'
                : 'Você pode gerenciar apenas usuários analistas'}
            </p>
          </div>
          <Button onClick={handleNovoUsuario} className="gap-2">
            <Plus size={20} />
            Novo Usuário
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Carregando usuários...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            Nenhum usuário encontrado
          </Card>
        ) : (
          <div className="space-y-4">
            {usuariosFiltrados.map((usuario: Usuario) => (
              <Card key={usuario.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{usuario.name || 'Sem nome'}</h3>
                    <p className="text-muted-foreground">{usuario.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={getRoleBadgeColor(usuario.role)}>
                        {getRoleLabel(usuario.role)}
                      </Badge>
                      
                      <Badge variant="outline" className="text-gray-600 border-gray-300">
                        Criado em: {usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('pt-BR') : '-'}
                      </Badge>

                      <Badge 
                        variant="secondary" 
                        className={
                          usuario.last_sign_in_at 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {usuario.last_sign_in_at 
                          ? `Último acesso: ${new Date(usuario.last_sign_in_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}`
                          : 'Nunca acessou'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {canEditUser(usuario.role) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditar(usuario)}
                      >
                        <Edit2 size={16} />
                      </Button>
                    )}
                    {canDeleteUser(usuario.role) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletar(usuario.id, usuario.role)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Atualize as informações do usuário'
                  : 'Preencha os dados para criar um novo usuário'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Senha *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              {editingId && user?.role === 'adminmaster' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Nova Senha (opcional)</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres se preenchido</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Perfil *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {getAvailableRoles().map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {user.role === 'admin' && (
                <p className="text-xs text-gray-500 mt-1">
                  Como admin, você só pode criar usuários analistas
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvar} 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}