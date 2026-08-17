import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Edit2, Plus, Star, Search, Filter } from 'lucide-react';
import { useLocation } from 'wouter';
import TecnicoCard from '@/components/TecnicoCard';
import { EquipamentosForm } from '@/components/EquipamentosForm';
import { EquipamentosHistorico } from '@/components/EquipamentosHistorico';
import { EquipmentHistoryTab } from '@/components/EquipmentHistoryTab';
import { aplicarMascaraCPF, aplicarMascaraTelefone, aplicarMascaraRG, aplicarMascaraCEP } from '@/utils/masks';
import { buscarEnderecoPorCEP, converterEnderecoViaCEP } from '@/utils/cepLookup';
import { geocodeAddress } from '@/utils/geocodeAddress';
import { Tecnico, EMPRESAS_PARCEIRAS } from '@/types';
import { toast } from 'sonner';
import { registrarAuditLog } from '@/utils/auditLog';
import { useAuth } from '@/_core/hooks/useAuth';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { trpc } from '@/lib/trpc';

export default function Tecnicos() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCidade, setSelectedCidade] = useState('');
  const [selectedUF, setSelectedUF] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [avaliacao, setAvaliacao] = useState(0);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [geocodificando, setGeocodificando] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'equipamentos' | 'historico'>('dados');
  const [equipamentosArray, setEquipamentosArray] = useState<any[]>([]);
  
  // Estado inicial do formulário
  const initialFormData = {
    tecNome: '',
    tecTelefone: '',
    tecCPF: '',
    tecRG: '',
    tecCEP: '',
    tecRua: '',
    tecNumero: '',
    tecComplemento: '',
    tecBairro: '',
    tecCidade: '',
    tecUF: '',
    tecEmpresaParceira: '',
    tecObservacoes: '',
    tecAvaliacaoPontualidade: 0,
    tecAvaliacaoFerramentas: 0,
    tecAvaliacaoProdutividade: 0,
    tecAvaliacaoConhecimento: 0,
    tecAvaliacaoFlexibilidade: 0
  };

  // Usar persistência de formulário
  const { formData, setFormData, clearFormData } = useFormPersistence(
    'tecnicos_form_data',
    initialFormData,
    showModal
  );

  // Persistir estado do modal em localStorage
  useEffect(() => {
    localStorage.setItem('tecnicos_modal_open', JSON.stringify(showModal));
  }, [showModal]);

  // Restaurar estado do modal ao carregar a página
  useEffect(() => {
    const savedModalState = localStorage.getItem('tecnicos_modal_open');
    if (savedModalState === 'true') {
      setShowModal(true);
    }
  }, []);

  // Load técnicos from Supabase
  const { data: tecnicos = [], isLoading, refetch } = trpc.tecnicos.list.useQuery();
  const createMutation = trpc.tecnicos.create.useMutation();
  const updateMutation = trpc.tecnicos.update.useMutation();
  const deleteMutation = trpc.tecnicos.delete.useMutation();

  // Transform snake_case data from backend to camelCase
  const transformedTecnicos = useMemo(() => {
    return (tecnicos || []).map((t: any) => ({
      id: t.id,
      tecNome: t.tec_nome,
      tecTelefone: t.tec_telefone,
      tecCPF: t.tec_cpf,
      tecRG: t.tec_rg,
      tecCEP: t.tec_cep,
      tecRua: t.tec_rua,
      tecNumero: t.tec_numero,
      tecComplemento: t.tec_complemento,
      tecBairro: t.tec_bairro,
      tecCidade: t.tec_cidade,
      tecUF: t.tec_uf,
      tecEmpresaParceira: t.tec_empresa_parceira,
      tecObservacoes: t.tec_observacoes,
      tecAvaliacao: t.tec_avaliacao,
      tecAvaliacaoPontualidade: t.tec_avaliacao_pontualidade || 0,
      tecAvaliacaoFerramentas: t.tec_avaliacao_ferramentas || 0,
      tecAvaliacaoProdutividade: t.tec_avaliacao_produtividade || 0,
      tecAvaliacaoConhecimento: t.tec_avaliacao_conhecimento || 0,
      tecAvaliacaoFlexibilidade: t.tec_avaliacao_flexibilidade || 0,
      lat: t.tec_latitude,
      long: t.tec_longitude,
      dataCriacao: t.tec_data_criacao,
      dataAtualizacao: t.tec_data_atualizacao
    }));
  }, [tecnicos]);

  // Extrair UFs e Cidades únicas para preencher os seletores
  const listaUFs = useMemo(() => {
    const ufs = transformedTecnicos
      .map(t => t.tecUF?.toUpperCase().trim())
      .filter((uf): uf is string => Boolean(uf));
    return Array.from(new Set(ufs)).sort();
  }, [transformedTecnicos]);

  const listaCidades = useMemo(() => {
    const cidades = transformedTecnicos
      .filter(t => !selectedUF || t.tecUF?.toUpperCase().trim() === selectedUF)
      .map(t => t.tecCidade?.trim())
      .filter((cidade): cidade is string => Boolean(cidade));
    return Array.from(new Set(cidades)).sort();
  }, [transformedTecnicos, selectedUF]);

  const filteredTecnicos = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return transformedTecnicos.filter(t => {
      const nome = (t.tecNome || '').toLowerCase();
      const telefone = (t.tecTelefone || '').toLowerCase();
      const cidade = (t.tecCidade || '').toLowerCase();
      const uf = (t.tecUF || '').toUpperCase().trim();

      const matchesSearch = nome.includes(term) || telefone.includes(term);
      const matchesCidade = !selectedCidade || cidade === selectedCidade.toLowerCase();
      const matchesUF = !selectedUF || uf === selectedUF;

      return matchesSearch && matchesCidade && matchesUF;
    });
  }, [transformedTecnicos, searchTerm, selectedCidade, selectedUF]);

  const handleBuscarCEP = async (cep: string) => {
    if (cep.length !== 8) return;

    setBuscandoCEP(true);
    try {
      const endereco = await buscarEnderecoPorCEP(cep);
      if (endereco) {
        const convertido = converterEnderecoViaCEP(endereco);
        setFormData(prev => ({
          ...prev,
          tecRua: convertido.rua,
          tecBairro: convertido.bairro,
          tecCidade: convertido.cidade,
          tecUF: convertido.uf
        }));
        toast.success('CEP encontrado');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      toast.error('Erro ao buscar CEP');
    } finally {
      setBuscandoCEP(false);
    }
  };

  const handleSalvar = async () => {
    if (!user) return;

    if (!formData.tecNome || !formData.tecTelefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSalvando(true);
    try {
      setGeocodificando(true);
      console.log('🔍 Iniciando geocodificação para técnico...');
      const coords = await geocodeAddress({
        tec_cep: formData.tecCEP,
        tec_rua: formData.tecRua,
        tec_numero: formData.tecNumero,
        tec_bairro: formData.tecBairro,
        tec_cidade: formData.tecCidade,
        tec_uf: formData.tecUF
      });

      if (coords) {
        console.log('✅ Coordenadas obtidas:', coords);
        toast.success('Coordenadas obtidas com sucesso');
      } else {
        console.warn('⚠️ Sem coordenadas - endereço não encontrado');
        toast.warning('Endereço não encontrado para geocodificação');
      }
      setGeocodificando(false);

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          tec_nome: formData.tecNome,
          tec_telefone: formData.tecTelefone,
          tec_cpf: formData.tecCPF,
          tec_rg: formData.tecRG,
          tec_cep: formData.tecCEP,
          tec_rua: formData.tecRua,
          tec_numero: formData.tecNumero,
          tec_complemento: formData.tecComplemento,
          tec_bairro: formData.tecBairro,
          tec_cidade: formData.tecCidade,
          tec_uf: formData.tecUF,
          tec_empresa_parceira: formData.tecEmpresaParceira,
          tec_observacoes: formData.tecObservacoes,
          tec_avaliacao_pontualidade: formData.tecAvaliacaoPontualidade || 0,
          tec_avaliacao_ferramentas: formData.tecAvaliacaoFerramentas || 0,
          tec_avaliacao_produtividade: formData.tecAvaliacaoProdutividade || 0,
          tec_avaliacao_conhecimento: formData.tecAvaliacaoConhecimento || 0,
          tec_avaliacao_flexibilidade: formData.tecAvaliacaoFlexibilidade || 0,
          tec_avaliacao: Math.round(((formData.tecAvaliacaoPontualidade || 0) + (formData.tecAvaliacaoFerramentas || 0) + (formData.tecAvaliacaoProdutividade || 0) + (formData.tecAvaliacaoConhecimento || 0) + (formData.tecAvaliacaoFlexibilidade || 0)) / 5 * 100) / 100,
          ...(coords && { lat: coords.lat, long: coords.lng })
        });
        toast.success('Técnico atualizado com sucesso');
      } else {
        await createMutation.mutateAsync({
          tec_nome: formData.tecNome,
          tec_telefone: formData.tecTelefone,
          tec_cpf: formData.tecCPF,
          tec_rg: formData.tecRG,
          tec_cep: formData.tecCEP,
          tec_rua: formData.tecRua,
          tec_avaliacao_pontualidade: formData.tecAvaliacaoPontualidade || 0,
          tec_avaliacao_ferramentas: formData.tecAvaliacaoFerramentas || 0,
          tec_avaliacao_produtividade: formData.tecAvaliacaoProdutividade || 0,
          tec_avaliacao_conhecimento: formData.tecAvaliacaoConhecimento || 0,
          tec_avaliacao_flexibilidade: formData.tecAvaliacaoFlexibilidade || 0,
          tec_numero: formData.tecNumero,
          tec_complemento: formData.tecComplemento,
          tec_bairro: formData.tecBairro,
          tec_cidade: formData.tecCidade,
          tec_uf: formData.tecUF,
          tec_empresa_parceira: formData.tecEmpresaParceira,
          tec_observacoes: formData.tecObservacoes,
          tec_avaliacao: Math.round(((formData.tecAvaliacaoPontualidade || 0) + (formData.tecAvaliacaoFerramentas || 0) + (formData.tecAvaliacaoProdutividade || 0) + (formData.tecAvaliacaoConhecimento || 0) + (formData.tecAvaliacaoFlexibilidade || 0)) / 5 * 100) / 100,
          ...(coords && { lat: coords.lat, long: coords.lng })
        });
        toast.success('Técnico criado com sucesso');
      }

      setShowModal(false);
      clearFormData();
      setFormData(initialFormData);
      setEditingId(null);
      setAvaliacao(0);
      refetch();
    } catch (err) {
      console.error('❌ Erro ao salvar técnico:', err);
      toast.error('Erro ao salvar técnico');
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (tecnico: Tecnico) => {
    setLocation(`/tecnicos/${tecnico.id}`);
  };

  const handleFecharModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
    setAvaliacao(0);
  };

  const handleDeletarTecnico = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o técnico ${nome}?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Técnico deletado com sucesso');
      await refetch();
    } catch (err) {
      console.error('[FRONTEND DELETE] Error:', err);
      toast.error('Erro ao deletar técnico');
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando técnicos...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Técnicos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie todos os técnicos do sistema</p>
        </div>

        <div className="flex justify-between items-center">
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus size={20} />
            Adicionar Técnico
          </Button>
        </div>

        {/* Search Bar e Filtros de Localização */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div>
            <select
              value={selectedUF}
              onChange={(e) => {
                setSelectedUF(e.target.value);
                setSelectedCidade('');
              }}
              className="w-full h-10 border rounded-md px-3 bg-background text-sm"
            >
              <option value="">Todas as UFs</option>
              {listaUFs.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCidade}
              onChange={(e) => setSelectedCidade(e.target.value)}
              className="w-full h-10 border rounded-md px-3 bg-background text-sm"
            >
              <option value="">Todas as Cidades</option>
              {listaCidades.map(cidade => (
                <option key={cidade} value={cidade}>{cidade}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Limpar Filtros */}
        {(searchTerm || selectedCidade || selectedUF) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filtros ativos:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCidade('');
                setSelectedUF('');
              }}
              className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800"
            >
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Técnicos List - Horizontal Layout */}
        <div className="space-y-3">
          {filteredTecnicos.map(tecnico => (
            <TecnicoCard
              key={tecnico.id}
              tecnico={tecnico}
              onView={() => handleEditar(tecnico)}
              onDelete={() => handleDeletarTecnico(tecnico.id, tecnico.tecNome)}
            />
          ))}

          {filteredTecnicos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum técnico encontrado para os filtros selecionados.
            </div>
          )}
        </div>

        {/* Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Técnico' : 'Adicionar Técnico'}
              </DialogTitle>
              <DialogDescription>
                {editingId ? 'Atualize as informações do técnico' : 'Preencha os dados do novo técnico'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <Input
                  value={formData.tecNome}
                  onChange={(e) => setFormData({...formData, tecNome: e.target.value})}
                  placeholder="Nome do técnico"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium mb-1">Telefone *</label>
                <Input
                  value={formData.tecTelefone}
                  onChange={(e) => setFormData({
                    ...formData,
                    tecTelefone: aplicarMascaraTelefone(e.target.value)
                  })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium mb-1">CPF</label>
                <Input
                  value={formData.tecCPF}
                  onChange={(e) => setFormData({
                    ...formData,
                    tecCPF: aplicarMascaraCPF(e.target.value)
                  })}
                  placeholder="000.000.000-00"
                />
              </div>

              {/* RG */}
              <div>
                <label className="block text-sm font-medium mb-1">RG</label>
                <Input
                  value={formData.tecRG}
                  onChange={(e) => setFormData({
                    ...formData,
                    tecRG: aplicarMascaraRG(e.target.value)
                  })}
                  placeholder="00.000.000-0"
                />
              </div>

              {/* CEP */}
              <div>
                <label className="block text-sm font-medium mb-1">CEP</label>
                <Input
                  value={formData.tecCEP}
                  onChange={(e) => {
                    const cepValue = aplicarMascaraCEP(e.target.value);
                    setFormData({...formData, tecCEP: cepValue});
                    if (cepValue.replace('-', '').length === 8) {
                      handleBuscarCEP(cepValue.replace('-', ''));
                    }
                  }}
                  onPaste={(e) => {
                    setTimeout(() => {
                      const inputElement = e.target as HTMLInputElement;
                      if (inputElement) {
                        const cepValue = aplicarMascaraCEP(inputElement.value);
                        setFormData({...formData, tecCEP: cepValue});
                        if (cepValue.replace('-', '').length === 8) {
                          handleBuscarCEP(cepValue.replace('-', ''));
                        }
                      }
                    }, 0);
                  }}
                  maxLength={9}
                  placeholder="00000-000"
                />
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Rua</label>
                  <Input
                    value={formData.tecRua}
                    onChange={(e) => setFormData({...formData, tecRua: e.target.value})}
                    placeholder="Rua"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <Input
                    value={formData.tecNumero}
                    onChange={(e) => setFormData({...formData, tecNumero: e.target.value})}
                    placeholder="Número"
                  />
                </div>
              </div>

              {/* Complemento */}
              <div>
                <label className="block text-sm font-medium mb-1">Complemento</label>
                <Input
                  value={formData.tecComplemento}
                  onChange={(e) => setFormData({...formData, tecComplemento: e.target.value})}
                  placeholder="Apto, sala, etc"
                />
              </div>

              {/* Bairro, Cidade, UF */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Bairro</label>
                  <Input
                    value={formData.tecBairro}
                    onChange={(e) => setFormData({...formData, tecBairro: e.target.value})}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <Input
                    value={formData.tecCidade}
                    onChange={(e) => setFormData({...formData, tecCidade: e.target.value})}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">UF</label>
                  <Input
                    value={formData.tecUF}
                    onChange={(e) => setFormData({...formData, tecUF: e.target.value.toUpperCase()})}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Empresa Parceira */}
              <div>
                <label className="block text-sm font-medium mb-1">Empresa Parceira</label>
                <select
                  value={formData.tecEmpresaParceira}
                  onChange={(e) => setFormData({...formData, tecEmpresaParceira: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecione uma empresa</option>
                  {EMPRESAS_PARCEIRAS.map(empresa => {
                    const displayName = empresa.charAt(0).toUpperCase() + empresa.slice(1);
                    return (
                      <option key={empresa} value={empresa}>{displayName}</option>
                    );
                  })}
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  value={formData.tecObservacoes}
                  onChange={(e) => setFormData({...formData, tecObservacoes: e.target.value})}
                  placeholder="Observações"
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              {/* Avaliação - 5 Campos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Avaliação do Técnico</h3>
                
                {/* Pontualidade */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Pontualidade</label>
                    <span className="text-sm text-gray-600">{formData.tecAvaliacaoPontualidade.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoPontualidade}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoPontualidade: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* Ferramentas */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Ferramentas</label>
                    <span className="text-sm text-gray-600">{formData.tecAvaliacaoFerramentas.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoFerramentas}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoFerramentas: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* Produtividade */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Produtividade</label>
                    <span className="text-sm text-gray-600">{formData.tecAvaliacaoProdutividade.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoProdutividade}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoProdutividade: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* Conhecimento */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Conhecimento</label>
                    <span className="text-sm text-gray-600">{formData.tecAvaliacaoConhecimento.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoConhecimento}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoConhecimento: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* Flexibilidade */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Flexibilidade</label>
                    <span className="text-sm text-gray-600">{formData.tecAvaliacaoFlexibilidade.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoFlexibilidade}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoFlexibilidade: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* Média calculada */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Avaliação Média:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {((
                        (formData.tecAvaliacaoPontualidade || 0) +
                        (formData.tecAvaliacaoFerramentas || 0) +
                        (formData.tecAvaliacaoProdutividade || 0) +
                        (formData.tecAvaliacaoConhecimento || 0) +
                        (formData.tecAvaliacaoFlexibilidade || 0)
                      ) / 5).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Geocoding Status */}
              {geocodificando && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  🔍 Geocodificando endereço... Obtendo coordenadas (latitude/longitude)
                </div>
              )}
            </div>

            {/* Tabs for Equipment Management */}
            {editingId && (
              <div className="border-t pt-4 mt-4">
                <EquipmentHistoryTab tecnicoId={editingId} tecnicoNome={formData.tecNome} />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleFecharModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSalvar}
                disabled={salvando || geocodificando}
              >
                {salvando || geocodificando ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}