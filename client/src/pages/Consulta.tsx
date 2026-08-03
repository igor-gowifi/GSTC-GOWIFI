import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Star, Phone, MapPin, Wrench, AlertCircle, Search, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { aplicarMascaraCEP } from '@/utils/masks';
import { buscarEnderecoPorCEP, converterEnderecoViaCEP } from '@/utils/cepLookup';
import { geocodeAddress } from '@/utils/geocodeAddress';
import { toast } from 'sonner';
import { TechnicianSearchModal } from '@/components/TechnicianSearchModal';

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

export default function Consulta() {
  const [formData, setFormData] = useState({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
  });

  const [tecnicosEncontrados, setTecnicosEncontrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [erro, setErro] = useState('');
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [queryCoords, setQueryCoords] = useState({ latitude: 0, longitude: 0 });

  // Use query with dynamic coordinates
  const { data: tecnicosQuery } = trpc.solicitacoes.findNearestTecnicos.useQuery(
    queryCoords,
    { enabled: queryCoords.latitude !== 0 && queryCoords.longitude !== 0 }
  );

  // Auto-complete de endereço quando CEP é digitado (sem formatação)
  useEffect(() => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarEnderecoCEP(cepLimpo);
    }
  }, [formData.cep]);

  // Update results when query data changes
  useEffect(() => {
    if (tecnicosQuery && tecnicosQuery.length > 0) {
      setTecnicosEncontrados(tecnicosQuery);
      setShowResults(true);
      setErro('');
      toast.success(`${tecnicosQuery.length} técnico(s) encontrado(s)!`);
      setLoading(false);
    }
  }, [tecnicosQuery]);

  const buscarEnderecoCEP = async (cep: string) => {
    try {
      setBuscandoCEP(true);
      const endereco = await buscarEnderecoPorCEP(cep);
      
      if (endereco) {
        const enderecoConvertido = converterEnderecoViaCEP(endereco);
        setFormData(prev => ({
          ...prev,
          rua: enderecoConvertido.rua,
          bairro: enderecoConvertido.bairro,
          cidade: enderecoConvertido.cidade,
          uf: enderecoConvertido.uf
        }));
        setErro('');
        toast.success('Endereço preenchido automaticamente!');
      } else {
        setErro('CEP não encontrado. Preencha manualmente.');
        toast.error('CEP não encontrado');
      }
    } catch (err) {
      console.error('Erro ao buscar endereço:', err);
      setErro('Erro ao buscar CEP. Tente novamente.');
      toast.error('Erro ao buscar CEP');
    } finally {
      setBuscandoCEP(false);
    }
  };

  const validarEndereco = (): boolean => {
    if (!formData.cep || !formData.rua || !formData.bairro || !formData.cidade || !formData.uf) {
      setErro('Preencha todos os campos obrigatórios (CEP, Rua, Bairro, Cidade, UF)');
      return false;
    }
    setErro('');
    return true;
  };

  const buscarTecnicosProximos = async () => {
    console.log('[Consulta] buscarTecnicosProximos called');
    if (!validarEndereco()) {
      console.warn('[Consulta] Endereco validation failed');
      return;
    }

    try {
      setLoading(true);
      setShowResults(false);

      // Geocodificar o endereço usando o utility
      console.log('[Consulta] Geocoding address...');
      const coords = await geocodeAddress({
        tec_cep: formData.cep,
        tec_rua: formData.rua,
        tec_numero: formData.numero,
        tec_bairro: formData.bairro,
        tec_cidade: formData.cidade,
        tec_uf: formData.uf
      });

      if (!coords) {
        console.warn('[Consulta] No geocoding results');
        setErro('Não foi possível geocodificar o endereço. Tente novamente.');
        setLoading(false);
        return;
      }

      console.log('[Consulta] Geocoded coordinates:', { lat: coords.lat, lng: coords.lng });

      // Set coordinates to trigger query
      console.log('[Consulta] Setting query coordinates');
      setQueryCoords({ latitude: coords.lat, longitude: coords.lng });
    } catch (err) {
      console.error('[Consulta] Erro ao buscar técnicos:', err);
      setErro('Erro ao buscar técnicos próximos. Tente novamente.');
      toast.error('Erro ao buscar técnicos');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = aplicarMascaraCEP(e.target.value);
    setFormData(prev => ({ ...prev, cep: value }));
  };

  const handleUFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase().slice(0, 2) }));
  };

  const abrirNoMapa = (tecnico: any) => {
    const enderecoTecnico = `${tecnico.tec_rua}, ${tecnico.tec_numero}, ${tecnico.tec_bairro}, ${tecnico.tec_cidade}, ${tecnico.tec_uf}`;
    const enderecoConsulta = `${formData.rua}, ${formData.numero}, ${formData.bairro}, ${formData.cidade}, ${formData.uf}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(enderecoConsulta)}&destination=${encodeURIComponent(enderecoTecnico)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Consulta de Técnicos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Busque os técnicos mais próximos de um endereço</p>
        </div>



        {/* Formulário */}
        <Card className="p-4 md:p-6 mb-6">
          <div className="space-y-4">
            {/* Erro */}
            {erro && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm ml-2">{erro}</AlertDescription>
              </Alert>
            )}

            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                CEP <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  name="cep"
                  placeholder="00000-000"
                  maxLength={9}
                  value={formData.cep}
                  onChange={handleCEPChange}
                  disabled={buscandoCEP}
                  className="text-sm"
                />
                {buscandoCEP && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Endereço - Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rua <span className="text-destructive">*</span>
                </label>
                <Input
                  name="rua"
                  placeholder="Digite a rua"
                  value={formData.rua}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Número
                </label>
                <Input
                  name="numero"
                  placeholder="Ex: 123"
                  value={formData.numero}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Complemento
                </label>
                <Input
                  name="complemento"
                  placeholder="Ex: Apto 101"
                  value={formData.complemento}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bairro <span className="text-destructive">*</span>
                </label>
                <Input
                  name="bairro"
                  placeholder="Digite o bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cidade <span className="text-destructive">*</span>
                </label>
                <Input
                  name="cidade"
                  placeholder="Digite a cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  UF <span className="text-destructive">*</span>
                </label>
                <Input
                  name="uf"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.uf}
                  onChange={handleUFChange}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Botão Buscar */}
            <Button
              onClick={buscarTecnicosProximos}
              disabled={loading}
              className="w-full mt-4"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando técnicos...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Técnicos Próximos
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Resultados */}
        {showResults && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Técnicos Encontrados ({tecnicosEncontrados.length})</h2>
            
            {tecnicosEncontrados.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Nenhum técnico encontrado na região.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tecnicosEncontrados.map((tecnico) => (
                  <Card key={tecnico.id} className="p-4 md:p-6 hover:shadow-lg transition">
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
                          onClick={() => abrirNoMapa(tecnico)}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
