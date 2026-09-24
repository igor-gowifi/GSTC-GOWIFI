import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Save, AlertTriangle, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { buscarEnderecoPorCEP, converterEnderecoViaCEP } from '@/utils/cepLookup';
import { geocodeAddress } from '@/utils/geocodeAddress';
import { aplicarMascaraCEP } from '@/utils/masks';
import { TechnicianSearchModal } from '@/components/TechnicianSearchModal';
import { useSolicitacaoOptions } from '@/hooks/useSolicitacaoOptions';


export default function NovaSolicitacao() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const {
  GRUPOS_PROJETO,
  SERVICOS,
  OPERADORAS
} = useSolicitacaoOptions();

  // 1. Estado Unificado do Formulário
  const [formData, setFormData] = useState({
    nomeAtividade: '',
    grupoProjeto: '',
    servico: '',
    operadora: '',
    freshdesk: '',
    contatoLocal: '',
    data: '',
    hora: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });

  // 2. Estados de Controle
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);

  // 3. Estados do Modal e Técnico Selecionado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordsBusca, setCoordsBusca] = useState<{ lat: number; lng: number } | null>(null);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState<{ id: string; tec_nome: string } | null>(null);

  // Queries e Mutations
  const createMutation = trpc.solicitacoes.create.useMutation();

  // Busca técnicos com base nas coordenadas calculadas (executa apenas quando coordsBusca existir)
  const { data: tecnicosData, isLoading: isLoadingTecnicos } = trpc.tecnicos.buscarProximos?.useQuery(
    { lat: coordsBusca?.lat ?? 0, lng: coordsBusca?.lng ?? 0 },
    { enabled: !!coordsBusca }
  ) ?? { data: [], isLoading: false };

  // Buscar endereço por CEP
  const handleBuscarCEP = async (cepValue: string) => {
    if (cepValue.length !== 8) return;

    setBuscandoCEP(true);
    try {
      const endereco = await buscarEnderecoPorCEP(cepValue);
      if (endereco) {
        const convertido = converterEnderecoViaCEP(endereco);
        setFormData(prev => ({
          ...prev,
          rua: convertido.rua,
          bairro: convertido.bairro,
          cidade: convertido.cidade,
          uf: convertido.uf,
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

  // Validar formulário
  const validarFormulario = () => {
    const erros: string[] = [];
    const camposObrigatorios = [
      { campo: 'nomeAtividade', label: 'Nome da Atividade' },
      { campo: 'grupoProjeto', label: 'Grupo de Projeto' },
      { campo: 'servico', label: 'Serviço' },
      { campo: 'operadora', label: 'Operadora' },
      { campo: 'freshdesk', label: 'Freshdesk Ticket' },
      { campo: 'cep', label: 'CEP' },
      { campo: 'rua', label: 'Rua' },
      { campo: 'numero', label: 'Número' },
      { campo: 'bairro', label: 'Bairro' },
      { campo: 'cidade', label: 'Cidade' },
      { campo: 'uf', label: 'UF' },
    ];

    for (const { campo, label } of camposObrigatorios) {
      if (!formData[campo as keyof typeof formData]) {
        erros.push(label);
      }
    }

    setErrosValidacao(erros);

    if (erros.length > 0) {
      toast.error(`Campos obrigatórios não preenchidos: ${erros.join(', ')}`);
      return false;
    }
    return true;
  };

  // Abrir o modal de busca acionando a geocodificação do endereço do formulário
  const handleAbrirBuscaTecnicos = async () => {
    if (!formData.cep || !formData.rua || !formData.cidade || !formData.uf) {
      toast.error('Preencha os campos de endereço antes de buscar técnicos.');
      return;
    }

    setIsGeocoding(true);
    try {
      const coords = await geocodeAddress({
        tec_cep: formData.cep,
        tec_rua: formData.rua,
        tec_numero: formData.numero,
        tec_bairro: formData.bairro,
        tec_cidade: formData.cidade,
        tec_uf: formData.uf
      });

      if (!coords) {
        toast.error('Não foi possível localizar as coordenadas para este endereço.');
        return;
      }

      setCoordsBusca({ lat: coords.lat, lng: coords.lng });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erro ao geocodificar:', error);
      toast.error('Erro ao processar localização do endereço.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Salvar solicitação
  const handleSalvar = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!validarFormulario()) return;

    setSalvando(true);
    try {
      await createMutation.mutateAsync({
        nomeAtividade: formData.nomeAtividade,
        grupoProjeto: formData.grupoProjeto,
        servico: formData.servico,
        operadora: formData.operadora,
        freshdeskTicket: formData.freshdesk,
        contatoLocal: formData.contatoLocal || null,
        dataAtividade: formData.data || null,
        horaAtividade: formData.hora || null,
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento || '',
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        tecnicoId: tecnicoSelecionado?.id || null,
      });

      toast.success('Solicitação criada com sucesso!');
      
      setTimeout(() => setLocation('/solicitacoes'), 500);
      
      // Limpar formulário
      setFormData({
        nomeAtividade: '',
        grupoProjeto: '',
        servico: '',
        operadora: '',
        freshdesk: '',
        contatoLocal: '',
        data: '',
        hora: '',
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
      });
      setTecnicoSelecionado(null);
      setErrosValidacao([]);
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
      toast.error('Erro ao salvar solicitação');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nova Solicitação Técnica</h1>
          <p className="text-muted-foreground mt-2">Crie uma nova solicitação de atendimento</p>
        </div>

        {/* Mostrar erros de validação */}
        {errosValidacao.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Campos obrigatórios não preenchidos</h3>
              <ul className="text-sm text-red-800 list-disc list-inside">
                {errosValidacao.map((erro, idx) => (
                  <li key={idx}>{erro}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <Card className="p-6">
          <form className="space-y-6">

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Nome da Atividade */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Atividade *</label>
                <Input
                  type="text"
                  placeholder="Ex: Brad#0001"
                  value={formData.nomeAtividade}
                  onChange={(e) => setFormData({ ...formData, nomeAtividade: e.target.value })}
                  className={errosValidacao.includes('Nome da Atividade') ? 'border-red-500' : ''}
                />
              </div>

              {/* 2. Grupo de Projeto */}
              <div>
                <label className="block text-sm font-medium mb-1">Grupo de Projeto *</label>
                <Select value={formData.grupoProjeto} onValueChange={(value) => setFormData({ ...formData, grupoProjeto: value })}>
                  <SelectTrigger className={errosValidacao.includes('Grupo de Projeto') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_PROJETO.map(grupo => (
                      <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Serviço */}
              <div>
                <label className="block text-sm font-medium mb-1">Serviço *</label>
                <Select value={formData.servico} onValueChange={(value) => setFormData({ ...formData, servico: value })}>
                  <SelectTrigger className={errosValidacao.includes('Serviço') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICOS.map(servico => (
                      <SelectItem key={servico} value={servico}>{servico}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Operadora */}
              <div>
                <label className="block text-sm font-medium mb-1">Operadora *</label>
                <Select value={formData.operadora} onValueChange={(value) => setFormData({ ...formData, operadora: value })}>
                  <SelectTrigger className={errosValidacao.includes('Operadora') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecionar operadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERADORAS.map((op) => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Freshdesk Ticket */}
              <div>
                <label className="block text-sm font-medium mb-1">Freshdesk Ticket *</label>
                <Input
                  type="text"
                  placeholder="Ex: #12345"
                  value={formData.freshdesk}
                  onChange={(e) => setFormData({ ...formData, freshdesk: e.target.value })}
                  className={errosValidacao.includes('Freshdesk Ticket') ? 'border-red-500' : ''}
                />
              </div>

              {/* 6. Contato Local */}
              <div>
                <label className="block text-sm font-medium mb-1">Contato Local</label>
                <Input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={formData.contatoLocal}
                  onChange={(e) => setFormData({ ...formData, contatoLocal: e.target.value })}
                />
              </div>

              {/* 7. Data da Atividade */}
              <div>
                <label className="block text-sm font-medium mb-1">Data da Atividade</label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>

              {/* 8. Hora da Atividade */}
              <div>
                <label className="block text-sm font-medium mb-1">Hora da Atividade</label>
                <Input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                />
              </div>

              {/* 9. CEP */}
              <div>
                <label className="block text-sm font-medium mb-1">CEP *</label>
                <Input
                  type="text"
                  placeholder="00000-000"
                  maxLength={9}
                  value={formData.cep}
                  onChange={(e) => {
                    const cep = aplicarMascaraCEP(e.target.value);
                    setFormData({ ...formData, cep });
                  }}
                  onBlur={() => {
                    if (formData.cep.length === 9) {
                      handleBuscarCEP(formData.cep.replace('-', ''));
                    }
                  }}
                  className={errosValidacao.includes('CEP') ? 'border-red-500' : ''}
                />
              </div>

              {/* 10. Rua */}
              <div>
                <label className="block text-sm font-medium mb-1">Rua *</label>
                <Input
                  type="text"
                  value={formData.rua}
                  onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                  className={errosValidacao.includes('Rua') ? 'border-red-500' : ''}
                />
              </div>

              {/* 11. Número */}
              <div>
                <label className="block text-sm font-medium mb-1">Número *</label>
                <Input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className={errosValidacao.includes('Número') ? 'border-red-500' : ''}
                />
              </div>

              {/* 12. Complemento */}
              <div>
                <label className="block text-sm font-medium mb-1">Complemento</label>
                <Input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                />
              </div>

              {/* 13. Bairro */}
              <div>
                <label className="block text-sm font-medium mb-1">Bairro *</label>
                <Input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className={errosValidacao.includes('Bairro') ? 'border-red-500' : ''}
                />
              </div>

              {/* 14. Cidade */}
              <div>
                <label className="block text-sm font-medium mb-1">Cidade *</label>
                <Input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className={errosValidacao.includes('Cidade') ? 'border-red-500' : ''}
                />
              </div>

              {/* 15. UF */}
              <div>
                <label className="block text-sm font-medium mb-1">UF *</label>
                <Input
                  type="text"
                  maxLength={2}
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  className={errosValidacao.includes('UF') ? 'border-red-500' : ''}
                />
              </div>
            </div>

            {/* Botão Buscar Técnicos - Oculto para Analista */}
            {user?.role !== 'analista' && (
              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  onClick={handleAbrirBuscaTecnicos}
                  disabled={isGeocoding}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isGeocoding ? 'Obtendo coordenadas do endereço...' : 'Buscar Técnicos Próximos'}
                </Button>

                {/* Card de confirmação do Técnico Selecionado via Modal */}
                {tecnicoSelecionado && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                          Técnico Vinculado
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {tecnicoSelecionado.tec_nome}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTecnicoSelecionado(null)}
                      className="text-slate-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Botão Salvar */}
            <Button
              type="button"
              onClick={handleSalvar}
              disabled={salvando}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {salvando ? 'Salvando...' : 'Salvar Solicitação'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Modal de Busca de Técnicos Próximos */}
      <TechnicianSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        technicians={tecnicosData ?? []}
        isLoading={isLoadingTecnicos}
        currentTechnicianId={tecnicoSelecionado?.id}
        onSelectTechnician={(tec) => {
          setTecnicoSelecionado({ id: tec.id, tec_nome: tec.tec_nome });
          setIsModalOpen(false);
          toast.success(`Técnico ${tec.tec_nome} selecionado!`);
        }}
      />
    </div>
  );
}