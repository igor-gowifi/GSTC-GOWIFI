import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { useEffect, useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Save, X, Trash2, Edit3 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'emprestado', label: 'Emprestado' },
  { value: 'devolvido', label: 'Devolvido' },
  { value: 'usado_em_cliente', label: 'Usado em Cliente' }
];

export default function DetalheEquipamento() {
  const pathId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null;
  const [, setLocation] = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [tecnicoSearchTerm, setTecnicoSearchTerm] = useState('');
  const [showTecnicoDropdown, setShowTecnicoDropdown] = useState(false);
  
  const { data: equipamentos = [] } = trpc.equipamentos.historico.useQuery();
  const { data: tecnicos = [] } = trpc.tecnicos.list.useQuery();
  const updateMutation = trpc.equipamentos.update.useMutation();
  const deleteMutation = trpc.equipamentos.delete.useMutation();

  const equipamento = useMemo(() => {
    if (!pathId) return null;
    return equipamentos.find((e: any) => String(e.id) === String(pathId));
  }, [equipamentos, pathId]);

  useEffect(() => {
    if (equipamento) {
      const tecnicoNome = getTecnicoNome(equipamento.tecnico_id) || '';
      setFormData({
        id: equipamento.id,
        equipamentoNome: equipamento.equipamento_nome || '',
        equipamentoModelo: equipamento.equipamento_modelo || '',
        equipamentoIdEstoque: equipamento.equipamento_id_estoque || '',
        status: equipamento.status || 'devolvido',
        tecnicoId: equipamento.tecnico_id || '',
        observacoes: equipamento.observacoes || '',
        dataSaida: equipamento.data_saida ? new Date(equipamento.data_saida).toISOString().slice(0, 16) : '',
        dataDevolucao: equipamento.data_devolucao ? new Date(equipamento.data_devolucao).toISOString().slice(0, 16) : '',
      });
      setTecnicoSearchTerm(tecnicoNome);
      setIsViewMode(true);
    }
  }, [equipamento]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: formData.id,
        equipamentoNome: formData.equipamentoNome,
        equipamentoModelo: formData.equipamentoModelo,
        equipamentoIdEstoque: formData.equipamentoIdEstoque,
        status: formData.status,
        tecnicoId: formData.tecnicoId,
        observacoes: formData.observacoes,
        dataSaida: formData.dataSaida ? new Date(formData.dataSaida).toISOString() : undefined,
        dataDevolucao: formData.dataDevolucao ? new Date(formData.dataDevolucao).toISOString() : undefined,
      });
      toast.success('Equipamento atualizado com sucesso!');
      setIsEditMode(false);
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
      toast.error('Erro ao atualizar equipamento');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este equipamento?')) return;
    
    try {
      await deleteMutation.mutateAsync({ id: formData.id });
      toast.success('Equipamento deletado com sucesso!');
      setLocation('/historico-equipamentos');
    } catch (error) {
      console.error('Erro ao deletar equipamento:', error);
      toast.error('Erro ao deletar equipamento');
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setShowTecnicoDropdown(false);
    if (equipamento) {
      const tecnicoNome = getTecnicoNome(equipamento.tecnico_id) || '';
      setFormData({
        id: equipamento.id,
        equipamentoNome: equipamento.equipamento_nome || '',
        equipamentoModelo: equipamento.equipamento_modelo || '',
        equipamentoIdEstoque: equipamento.equipamento_id_estoque || '',
        status: equipamento.status || 'devolvido',
        tecnicoId: equipamento.tecnico_id || '',
        observacoes: equipamento.observacoes || '',
      });
      setTecnicoSearchTerm(tecnicoNome);
    }
  };

  const getTecnicoNome = (tecnicoId: string) => {
    const tecnico = tecnicos.find((t: any) => String(t.id) === String(tecnicoId));
    return tecnico ? tecnico.tec_nome : '-';
  };

  // Filtrar técnicos conforme o usuário digita
  const filteredTecnicos = useMemo(() => {
    if (!tecnicoSearchTerm.trim()) return tecnicos;
    return (tecnicos as any[]).filter(tec =>
      tec.tec_nome.toLowerCase().includes(tecnicoSearchTerm.toLowerCase()) ||
      tec.tec_telefone?.includes(tecnicoSearchTerm) ||
      tec.tec_cpf?.includes(tecnicoSearchTerm)
    );
  }, [tecnicoSearchTerm, tecnicos]);

  const refetch = () => {
    // Refetch data after mutation
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'emprestado':
        return 'bg-orange-100 text-orange-800';
      case 'devolvido':
        return 'bg-green-100 text-green-800';
      case 'usado_em_cliente':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!equipamento) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Equipamento não encontrado</p>
          <Button onClick={() => setLocation('/historico-equipamentos')}>Voltar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/historico-equipamentos')}>← Voltar</Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{formData.equipamentoNome || 'Equipamento'}</h1>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {!isEditMode && isViewMode && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}
            {isEditMode && (
              <>
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Salvar</span>
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
              </>
            )}
            <Button 
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Deletar</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Left Column - Informações do Equipamento */}
          <div className="space-y-4">
            <Card className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-blue-600">Informações do Equipamento</h2>
              
              {/* Nome do Equipamento */}
              <div className="mb-3 md:mb-4">
                <label className="text-xs md:text-sm font-semibold text-muted-foreground">Nome do Equipamento</label>
                {isEditMode ? (
                  <Input 
                    value={formData.equipamentoNome || ''} 
                    onChange={(e) => handleFieldChange('equipamentoNome', e.target.value)}
                    placeholder="Nome do equipamento"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formData.equipamentoNome || '-'}</p>
                )}
              </div>

              {/* Modelo */}
              <div className="mb-3 md:mb-4">
                <label className="text-xs md:text-sm font-semibold text-muted-foreground">Modelo</label>
                {isEditMode ? (
                  <Input 
                    value={formData.equipamentoModelo || ''} 
                    onChange={(e) => handleFieldChange('equipamentoModelo', e.target.value)}
                    placeholder="Modelo"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formData.equipamentoModelo || '-'}</p>
                )}
              </div>

              {/* ID Estoque */}
              <div className="mb-3 md:mb-4">
                <label className="text-xs md:text-sm font-semibold text-muted-foreground">ID Estoque</label>
                {isEditMode ? (
                  <Input 
                    value={formData.equipamentoIdEstoque || ''} 
                    onChange={(e) => handleFieldChange('equipamentoIdEstoque', e.target.value)}
                    placeholder="ID Estoque"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formData.equipamentoIdEstoque || '-'}</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Status e Técnico */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-600">Status e Responsável</h2>
              
              {/* Status */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Status</label>
                {isEditMode ? (
                  <Select value={formData.status || ''} onValueChange={(value) => handleFieldChange('status', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={getStatusBadgeColor(formData.status || 'devolvido')}>
                      {STATUS_OPTIONS.find(o => o.value === formData.status)?.label || '-'}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Técnico Responsável */}
              <div className="mb-4 relative">
                <label className="text-sm font-semibold text-muted-foreground">Técnico Responsável</label>
                {isEditMode ? (
                  <>
                    <Input
                      placeholder="Digite para buscar técnico..."
                      value={tecnicoSearchTerm}
                      onChange={(e) => {
                        setTecnicoSearchTerm(e.target.value);
                        setShowTecnicoDropdown(true);
                      }}
                      onFocus={() => setShowTecnicoDropdown(true)}
                      className="w-full mt-1"
                    />
                    {showTecnicoDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredTecnicos.length > 0 ? (
                          (filteredTecnicos as any[]).map((tec: any) => (
                            <div
                              key={tec.id}
                              onClick={() => {
                                setFormData({ ...formData, tecnicoId: tec.id });
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
                  </>
                ) : (
                  <p className="text-foreground mt-1">{getTecnicoNome(formData.tecnicoId) || '-'}</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Datas */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-600">Datas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data de Saída */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Data de Saída</label>
              {isEditMode ? (
                <Input 
                  type="datetime-local" 
                  value={formData.dataSaida || ''} 
                  onChange={(e) => handleFieldChange('dataSaida', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-foreground mt-1">{formData.dataSaida ? new Date(formData.dataSaida).toLocaleString('pt-BR') : '-'}</p>
              )}
            </div>

            {/* Data de Devolução */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Data de Devolução</label>
              {isEditMode ? (
                <Input 
                  type="datetime-local" 
                  value={formData.dataDevolucao || ''} 
                  onChange={(e) => handleFieldChange('dataDevolucao', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-foreground mt-1">{formData.dataDevolucao ? new Date(formData.dataDevolucao).toLocaleString('pt-BR') : '-'}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Observações */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-600">Observações</h2>
          {isEditMode ? (
            <Textarea 
              value={formData.observacoes || ''} 
              onChange={(e) => handleFieldChange('observacoes', e.target.value)}
              placeholder="Observações"
              className="min-h-32"
            />
          ) : (
            <p className="text-foreground whitespace-pre-wrap">{formData.observacoes || '-'}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
