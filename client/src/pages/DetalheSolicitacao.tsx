import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { formatDatePtBr, formatTimePtBr } from '@/lib/dateFormatter';
import { Save, X, Trash2, Edit3, Copy, Send } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { TechnicianSearchModal } from '@/components/TechnicianSearchModal';
import { buscarEnderecoPorCEP, converterEnderecoViaCEP } from '@/utils/cepLookup';
import { aplicarMascaraCEP } from '@/utils/masks';
import { useState, useMemo, useEffect } from 'react';

const GRUPOS_PROJETO = [
  'WiFi Seguro',
  'Projetos Especiais',
  'Bradesco',
  'Bradesco - Fase2',
  'Bradesco - Migração',
  'Santander',
  'PUC-SP',
  'Hotelaria',
  'Telemedicina',
  'Escola Santa Maria',
  'Viasat',
  'Daiki Sushi',
];

const SERVICOS = [
  'Desativação',
  'Instalação',
  'Suporte',
  'Troca de Endereço',
];

const OPERADORAS = [
  'Claro Empresas',
  'Hughes',
  'Gowifi',
  'ViaSat',
  'Outro',
];

const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export default function DetalheSolicitacao() {
  const { user } = useAuth();
  const pathId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null;
  const [, setLocation] = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showTecnicoModal, setShowTecnicoModal] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [modalCoords, setModalCoords] = useState({ latitude: 0, longitude: 0 });
  
  const { data: solicitacoesData = [] } = trpc.solicitacoes.list.useQuery();
  const { data: tecnicos = [] } = trpc.tecnicos.list.useQuery();
  const sendToFreshdesk = trpc.solicitacoes.sendToFreshdesk.useMutation();
  const deleteMutation = trpc.solicitacoes.delete.useMutation();
  const updateMutation = trpc.solicitacoes.update.useMutation();
  
  const { data: rawNearbyTecnicos = [], isLoading: isLoadingTecnicos } = 
  trpc.solicitacoes.findNearestTecnicos.useQuery(
    {
      latitude: Number(modalCoords.latitude),
      longitude: Number(modalCoords.longitude),
      limit: 10,
      sortBy: 'distance',
    },
    { 
      enabled: showTecnicoModal && Number(modalCoords.latitude) !== 0 && Number(modalCoords.longitude) !== 0 
    }
  );

  const nearbyTecnicos = useMemo(() => {
    if (!rawNearbyTecnicos || rawNearbyTecnicos.length === 0) return [];
    if (!modalCoords.latitude || !modalCoords.longitude) return rawNearbyTecnicos;

    return rawNearbyTecnicos
      .map((tecnico: any) => {
        const tecLat = Number(tecnico.tec_latitude || tecnico.latitude || 0);
        const tecLon = Number(tecnico.tec_longitude || tecnico.longitude || 0);

        const dist = (tecLat && tecLon)
          ? calcularDistancia(modalCoords.latitude, modalCoords.longitude, tecLat, tecLon)
          : null;

        return {
          ...tecnico,
          distancia: dist,
        };
      })
      .filter((t: any) => t.distancia !== null)
      .sort((a: any, b: any) => (a.distancia || 0) - (b.distancia || 0));
  }, [rawNearbyTecnicos, modalCoords]);

  const solicitacao = useMemo(() => {
    if (!pathId) return null;
    return solicitacoesData.find((s: any) => String(s.id) === String(pathId));
  }, [solicitacoesData, pathId]);

  const tecnicoAssociado = useMemo(() => {
    if (!formData.solic_tecnico_id) return null;
    return tecnicos.find((t: any) => String(t.id) === String(formData.solic_tecnico_id));
  }, [formData.solic_tecnico_id, tecnicos]);

  const textoLiberacao = useMemo(() => {
    return `Prezados,

Atividade agendada para dia ${formatDatePtBr(formData.solic_data_atividade)} às ${formatTimePtBr(formData.solic_hora_atividade)}

Segue os dados do técnico para a liberação

Nome: ${tecnicoAssociado?.tec_nome || 'N/A'}
CPF: ${tecnicoAssociado?.tec_cpf || 'N/A'}`;
  }, [formData.solic_data_atividade, formData.solic_hora_atividade, tecnicoAssociado]);

  const textoSolicitacao = useMemo(() => {
    return `Cliente: ${formData.solic_projeto || 'N/A'}
Localidade: ${formData.solic_nome || 'N/A'}
Serviço: ${formData.solic_servico || 'N/A'}
Operadora: ${formData.solic_operadora || 'N/A'}
Endereço: ${formData.solic_rua || 'N/A'} nº ${formData.solic_numero || 'N/A'}
BAIRRO: ${formData.solic_bairro || 'N/A'}
CIDADE: ${formData.solic_cidade || 'N/A'}
UF: ${formData.solic_uf || 'N/A'}
CEP: ${formData.solic_cep || 'N/A'}
DATA/HORA: ${formatDatePtBr(formData.solic_data_atividade)} às ${formatTimePtBr(formData.solic_hora_atividade)}
Ticket: ${formData.solic_freshdesk || 'N/A'}
OBS: Levar notebook, 4g, patch cords, ferramentas como furadeira, parafusadeira.
Procurar por: ${formData.solic_contato_local || 'N/A'}
Técnico: ${tecnicoAssociado?.tec_nome || 'N/A'}`;
  }, [formData, tecnicoAssociado]);

  const statusMapping: Record<string, string> = {
    'Pendente': 'Pendente',
    'pendente': 'Pendente',
    'Em Progresso': 'Agendado',
    'em_progresso': 'Agendado',
    'atribuidas': 'Agendado',
    'atribuido': 'Agendado',
    'agendado': 'Agendado',
    'Agendado': 'Agendado',
    'Concluido': 'Concluído',
    'concluido': 'Concluído',
    'Concluído': 'Concluído',
    'Cancelado': 'Improdutivo',
    'cancelado': 'Improdutivo',
    'improdutivas': 'Improdutivo',
    'improdutivo': 'Improdutivo',
    'Improdutivo': 'Improdutivo',
  };
  
  const faturamentoMapping: Record<string, string> = {
    'nao-pago': 'Não Pago',
    'Não Pago': 'Não Pago',
    'pago': 'Pago',
    'Pago': 'Pago',
  };

  useEffect(() => {
    if (solicitacao) {
      const mappedSolicitacao = {
        ...solicitacao,
        solic_status: statusMapping[solicitacao.solic_status] || solicitacao.solic_status,
        solic_faturamento: faturamentoMapping[solicitacao.solic_faturamento] || solicitacao.solic_faturamento,
      };
      setFormData(mappedSolicitacao);
    }
  }, [solicitacao]);

  const handleEditToggle = () => {
    if (isEditMode) {
      handleSave();
    } else {
      setIsEditMode(true);
    }
  };

  const handleSave = async () => {
    try {
      toast.loading('Salvando alterações...');
      const updatePayload: any = { id: pathId! };
      
      if (formData.solic_nome) updatePayload.nomeAtividade = formData.solic_nome;
      if (formData.solic_projeto) updatePayload.grupoProjeto = formData.solic_projeto;
      if (formData.solic_servico) updatePayload.servico = formData.solic_servico;
      if (formData.solic_operadora) updatePayload.operadora = formData.solic_operadora;
      if (formData.solic_freshdesk) updatePayload.freshdeskTicket = formData.solic_freshdesk;
      if (formData.solic_contato_local) updatePayload.contatoLocal = formData.solic_contato_local;
      if (formData.solic_cep) {
        const cepLimpo = formData.solic_cep.replace(/\D/g, '');
        updatePayload.cep = cepLimpo.length === 8 ? `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}` : cepLimpo;
      }
      if (formData.solic_rua) updatePayload.rua = formData.solic_rua;
      if (formData.solic_numero) updatePayload.numero = formData.solic_numero;
      if (formData.solic_complemento) updatePayload.complemento = formData.solic_complemento;
      if (formData.solic_bairro) updatePayload.bairro = formData.solic_bairro;
      if (formData.solic_cidade) updatePayload.cidade = formData.solic_cidade;
      if (formData.solic_uf) updatePayload.uf = formData.solic_uf;
      if (formData.solic_data_atividade) updatePayload.dataAtividade = formData.solic_data_atividade;
      if (formData.solic_hora_atividade) updatePayload.horaAtividade = formData.solic_hora_atividade;
      if (formData.solic_data_conclusao) updatePayload.dataConclusao = formData.solic_data_conclusao;
      if (formData.solic_status) updatePayload.status = formData.solic_status;
      if (formData.solic_horario_chegada) updatePayload.horarioChegada = formData.solic_horario_chegada;
      if (formData.solic_horario_liberacao) updatePayload.horarioLiberacao = formData.solic_horario_liberacao;
      if (formData.solic_horario_termino) updatePayload.horarioTermino = formData.solic_horario_termino;
      
      if (formData.solic_horario_chegada && formData.solic_horario_termino) {
        const [chegadaH, chegadaM] = (formData.solic_horario_chegada || '00:00').split(':').map(Number);
        const [terminoH, terminoM] = (formData.solic_horario_termino || '00:00').split(':').map(Number);
        const chegadaMinutos = chegadaH * 60 + chegadaM;
        const terminoMinutos = terminoH * 60 + terminoM;
        const diferencaMinutos = terminoMinutos >= chegadaMinutos 
          ? terminoMinutos - chegadaMinutos 
          : (24 * 60) - chegadaMinutos + terminoMinutos;
        const horas = Math.floor(diferencaMinutos / 60);
        const minutos = String(diferencaMinutos % 60).padStart(2, '0');
        updatePayload.totalHoras = `${horas}h ${minutos}m`;
      }
      
      if (formData.solic_observacoes) updatePayload.observacoes = formData.solic_observacoes;
      if (formData.solic_faturamento) updatePayload.faturamento = formData.solic_faturamento;
      if (tecnicoAssociado) {
        updatePayload.tecnicoEscolhido = {
          id: tecnicoAssociado.id,
          nome: tecnicoAssociado.tec_nome,
          telefone: tecnicoAssociado.tec_telefone,
          cpf: tecnicoAssociado.tec_cpf
        };
      }
      
      await updateMutation.mutateAsync(updatePayload);
      toast.success('Solicitação atualizada com sucesso!');
      setIsEditMode(false);
    } catch (error) {
      toast.error('Erro ao salvar solicitação');
    }
  };

  const handleCancel = () => {
    if (solicitacao) {
      setFormData(solicitacao);
    }
    setIsEditMode(false);
  };

  const handleSelectTecnico = (tecnico: any) => {
    setFormData({
      ...formData,
      solic_tecnico_id: tecnico.id
    });
    toast.success(`Técnico ${tecnico.tec_nome} selecionado!`);
    setShowTecnicoModal(false);
  };

  const handleOpenTecnicoModal = async () => {
  let lat = Number(formData.solic_latitude || formData.latitude || 0);
  let lon = Number(formData.solic_longitude || formData.longitude || 0);

  // Se houver um CEP preenchido, tenta buscar a coordenada exata dele primeiro
  if (formData.solic_cep) {
    try {
      const cepLimpo = String(formData.solic_cep).replace(/\D/g, '');
      if (cepLimpo.length === 8) {
        const endereco = await buscarEnderecoPorCEP(cepLimpo);
        if (endereco?.latitude && endereco?.longitude) {
          lat = Number(endereco.latitude);
          lon = Number(endereco.longitude);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar coordenadas via CEP:', error);
    }
  }

  // Fallback para as coordenadas salvas na solicitação se o CEP falhar
  if (!lat || !lon) {
    lat = Number(formData.solic_latitude || formData.latitude || 0);
    lon = Number(formData.solic_longitude || formData.longitude || 0);
  }

  if (!lat || !lon) {
    toast.error('Solicitação não possui coordenadas válidas para calcular a distância.');
    return;
  }

  setModalCoords({ latitude: lat, longitude: lon });
  setShowTecnicoModal(true);
};

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar esta solicitação?')) return;
    try {
      toast.loading('Deletando solicitação...');
      await deleteMutation.mutateAsync({ id: String(formData.id) });
      toast.success('Solicitação deletada com sucesso!');
      setLocation('/solicitacoes');
    } catch (error) {
      console.error('Erro ao deletar solicitação:', error);
      toast.error('Erro ao deletar solicitação');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    if (field === 'solic_cep' && value && value.length === 8) {
      handleBuscarCEP(value);
    }
  };
  
  const handleCEPChange = (value: string) => {
    const maskedCEP = aplicarMascaraCEP(value);
    setFormData((prev: any) => ({
      ...prev,
      solic_cep: maskedCEP
    }));
    
    const cepLimpo = maskedCEP.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      handleBuscarCEP(cepLimpo);
    }
  };
  
  const handleBuscarCEP = async (cepLimpo: string) => {
  if (cepLimpo.length !== 8) return;
  
  try {
    const endereco = await buscarEnderecoPorCEP(cepLimpo);
    if (endereco) {
      const enderecoConvertido = converterEnderecoViaCEP(endereco);
      setFormData((prev: any) => ({
        ...prev,
        solic_rua: enderecoConvertido.rua,
        solic_bairro: enderecoConvertido.bairro,
        solic_cidade: enderecoConvertido.cidade,
        solic_uf: enderecoConvertido.uf,
        // Armazena as coordenadas do novo CEP
        solic_latitude: endereco.latitude || prev.solic_latitude,
        solic_longitude: endereco.longitude || prev.solic_longitude,
      }));
      toast.success('Endereço e coordenadas encontrados!');
    } else {
      toast.error('CEP não encontrado');
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    toast.error('Erro ao buscar CEP');
  }
};

  const statusOptions = ['Pendente', 'Agendado', 'Concluído', 'Improdutivo'];
  const faturamentoOptions = ['Pago', 'Não Pago'];

  if (!solicitacao) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Solicitação não encontrada</p>
          <Button onClick={() => setLocation('/solicitacoes')}>Voltar</Button>
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
            <Button variant="ghost" size="sm" onClick={() => setLocation('/solicitacoes')}>← Voltar</Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">OS-{String(pathId).substring(0, 5)}</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!isEditMode && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                className="flex items-center gap-2"
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
                  onClick={handleEditToggle}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Salvar</span>
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
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
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Deletar</span>
            </Button>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Solicitação Info */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-600">Informações da Solicitação</h2>
              
              {/* Nome Atividade */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Nome da Atividade</label>
                {isEditMode ? (
                  <Input 
                    value={formData.solic_nome || ''} 
                    onChange={(e) => handleFieldChange('solic_nome', e.target.value)}
                    placeholder="Nome da atividade"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formData.solic_nome || '-'}</p>
                )}
              </div>

              {/* Projeto */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Projeto</label>
                {isEditMode ? (
                  <Select value={formData.solic_projeto || ''} onValueChange={(value) => handleFieldChange('solic_projeto', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRUPOS_PROJETO.map(grupo => (
                        <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground mt-1">{formData.solic_projeto || '-'}</p>
                )}
              </div>

              {/* Serviço */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Serviço</label>
                {isEditMode ? (
                  <Select value={formData.solic_servico || ''} onValueChange={(value) => handleFieldChange('solic_servico', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICOS.map(servico => (
                        <SelectItem key={servico} value={servico}>{servico}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground mt-1">{formData.solic_servico || '-'}</p>
                )}
              </div>

              {/* Operadora */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Operadora</label>
                {isEditMode ? (
                  <Select value={formData.solic_operadora || ''} onValueChange={(value) => handleFieldChange('solic_operadora', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar operadora" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERADORAS.map((op) => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground mt-1">{formData.solic_operadora || '-'}</p>
                )}
              </div>

              {/* Freshdesk Ticket */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Freshdesk Ticket</label>
                {isEditMode ? (
                  <Input 
                    value={formData.solic_freshdesk || ''} 
                    onChange={(e) => handleFieldChange('solic_freshdesk', e.target.value)}
                    placeholder="Ticket"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formData.solic_freshdesk || '-'}</p>
                )}
              </div>

              {/* Contato Local */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Contato Local</label>
                {isEditMode ? (
                  <Input 
                    value={formData.solic_contato_local || ''} 
                    onChange={(e) => handleFieldChange('solic_contato_local', e.target.value)}
                    placeholder="Contato"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formData.solic_contato_local || '-'}</p>
                )}
              </div>

              {/* Data de Criação */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Data de Criação</label>
                <p className="text-foreground mt-1">{formatDatePtBr(formData.solic_data_criacao)}</p>
              </div>

              {/* Data Atividade */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Data da Atividade</label>
                {isEditMode ? (
                  <Input 
                    type="date"
                    value={formData.solic_data_atividade || ''} 
                    onChange={(e) => handleFieldChange('solic_data_atividade', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formatDatePtBr(formData.solic_data_atividade)}</p>
                )}
              </div>

              {/* Hora Atividade */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Hora da Atividade</label>
                {isEditMode ? (
                  <Input 
                    type="time"
                    value={formData.solic_hora_atividade || ''} 
                    onChange={(e) => handleFieldChange('solic_hora_atividade', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formatTimePtBr(formData.solic_hora_atividade)}</p>
                )}
              </div>

              {/* Endereço Fields */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-muted-foreground mb-3">Endereço</h3>
                
                {/* CEP */}
                <div className="mb-3">
                  <label className="text-sm font-semibold text-muted-foreground">CEP</label>
                  {isEditMode ? (
                    <Input 
                      value={formData.solic_cep || ''} 
                      onChange={(e) => handleCEPChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{formData.solic_cep || '-'}</p>
                  )}
                </div>

                {/* Rua */}
                <div className="mb-3">
                  <label className="text-sm font-semibold text-muted-foreground">Rua</label>
                  {isEditMode ? (
                    <Input 
                      value={formData.solic_rua || ''} 
                      onChange={(e) => handleFieldChange('solic_rua', e.target.value)}
                      placeholder="Digite a rua"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{formData.solic_rua || '-'}</p>
                  )}
                </div>

                {/* Número e Complemento */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Número</label>
                    {isEditMode ? (
                      <Input 
                        value={formData.solic_numero || ''} 
                        onChange={(e) => handleFieldChange('solic_numero', e.target.value)}
                        placeholder="Ex: 123"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground mt-1">{formData.solic_numero || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Complemento</label>
                    {isEditMode ? (
                      <Input 
                        value={formData.solic_complemento || ''} 
                        onChange={(e) => handleFieldChange('solic_complemento', e.target.value)}
                        placeholder="Ex: Apto 101"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground mt-1">{formData.solic_complemento || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Bairro */}
                <div className="mb-3">
                  <label className="text-sm font-semibold text-muted-foreground">Bairro</label>
                  {isEditMode ? (
                    <Input 
                      value={formData.solic_bairro || ''} 
                      onChange={(e) => handleFieldChange('solic_bairro', e.target.value)}
                      placeholder="Digite o bairro"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{formData.solic_bairro || '-'}</p>
                  )}
                </div>

                {/* Cidade e UF */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Cidade</label>
                    {isEditMode ? (
                      <Input 
                        value={formData.solic_cidade || ''} 
                        onChange={(e) => handleFieldChange('solic_cidade', e.target.value)}
                        placeholder="Digite a cidade"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground mt-1">{formData.solic_cidade || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">UF</label>
                    {isEditMode ? (
                      <Input 
                        value={formData.solic_uf || ''} 
                        onChange={(e) => handleFieldChange('solic_uf', e.target.value)}
                        placeholder="UF"
                        className="mt-1"
                        maxLength={2}
                      />
                    ) : (
                      <p className="text-foreground mt-1">{formData.solic_uf || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4 border-t pt-4">
                <label className="text-sm font-semibold text-muted-foreground">Status</label>
                {isEditMode ? (
                  <Select value={formData.solic_status || 'Pendente'} onValueChange={(value) => handleFieldChange('solic_status', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground mt-1">{formData.solic_status || '-'}</p>
                )}
              </div>

              {/* Data Conclusão */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-muted-foreground">Data de Conclusão</label>
                {isEditMode ? (
                  <Input 
                    type="date"
                    value={formData.solic_data_conclusao || ''} 
                    onChange={(e) => handleFieldChange('solic_data_conclusao', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-foreground mt-1">{formatDatePtBr(formData.solic_data_conclusao)}</p>
                )}
              </div>

              {/* Faturamento */}
              {user?.role !== 'analista' && (
                <div className="mb-4">
                  <label className="text-sm font-semibold text-muted-foreground">Faturamento</label>
                  {isEditMode ? (
                    <Select value={formData.solic_faturamento || 'Não Pago'} onValueChange={(value) => handleFieldChange('solic_faturamento', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {faturamentoOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-foreground mt-1">{formData.solic_faturamento || '-'}</p>
                  )}
                </div>
              )}

              {/* Horários */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-muted-foreground mb-3">Horários</h3>
                
                <div className="mb-3">
                  <label className="text-sm font-semibold text-muted-foreground">Horário de Chegada</label>
                  {isEditMode ? (
                    <Input 
                      type="time"
                      value={formData.solic_horario_chegada || ''} 
                      onChange={(e) => handleFieldChange('solic_horario_chegada', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{formatTimePtBr(formData.solic_horario_chegada)}</p>
                  )}
                </div>

                <div className="mb-3">
                  <label className="text-sm font-semibold text-muted-foreground">Horário de Liberação</label>
                  {isEditMode ? (
                    <Input 
                      type="time"
                      value={formData.solic_horario_liberacao || ''} 
                      onChange={(e) => handleFieldChange('solic_horario_liberacao', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{formatTimePtBr(formData.solic_horario_liberacao)}</p>
                  )}
                </div>

                <div className="mb-3">
                  <label className="text-sm font-semibold text-muted-foreground">Horário de Término</label>
                  {isEditMode ? (
                    <Input 
                      type="time"
                      value={formData.solic_horario_termino || ''} 
                      onChange={(e) => handleFieldChange('solic_horario_termino', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{formatTimePtBr(formData.solic_horario_termino)}</p>
                  )}
                </div>

                {/* Total de Horas Trabalhadas */}
                <div className="mb-3">
                  <label className="text-sm font-semibold text-muted-foreground">Total de Horas Trabalhadas</label>
                  <p className="text-foreground mt-1">
                    {formData.solic_horario_chegada && formData.solic_horario_termino 
                      ? (() => {
                          const [chegadaH, chegadaM] = (formData.solic_horario_chegada || '00:00').split(':').map(Number);
                          const [terminoH, terminoM] = (formData.solic_horario_termino || '00:00').split(':').map(Number);
                          const chegadaMinutos = chegadaH * 60 + chegadaM;
                          const terminoMinutos = terminoH * 60 + terminoM;
                          const diferencaMinutos = terminoMinutos >= chegadaMinutos 
                            ? terminoMinutos - chegadaMinutos 
                            : (24 * 60) - chegadaMinutos + terminoMinutos;
                          const horas = Math.floor(diferencaMinutos / 60);
                          const minutos = String(diferencaMinutos % 60).padStart(2, '0');
                          return `${horas}h ${minutos}m`;
                        })()
                      : '-'
                    }
                  </p>
                </div>
              </div>

              {/* Observações */}
              <div className="mb-4 border-t pt-4">
                <label className="text-sm font-semibold text-muted-foreground">Observações</label>
                {isEditMode ? (
                  <Textarea 
                    value={formData.solic_observacoes || ''} 
                    onChange={(e) => handleFieldChange('solic_observacoes', e.target.value)}
                    placeholder="Observações"
                    className="mt-1 min-h-24"
                  />
                ) : (
                  <p className="text-foreground mt-1 whitespace-pre-wrap">{formData.solic_observacoes || '-'}</p>
                )}
              </div>
            </Card>

            {/* Texto de Solicitação */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-600">Texto de Solicitação</h2>
              <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap mb-4">
                {textoSolicitacao}
              </div>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(textoSolicitacao);
                  toast.success('Texto de solicitação copiado para a área de transferência!');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copiar Texto
              </Button>
            </Card>
          </div>

          {/* Right Column - Técnico Info */}
          <div className="space-y-4">
            {/* Técnico Associado */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-600">Informações do Técnico</h2>
              
              {tecnicoAssociado ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Nome</label>
                    <p className="text-lg font-bold">{tecnicoAssociado.tec_nome}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Telefone</label>
                    <p className="text-lg font-bold">{tecnicoAssociado.tec_telefone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">CPF</label>
                    <p className="text-lg font-bold">{tecnicoAssociado.tec_cpf}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Endereço</label>
                    <p className="text-sm">{tecnicoAssociado.tec_rua}, {tecnicoAssociado.tec_numero} - {tecnicoAssociado.tec_bairro}, {tecnicoAssociado.tec_cidade}/{tecnicoAssociado.tec_uf}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Empresa Parceira</label>
                    <p className="text-lg font-bold">{tecnicoAssociado.tec_empresa_parceira}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Avaliação</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-blue-600">
                        {(tecnicoAssociado.tec_avaliacao || 0).toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">/5.0</span>
                    </div>
                  </div>
                  {isEditMode && user?.role !== 'analista' && (
                    <Button 
                      onClick={handleOpenTecnicoModal}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      🔍 Buscar Técnico Próximo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Nenhum técnico associado</p>
                  {isEditMode && user?.role !== 'analista' && (
                    <Button 
                      onClick={handleOpenTecnicoModal}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      🔍 Buscar Técnico Próximo
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Texto de Liberação */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-600">Texto de Liberação</h2>
              <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap mb-4">
                {textoLiberacao}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(textoLiberacao);
                    toast.success('Texto copiado para a área de transferência!');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Copy size={18} />
                  Copiar Texto
                </Button>
                <Button 
                  onClick={async () => {
                    if (!formData.solic_freshdesk) {
                      toast.error('Nenhum ticket Freshdesk vinculado!');
                      return;
                    }
                    if (!tecnicoAssociado) {
                      toast.error('Nenhum técnico selecionado!');
                      return;
                    }
                    try {
                      await sendToFreshdesk.mutateAsync({
                        ticketId: parseInt(formData.solic_freshdesk),
                        data: formData.solic_data_atividade || '',
                        hora: formData.solic_hora_atividade || '',
                        tecnicoNome: tecnicoAssociado.tec_nome || '',
                        tecnicoCpf: tecnicoAssociado.tec_cpf || '',
                      });
                      setShowSuccessDialog(true);
                      toast.success('Liberação enviada ao Freshdesk com sucesso!');
                    } catch (error) {
                      toast.error('Erro ao enviar ao Freshdesk');
                      console.error(error);
                    }
                  }}
                  disabled={sendToFreshdesk.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendToFreshdesk.isPending ? (
                    <>
                      <div className="animate-spin"><Send size={18} /></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar ao Freshdesk
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Send size={24} />
              Liberação Enviada!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-semibold mb-2">Informações do Envio:</p>
              <ul className="space-y-2 text-sm text-green-700">
                <li><strong>Ticket:</strong> #{formData.solic_freshdesk}</li>
                <li><strong>Técnico:</strong> {tecnicoAssociado?.tec_nome || 'N/A'}</li>
                <li><strong>Data:</strong> {formatDatePtBr(formData.solic_data_atividade)}</li>
                <li><strong>Hora:</strong> {formatTimePtBr(formData.solic_hora_atividade)}</li>
              </ul>
            </div>
            <p className="text-gray-600 text-sm">
              A liberação foi enviada com sucesso para o ticket Freshdesk.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Technician Search Modal */}
      <TechnicianSearchModal
        isOpen={showTecnicoModal}
        onClose={() => setShowTecnicoModal(false)}
        onSelectTechnician={handleSelectTecnico}
        technicians={nearbyTecnicos}
        isLoading={isLoadingTecnicos}
        currentTechnicianId={formData.solic_tecnico_id}
      />
    </div>
  );
}