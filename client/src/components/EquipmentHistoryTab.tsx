import { useState, useMemo } from 'react';
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2, Plus, CheckCircle2, Eye } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from 'sonner';

interface EquipmentHistoryTabProps {
  tecnicoId: string;
  tecnicoNome?: string;
}

const NOMES_EQUIPAMENTOS = ['Aruba', 'Unifi', 'Cambium', 'Mikrotik', 'Switch', 'Outro'];

export function EquipmentHistoryTab({ tecnicoId, tecnicoNome }: EquipmentHistoryTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
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

  const { data: equipamentos = [], isLoading, refetch } = trpc.equipamentos.historicoByTecnico.useQuery({
    tecnicoId,
  });

  const createMutation = trpc.equipamentos.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      toast.success('Equipamento adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar equipamento');
      console.error(error);
    }
  });

  const updateMutation = trpc.equipamentos.update.useMutation({
    onSuccess: () => {
      refetch();
      setViewMode('list');
      resetForm();
      toast.success('Equipamento atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar equipamento');
      console.error(error);
    }
  });

  const returnMutation = trpc.equipamentos.markAsReturned.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Equipamento marcado como devolvido!');
    },
    onError: (error) => {
      toast.error('Erro ao marcar como devolvido');
      console.error(error);
    }
  });

  const deleteMutation = trpc.equipamentos.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Equipamento deletado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao deletar equipamento');
      console.error(error);
    }
  });

  const resetForm = () => {
    setFormData({
      equipamentoNome: '',
      equipamentoModelo: '',
      equipamentoIdEstoque: '',
      observacoes: '',
      dataSaida: '',
      dataDevolucao: '',
      status: 'emprestado',
    });
    setSelectedEquipment(null);
    setShowForm(false);
  };

  const handleAddEquipment = () => {
    setViewMode('edit');
    setSelectedEquipment(null);
    setFormData({
      equipamentoNome: '',
      equipamentoModelo: '',
      equipamentoIdEstoque: '',
      observacoes: '',
      dataSaida: new Date().toISOString().split('T')[0],
      dataDevolucao: '',
      status: 'emprestado',
    });
    setShowForm(true);
  };

  const handleViewEquipment = (equipamento: any) => {
    setSelectedEquipment(equipamento);
    setFormData({
      equipamentoNome: equipamento.equipamento_nome || '',
      equipamentoModelo: equipamento.equipamento_modelo || '',
      equipamentoIdEstoque: equipamento.equipamento_id_estoque || '',
      observacoes: equipamento.observacoes || '',
      dataSaida: equipamento.data_saida ? new Date(equipamento.data_saida).toISOString().slice(0, 16) : '',
      dataDevolucao: equipamento.data_devolucao ? new Date(equipamento.data_devolucao).toISOString().slice(0, 16) : '',
      status: equipamento.status || 'emprestado',
    });
    setViewMode('view');
    setShowForm(true);
  };

  const handleEditEquipment = (equipamento: any) => {
    setSelectedEquipment(equipamento);
    setFormData({
      equipamentoNome: equipamento.equipamento_nome || '',
      equipamentoModelo: equipamento.equipamento_modelo || '',
      equipamentoIdEstoque: equipamento.equipamento_id_estoque || '',
      observacoes: equipamento.observacoes || '',
      dataSaida: equipamento.data_saida ? new Date(equipamento.data_saida).toISOString().slice(0, 16) : '',
      dataDevolucao: equipamento.data_devolucao ? new Date(equipamento.data_devolucao).toISOString().slice(0, 16) : '',
      status: equipamento.status || 'emprestado',
    });
    setViewMode('edit');
    setShowForm(true);
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

    if (selectedEquipment) {
      // Update existing
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
    } else {
      // Create new
      await createMutation.mutateAsync({
        tecnicoId,
        equipamentoNome: formData.equipamentoNome,
        equipamentoModelo: formData.equipamentoModelo,
        equipamentoIdEstoque: formData.equipamentoIdEstoque,
        observacoes: formData.observacoes,
      });
    }
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

  const emprestados = useMemo(() => {
    return equipamentos.filter((e: any) => e.status === 'emprestado');
  }, [equipamentos]);

  const usedInClient = useMemo(() => {
    return equipamentos.filter((e: any) => e.status === 'usado_em_cliente');
  }, [equipamentos]);

  const devolvidos = useMemo(() => {
    return equipamentos.filter((e: any) => e.status === 'devolvido');
  }, [equipamentos]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Equipamentos</h3>
        <Button
          onClick={handleAddEquipment}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Equipamento
        </Button>
      </div>

      {/* Modal de Edição/Visualização */}
      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowForm(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'view' ? 'Visualizar Equipamento' : selectedEquipment ? 'Editar Equipamento' : 'Adicionar Equipamento'}
            </DialogTitle>
            <DialogDescription>
              {viewMode === 'view' ? 'Visualize os detalhes do equipamento' : selectedEquipment ? 'Edite as informações do equipamento' : 'Adicione um novo equipamento ao técnico'}
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
                onValueChange={(value) => setFormData({...formData, equipamentoNome: value})}
                disabled={viewMode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
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
              <label className="block text-sm font-medium mb-1">
                Modelo *
              </label>
              <Input
                value={formData.equipamentoModelo}
                onChange={(e) => setFormData({...formData, equipamentoModelo: e.target.value})}
                placeholder="Ex: AP-303, RB450Gx4"
                disabled={viewMode === 'view'}
              />
            </div>

            {/* ID Estoque */}
            <div>
              <label className="block text-sm font-medium mb-1">
                ID Estoque
              </label>
              <Input
                value={formData.equipamentoIdEstoque}
                onChange={(e) => setFormData({...formData, equipamentoIdEstoque: e.target.value})}
                placeholder="Ex: 0001"
                disabled={viewMode === 'view'}
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Observações
              </label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Notas adicionais"
                rows={3}
                disabled={viewMode === 'view'}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Status
              </label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
                disabled={viewMode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emprestado">Emprestado</SelectItem>
                  <SelectItem value="usado_em_cliente">Usado em Cliente</SelectItem>
                  <SelectItem value="devolvido">Devolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data de Saída */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Data de Saída
              </label>
              <Input
                type="datetime-local"
                value={formData.dataSaida}
                onChange={(e) => setFormData({...formData, dataSaida: e.target.value})}
                disabled={viewMode === 'view'}
              />
            </div>

            {/* Data de Devolução */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Data de Devolução
              </label>
              <Input
                type="datetime-local"
                value={formData.dataDevolucao}
                onChange={(e) => setFormData({...formData, dataDevolucao: e.target.value})}
                disabled={viewMode === 'view'}
              />
            </div>


          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            {viewMode === 'view' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleEditEquipment(selectedEquipment)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                {selectedEquipment?.status === 'emprestado' && (
                  <Button
                    onClick={() => {
                      handleReturnEquipment(selectedEquipment.id);
                      resetForm();
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Marcar como Devolvido
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={handleSaveEquipment}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipamentos Emprestados */}
      {emprestados.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-orange-600">
            Emprestados ({emprestados.length})
          </h4>
          <div className="space-y-2">
            {emprestados.map((equipamento: any) => (
              <Card key={equipamento.id} className="p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{equipamento.equipamento_nome}</div>
                    <div className="text-xs text-gray-600 space-y-1 mt-1">
                      <div>Modelo: {equipamento.equipamento_modelo}</div>
                      {equipamento.equipamento_id_estoque && <div>ID: {equipamento.equipamento_id_estoque}</div>}
                      <div>Saída: {format(new Date(equipamento.data_saida), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                      {equipamento.observacoes && <div className="mt-1 italic text-gray-700">{equipamento.observacoes}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewEquipment(equipamento)}
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditEquipment(equipamento)}
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReturnEquipment(equipamento.id)}
                      className="text-green-600 hover:text-green-700"
                      title="Marcar como devolvido"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEquipment(equipamento.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Equipamentos Usado em Cliente */}
      {usedInClient.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-blue-600">
            Usado em Cliente ({usedInClient.length})
          </h4>
          <div className="space-y-2">
            {usedInClient.map((equipamento: any) => (
              <Card key={equipamento.id} className="p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{equipamento.equipamento_nome}</div>
                    <div className="text-xs text-gray-600 space-y-1 mt-1">
                      <div>Modelo: {equipamento.equipamento_modelo}</div>
                      {equipamento.equipamento_id_estoque && <div>ID: {equipamento.equipamento_id_estoque}</div>}
                      <div>Saída: {format(new Date(equipamento.data_saida), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                      {equipamento.observacoes && <div className="mt-1 italic text-gray-700">{equipamento.observacoes}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewEquipment(equipamento)}
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditEquipment(equipamento)}
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEquipment(equipamento.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Equipamentos Devolvidos */}
      {devolvidos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-green-600">
            Devolvidos ({devolvidos.length})
          </h4>
          <div className="space-y-2">
            {devolvidos.map((equipamento: any) => (
              <Card key={equipamento.id} className="p-3 opacity-75">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm line-through">{equipamento.equipamento_nome}</div>
                    <div className="text-xs text-gray-600 space-y-1 mt-1">
                      <div>Modelo: {equipamento.equipamento_modelo}</div>
                      {equipamento.equipamento_id_estoque && <div>ID: {equipamento.equipamento_id_estoque}</div>}
                      <div>Saída: {format(new Date(equipamento.data_saida), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                      {equipamento.data_devolucao && <div>Devolução: {format(new Date(equipamento.data_devolucao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>}
                      {equipamento.observacoes && <div className="mt-1 italic text-gray-700">{equipamento.observacoes}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewEquipment(equipamento)}
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEquipment(equipamento.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {equipamentos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum equipamento registrado</p>
        </div>
      )}
    </div>
  );
}
