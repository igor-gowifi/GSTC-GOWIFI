import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Loader2, Search, CheckCircle2, Clock, Eye, Edit2, Trash2, Package, Phone, Building2, Star, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

const NOMES_EQUIPAMENTOS = ['Aruba', 'Unifi', 'Cambium', 'Mikrotik', 'Switch', 'Outro'];

export default function HistoricoEquipamentos() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'emprestado' | 'devolvido' | 'usado_em_cliente'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [formData, setFormData] = useState({
    equipamentoNome: '',
    equipamentoModelo: '',
    equipamentoIdEstoque: '',
    observacoes: '',
    dataSaida: '',
    dataDevolucao: '',
    status: 'emprestado',
  });
  const [addFormData, setAddFormData] = useState({
    tecnicoId: '',
    equipamentoNome: '',
    equipamentoModelo: '',
    equipamentoIdEstoque: '',
    status: 'emprestado',
    observacoes: '',
    dataSaida: '',
    dataDevolucao: '',
  });
  const [tecnicoSearchTerm, setTecnicoSearchTerm] = useState('');
  const [showTecnicoDropdown, setShowTecnicoDropdown] = useState(false);

  // Fetch equipment history
  const { data: equipamentosHistorico = [], isLoading, refetch } = trpc.equipamentos.historico.useQuery();
  const { data: tecnicos = [] } = trpc.tecnicos.list.useQuery();

  // Filtrar técnicos conforme o usuário digita
  const filteredTecnicos = useMemo(() => {
    if (!tecnicoSearchTerm.trim()) return tecnicos;
    return (tecnicos as any[]).filter(tec =>
      tec.tec_nome.toLowerCase().includes(tecnicoSearchTerm.toLowerCase()) ||
      tec.tec_telefone?.includes(tecnicoSearchTerm) ||
      tec.tec_cpf?.includes(tecnicoSearchTerm)
    );
  }, [tecnicoSearchTerm, tecnicos]);

  const createMutation = trpc.equipamentos.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddModal(false);
      setAddFormData({
        tecnicoId: '',
        equipamentoNome: '',
        equipamentoModelo: '',
        equipamentoIdEstoque: '',
        status: 'emprestado',
        observacoes: '',
        dataSaida: '',
        dataDevolucao: '',
      });
      toast.success('Equipamento adicionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar equipamento');
    }
  });

  const updateMutation = trpc.equipamentos.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      toast.success('Equipamento atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar equipamento');
    }
  });

  const deleteMutation = trpc.equipamentos.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Equipamento deletado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao deletar equipamento');
    }
  });

  const returnMutation = trpc.equipamentos.markAsReturned.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Equipamento marcado como devolvido!');
    },
    onError: () => {
      toast.error('Erro ao marcar como devolvido');
    }
  });

  // Filter equipment - sem agrupamento, apenas filtro direto
  const filteredEquipamentos = useMemo(() => {
    if (!equipamentosHistorico || !Array.isArray(equipamentosHistorico)) return [];

    return (equipamentosHistorico as any[]).filter((eq: any) => {
      const matchSearch = !searchTerm ||
        (eq.equipamento_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (eq.tecnicos?.tec_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (eq.equipamento_modelo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (eq.equipamento_id_estoque?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = filterStatus === 'todos' || eq.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [equipamentosHistorico, searchTerm, filterStatus]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'emprestado': 'bg-yellow-100 text-yellow-900 border-yellow-200 dark:!text-gray-900',
      'devolvido': 'bg-green-100 text-green-900 border-green-200 dark:!text-gray-900',
      'usado_em_cliente': 'bg-blue-100 text-blue-900 border-blue-200 dark:!text-gray-900',
    };
    return colors[status] || 'bg-gray-100 text-gray-900 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'devolvido') return <CheckCircle2 className="w-3 h-3" />;
    if (status === 'usado_em_cliente') return <Package className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM HH:mm", { locale: ptBR });
  };

  const emprestadosCount = useMemo(() => {
    return (equipamentosHistorico as any[]).filter((eq: any) => eq.status === 'emprestado').length;
  }, [equipamentosHistorico]);

  const devolvidosCount = useMemo(() => {
    return (equipamentosHistorico as any[]).filter((eq: any) => eq.status === 'devolvido').length;
  }, [equipamentosHistorico]);

  const usedEmClienteCount = useMemo(() => {
    return (equipamentosHistorico as any[]).filter((eq: any) => eq.status === 'usado_em_cliente').length;
  }, [equipamentosHistorico]);

  const handleViewEquipment = (equipamento: any) => {
    // Redirecionar para página de detalhes em vez de abrir modal
    setLocation(`/historico-equipamentos/${equipamento.id}`);
  };

  const handleEditEquipment = (equipamento: any) => {
    // Redirecionar para página de detalhes em vez de abrir modal
    setLocation(`/historico-equipamentos/${equipamento.id}`);
  };

  const handleSaveEquipment = async () => {
    if (!formData.equipamentoNome.trim()) {
      toast.error('Nome do equipamento é obrigatório');
      return;
    }
    if (!formData.equipamentoModelo.trim()) {
      toast.error('Modelo é obrigatório');
      return;
    }

    await updateMutation.mutateAsync({
      id: selectedEquipment.id,
      equipamentoNome: formData.equipamentoNome,
      equipamentoModelo: formData.equipamentoModelo,
      equipamentoIdEstoque: formData.equipamentoIdEstoque,
      observacoes: formData.observacoes,
      dataSaida: formData.dataSaida ? new Date(formData.dataSaida).toISOString() : undefined,
      dataDevolucao: formData.dataDevolucao ? new Date(formData.dataDevolucao).toISOString() : undefined,
      status: formData.status,
    });
  };

  const handleDeleteEquipment = async (equipamentoId: string) => {
    if (confirm('Tem certeza que deseja deletar este equipamento?')) {
      await deleteMutation.mutateAsync({ id: equipamentoId });
    }
  };

  const handleReturnEquipment = async (equipamentoId: string) => {
    await returnMutation.mutateAsync({
      id: equipamentoId,
      dataDevolucao: new Date().toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Carregando histórico de equipamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">Histórico de Equipamentos</h1>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Total: <span className="font-semibold">{equipamentosHistorico.length}</span> • 
            <span className="text-yellow-600 font-semibold ml-1">{emprestadosCount} emprestado(s)</span> • 
            <span className="text-green-600 font-semibold ml-1">{devolvidosCount} devolvido(s)</span> • 
            <span className="text-blue-600 font-semibold ml-1">{usedEmClienteCount} usado em cliente(s)</span>
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-3 bg-white border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                <Input
                  placeholder="Nome, modelo, técnico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="emprestado">Emprestado</SelectItem>
                  <SelectItem value="devolvido">Devolvido</SelectItem>
                  <SelectItem value="usado_em_cliente">Usado em Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Equipment Cards Grid */}
        {filteredEquipamentos.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50 border-gray-200">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm font-medium">Nenhum equipamento encontrado</p>
            <p className="text-gray-500 text-xs mt-1">Ajuste os filtros e tente novamente</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredEquipamentos.map((equipamento: any) => (
              <Card key={equipamento.id} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
              {/* Header com Status */}
              <div className={`p-2 border-b ${getStatusColor(equipamento.status)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      {getStatusIcon(equipamento.status)}
                      <h3 className="font-semibold text-sm truncate text-gray-900 dark:!text-gray-900">{equipamento.equipamento_nome}</h3>
                    </div>
                    <p className="text-xs truncate text-gray-800 dark:!text-gray-900">{equipamento.equipamento_modelo}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${getStatusColor(equipamento.status)} border !text-gray-900 dark:!text-gray-900`}>
                    {equipamento.status === 'emprestado' ? 'Emprestado' : equipamento.status === 'devolvido' ? 'Devolvido' : 'Usado em Cliente'}
                  </Badge>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-2 space-y-2">
                {/* Informações do Equipamento */}
                <div className="text-xs space-y-1.5">
                  <div>
                    <span className="text-muted-foreground">Nome do equipamento:</span>
                    <p className="font-medium text-foreground">{equipamento.equipamento_nome || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modelo:</span>
                    <p className="font-medium text-foreground">{equipamento.equipamento_modelo || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID:</span>
                    <p className="font-medium text-foreground">{equipamento.equipamento_id_estoque || '-'}</p>
                  </div>
                </div>

                {/* Informações do Técnico */}
                {equipamento.tecnicos && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-2 rounded border border-blue-100 dark:border-blue-700 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium truncate text-foreground dark:text-blue-100">{equipamento.tecnicos.tec_nome}</span>
                      {equipamento.tecnicos.tec_avaliacao && (
                        <div className="flex items-center gap-0.5 text-yellow-500 flex-shrink-0">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span className="text-xs font-semibold">{equipamento.tecnicos.tec_avaliacao.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground dark:text-blue-200">
                      <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{equipamento.tecnicos.tec_telefone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground dark:text-blue-200">
                      <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{equipamento.tecnicos.tec_empresa_parceira || '-'}</span>
                    </div>
                    <p className="text-muted-foreground dark:text-blue-200">CPF: {equipamento.tecnicos.tec_cpf || '-'}</p>
                  </div>
                )}

                {/* Histórico de Movimentação */}
                <div className="text-xs space-y-1 bg-muted dark:bg-slate-700 p-2 rounded">
                  <div className="flex items-start gap-1">
                    <Calendar className="w-2.5 h-2.5 text-muted-foreground dark:text-slate-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground dark:text-slate-300">Saída</p>
                      <p className="font-medium text-foreground dark:text-slate-100">{formatDate(equipamento.data_saida)}</p>
                    </div>
                  </div>
                  {equipamento.data_devolucao && (
                    <div className="flex items-start gap-1">
                      <Calendar className="w-2.5 h-2.5 text-muted-foreground dark:text-slate-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-muted-foreground dark:text-slate-300">Devolução</p>
                        <p className="font-medium text-foreground dark:text-slate-100">{formatDate(equipamento.data_devolucao)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações */}
                {equipamento.observacoes && (
                  <div className="text-xs">
                    <p className="text-muted-foreground mb-0.5">Obs:</p>
                    <p className="text-foreground bg-muted p-1.5 rounded border border-border line-clamp-2">
                      {equipamento.observacoes}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer com Ações */}
              <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewEquipment(equipamento)}
                  className="w-full h-8 text-xs"
                >
                  <Eye className="w-3 h-3 mr-0.5" />
                  Ver
                </Button>
              </div>
            </Card>
            ))}
          </div>
        )}

        {/* Modal de Edição/Visualização */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
            <DialogTitle>
              {viewMode === 'view' ? 'Visualizar Equipamento' : 'Editar Equipamento'}
            </DialogTitle>
            <DialogDescription>
              {viewMode === 'view' ? 'Visualize os detalhes do equipamento' : 'Edite as informações do equipamento'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome do Equipamento (Dropdown) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Nome do Equipamento *
              </label>
              <Select 
                value={formData.equipamentoNome} 
                onValueChange={(value) => setFormData({ ...formData, equipamentoNome: value })}
                disabled={viewMode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOMES_EQUIPAMENTOS.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-sm font-medium mb-1">Modelo *</label>
              <Input
                value={formData.equipamentoModelo}
                onChange={(e) => setFormData({ ...formData, equipamentoModelo: e.target.value })}
                disabled={viewMode === 'view'}
                placeholder="Ex: AP-365"
              />
            </div>

            {/* ID Estoque */}
            <div>
              <label className="block text-sm font-medium mb-1">ID Estoque</label>
              <Input
                value={formData.equipamentoIdEstoque}
                onChange={(e) => setFormData({ ...formData, equipamentoIdEstoque: e.target.value })}
                disabled={viewMode === 'view'}
                placeholder="Ex: EST-001"
              />
            </div>

            {/* Data Saída */}
            <div>
              <label className="block text-sm font-medium mb-1">Data Saída</label>
              <Input
                type="datetime-local"
                value={formData.dataSaida}
                onChange={(e) => setFormData({ ...formData, dataSaida: e.target.value })}
                disabled={viewMode === 'view'}
              />
            </div>

            {/* Data Devolução */}
            <div>
              <label className="block text-sm font-medium mb-1">Data Devolução</label>
              <Input
                type="datetime-local"
                value={formData.dataDevolucao}
                onChange={(e) => setFormData({ ...formData, dataDevolucao: e.target.value })}
                disabled={viewMode === 'view'}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={viewMode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emprestado">Emprestado</SelectItem>
                  <SelectItem value="devolvido">Devolvido</SelectItem>
                  <SelectItem value="usado_em_cliente">Usado em Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                disabled={viewMode === 'view'}
                placeholder="Adicione observações..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            {viewMode === 'edit' && (
              <>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEquipment} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
            {viewMode === 'view' && (
              <Button onClick={() => setShowModal(false)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Adição de Equipamento */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Equipamento</DialogTitle>
              <DialogDescription>
                Adicione um novo equipamento ao histórico
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Técnico */}
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Técnico *</label>
                <Input
                  placeholder="Digite para buscar técnico..."
                  value={tecnicoSearchTerm}
                  onChange={(e) => {
                    setTecnicoSearchTerm(e.target.value);
                    setShowTecnicoDropdown(true);
                  }}
                  onFocus={() => setShowTecnicoDropdown(true)}
                  className="w-full"
                />
                {showTecnicoDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredTecnicos.length > 0 ? (
                      (filteredTecnicos as any[]).map((tec: any) => (
                        <div
                          key={tec.id}
                          onClick={() => {
                            setAddFormData({ ...addFormData, tecnicoId: tec.id });
                            setTecnicoSearchTerm(tec.tec_nome);
                            setShowTecnicoDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          <div className="font-medium">{tec.tec_nome}</div>
                          <div className="text-xs text-gray-500">{tec.tec_telefone} - {tec.tec_empresa_parceira}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">Nenhum técnico encontrado</div>
                    )}
                  </div>
                )}
              </div>

              {/* Nome do Equipamento */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Equipamento *</label>
                <Select 
                  value={addFormData.equipamentoNome} 
                  onValueChange={(value) => setAddFormData({ ...addFormData, equipamentoNome: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOMES_EQUIPAMENTOS.map((nome) => (
                      <SelectItem key={nome} value={nome}>
                        {nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-sm font-medium mb-1">Modelo *</label>
                <Input
                  value={addFormData.equipamentoModelo}
                  onChange={(e) => setAddFormData({ ...addFormData, equipamentoModelo: e.target.value })}
                  placeholder="Ex: AP-365"
                />
              </div>

              {/* ID Estoque */}
              <div>
                <label className="block text-sm font-medium mb-1">ID Estoque</label>
                <Input
                  value={addFormData.equipamentoIdEstoque}
                  onChange={(e) => setAddFormData({ ...addFormData, equipamentoIdEstoque: e.target.value })}
                  placeholder="Ex: EST-001"
                />
              </div>

              {/* Data Saída */}
              <div>
                <label className="block text-sm font-medium mb-1">Data Saída</label>
                <Input
                  type="datetime-local"
                  value={addFormData.dataSaida}
                  onChange={(e) => setAddFormData({ ...addFormData, dataSaida: e.target.value })}
                />
              </div>

              {/* Data Devolução */}
              <div>
                <label className="block text-sm font-medium mb-1">Data Devolução</label>
                <Input
                  type="datetime-local"
                  value={addFormData.dataDevolucao}
                  onChange={(e) => setAddFormData({ ...addFormData, dataDevolucao: e.target.value })}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select 
                  value={addFormData.status} 
                  onValueChange={(value) => setAddFormData({ ...addFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emprestado">Emprestado</SelectItem>
                    <SelectItem value="devolvido">Devolvido</SelectItem>
                    <SelectItem value="usado_em_cliente">Usado em Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <Textarea
                  value={addFormData.observacoes}
                  onChange={(e) => setAddFormData({ ...addFormData, observacoes: e.target.value })}
                  placeholder="Adicione observações..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!addFormData.tecnicoId || !addFormData.equipamentoNome || !addFormData.equipamentoModelo) {
                    toast.error('Preencha os campos obrigatórios');
                    return;
                  }
                  createMutation.mutate({
                    tecnicoId: addFormData.tecnicoId,
                    equipamentoNome: addFormData.equipamentoNome,
                    dataSaida: addFormData.dataSaida ? new Date(addFormData.dataSaida).getTime() : Date.now(),
                    dataDevolucao: addFormData.dataDevolucao ? new Date(addFormData.dataDevolucao).getTime() : undefined,
                    equipamentoModelo: addFormData.equipamentoModelo,
                    equipamentoIdEstoque: addFormData.equipamentoIdEstoque,
                    status: addFormData.status as any,
                    observacoes: addFormData.observacoes,
                  });
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
