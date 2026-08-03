import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Search, Save, MapPin, AlertTriangle, Star, Phone, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { buscarEnderecoPorCEP, converterEnderecoViaCEP } from '@/utils/cepLookup';
import { geocodeAddress } from '@/utils/geocodeAddress';
import { aplicarMascaraCEP, aplicarMascaraTelefone } from '@/utils/masks';

import { Badge } from '@/components/ui/badge';

const GRUPOS_PROJETO = [
  'WiFi Seguro',
  'Projetos Especiais',
  'Bradesco',
  'Bradesco - Fase2',
  'Bradesco - Migrações',
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

// Calcular distância em km usando Haversine
const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Arredondar para 1 casa decimal
};

export default function NovaSolicitacao() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
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

  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [buscandoTecnicos, setBuscandoTecnicos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tecnicosEncontrados, setTecnicosEncontrados] = useState<any[]>([]);
  const [mostraTecnicos, setMostraTecnicos] = useState(false);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState<string | null>(null);
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lon: number } | null>(null);
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);

  const createMutation = trpc.solicitacoes.create.useMutation();
  const [queryCoords, setQueryCoords] = useState({ latitude: 0, longitude: 0 });
  const { data: tecnicosQuery } = trpc.solicitacoes.findNearestTecnicos.useQuery(
    queryCoords,
    { enabled: queryCoords.latitude !== 0 && queryCoords.longitude !== 0 }
  );

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
      { campo: 'contatoLocal', label: 'Contato Local' },
      { campo: 'data', label: 'Data da Atividade' },
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

  // Buscar técnicos próximos
  const buscarProximosTecnicos = async () => {
    if (!validarFormulario()) return;

    setBuscandoTecnicos(true);
    try {
      // Geocodificar endereço usando o utility
      const coords = await geocodeAddress({
        tec_cep: formData.cep,
        tec_rua: formData.rua,
        tec_numero: formData.numero,
        tec_bairro: formData.bairro,
        tec_cidade: formData.cidade,
        tec_uf: formData.uf
      });

      if (!coords) {
        toast.error('Não foi possível geocodificar o endereço');
        setBuscandoTecnicos(false);
        return;
      }

      setCoordenadas({ lat: coords.lat, lon: coords.lng });

      // Buscar técnicos próximos via query
      setQueryCoords({ latitude: coords.lat, longitude: coords.lng });

      toast.success('Técnicos próximos encontrados');
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
      toast.error('Erro ao buscar técnicos próximos');
    } finally {
      setBuscandoTecnicos(false);
    }
  };

  // Handle tecnicosQuery update
  useEffect(() => {
    if (tecnicosQuery && tecnicosQuery.length > 0 && coordenadas) {
      // Adicionar distância a cada técnico
      const tecnicosComDistancia = (tecnicosQuery || []).map((tecnico: any) => {
        // Converter decimal strings para números se necessário
        const tecLat = typeof tecnico.tec_latitude === 'string' ? parseFloat(tecnico.tec_latitude) : 
                       typeof tecnico.latitude === 'string' ? parseFloat(tecnico.latitude) : 
                       (tecnico.tec_latitude || tecnico.latitude || 0);
        const tecLon = typeof tecnico.tec_longitude === 'string' ? parseFloat(tecnico.tec_longitude) : 
                       typeof tecnico.longitude === 'string' ? parseFloat(tecnico.longitude) : 
                       (tecnico.tec_longitude || tecnico.longitude || 0);
        
        return {
          ...tecnico,
          distancia: tecLat && tecLon ? calcularDistancia(coordenadas.lat, coordenadas.lon, tecLat, tecLon) : null,
        };
      });

      // Filtrar técnicos sem coordenadas e ordenar por distância
      const tecnicosComDistanciaValida = tecnicosComDistancia
        .filter(t => t.distancia !== null)
        .sort((a, b) => (a.distancia || 0) - (b.distancia || 0));

      setTecnicosEncontrados(tecnicosComDistanciaValida);
      setMostraTecnicos(true);

      if (tecnicosComDistancia.length > 0) {
        toast.success(`${tecnicosComDistancia.length} técnico(s) encontrado(s)`);
      } else {
        toast.warning('Nenhum técnico encontrado próximo a este endereço');
      }
    }
  }, [tecnicosQuery, coordenadas]);

  // Abrir Google Maps
  const abrirMapa = (tecnico: any) => {
    if (!coordenadas) return;
    const tecLat = tecnico.tec_latitude;
    const tecLon = tecnico.tec_longitude;
    const url = `https://www.google.com/maps/dir/${coordenadas.lat},${coordenadas.lon}/${tecLat},${tecLon}`;
    window.open(url, '_blank');
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
      const resultado = await createMutation.mutateAsync({
        nomeAtividade: formData.nomeAtividade,
        grupoProjeto: formData.grupoProjeto,
        servico: formData.servico,
        operadora: formData.operadora,
        freshdeskTicket: formData.freshdesk,
        contatoLocal: formData.contatoLocal,
        dataAtividade: formData.data,
        horaAtividade: formData.hora || '',
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento || '',
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        tecnicoId: tecnicoSelecionado || null,
      });

      toast.success('Solicitação criada com sucesso!');
      
      // Navegar para aba Solicitações
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
      setTecnicosEncontrados([]);
      setMostraTecnicos(false);
      setTecnicoSelecionado(null);
      setCoordenadas(null);
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
              <label className="block text-sm font-medium mb-1">Contato Local *</label>
              <Input
                type="text"
                placeholder="Ex: João Silva"
                value={formData.contatoLocal}
                onChange={(e) => setFormData({ ...formData, contatoLocal: e.target.value })}
                className={errosValidacao.includes('Contato Local') ? 'border-red-500' : ''}
              />
            </div>

            {/* 7. Data da Atividade */}
            <div>
              <label className="block text-sm font-medium mb-1">Data da Atividade *</label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className={errosValidacao.includes('Data da Atividade') ? 'border-red-500' : ''}
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
              <Button
                type="button"
                onClick={buscarProximosTecnicos}
                disabled={buscandoTecnicos}
                className="w-full"
                size="lg"
              >
                <Search className="w-4 h-4 mr-2" />
                {buscandoTecnicos ? 'Buscando...' : 'Buscar Técnicos Próximos'}
              </Button>
            )}

            {/* Lista de Técnicos */}
            {mostraTecnicos && tecnicosEncontrados.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <h3 className="font-semibold text-lg">Técnicos Próximos Encontrados ({tecnicosEncontrados.length})</h3>
                <div className="grid gap-4">
                  {tecnicosEncontrados.map((tecnico) => (
                    <Card
                      key={tecnico.id}
                      className={`p-4 md:p-6 hover:shadow-lg transition cursor-pointer border-2 ${
                        tecnicoSelecionado === tecnico.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-400 shadow-md'
                          : 'border-transparent'
                      }`}
                      onClick={() => setTecnicoSelecionado(tecnico.id)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Info Técnico */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{tecnico.tec_nome}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-semibold text-blue-600">
                                {(tecnico.tec_avaliacao || 0).toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground">/5.0</span>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{tecnico.tec_telefone}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {tecnico.tec_empresa_parceira && (
                              <Badge variant="secondary">{tecnico.tec_empresa_parceira}</Badge>
                            )}
                          </div>
                        </div>

                        {/* Endereço e Distância */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="text-sm">
                              <p>{tecnico.tec_rua}, {tecnico.tec_numero}</p>
                              <p className="text-muted-foreground">{tecnico.tec_bairro}, {tecnico.tec_cidade} - {tecnico.tec_uf}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground mb-2">Distância aproximada:</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {tecnico.distancia ? `${tecnico.distancia.toFixed(1)} km` : 'N/A'}
                            </p>
                          </div>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirMapa(tecnico);
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Ver no Mapa
                          </Button>
                        </div>
                      </div>

                      {tecnico.tec_observacoes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground"><strong>Observações:</strong> {tecnico.tec_observacoes}</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {mostraTecnicos && tecnicosEncontrados.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800">Nenhum técnico encontrado próximo a este endereço.</p>
                </div>
              </div>
            )}

            {/* Botão Salvar */}
            <Button
              type="button"
              onClick={handleSalvar}
              disabled={salvando || buscandoTecnicos}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {salvando ? 'Salvando...' : 'Salvar Solicitação'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
