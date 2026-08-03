import { useState, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save, Trash2, Edit3, X } from 'lucide-react';
import { toast } from 'sonner';
import { aplicarMascaraCPF, aplicarMascaraTelefone, aplicarMascaraRG, aplicarMascaraCEP } from '@/utils/masks';
import { buscarEnderecoPorCEP } from '@/utils/cepLookup';
import { geocodeAddress } from '@/utils/geocodeAddress';
import { Tecnico, EMPRESAS_PARCEIRAS } from '@/types';
import { trpc } from '@/lib/trpc';
import { EquipmentHistoryTab } from '@/components/EquipmentHistoryTab';

export default function DetalheTecnico() {
  const [, params] = useRoute('/tecnicos/:id');
  const [, setLocation] = useLocation();
  const tecnicoId = params?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [geocodificando, setGeocodificando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Fetch técnico data
  const { data: tecnicos = [] } = trpc.tecnicos.list.useQuery();
  const updateMutation = trpc.tecnicos.update.useMutation();
  const deleteMutation = trpc.tecnicos.delete.useMutation();

  // Transform and find current técnico
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

  const tecnico = transformedTecnicos.find(t => t.id === tecnicoId);

  const [formData, setFormData] = useState({
    tecNome: tecnico?.tecNome || '',
    tecTelefone: tecnico?.tecTelefone || '',
    tecCPF: tecnico?.tecCPF || '',
    tecRG: tecnico?.tecRG || '',
    tecCEP: tecnico?.tecCEP || '',
    tecRua: tecnico?.tecRua || '',
    tecNumero: tecnico?.tecNumero || '',
    tecComplemento: tecnico?.tecComplemento || '',
    tecBairro: tecnico?.tecBairro || '',
    tecCidade: tecnico?.tecCidade || '',
    tecUF: tecnico?.tecUF || '',
    tecEmpresaParceira: tecnico?.tecEmpresaParceira || '',
    tecObservacoes: tecnico?.tecObservacoes || '',
    tecAvaliacaoPontualidade: tecnico?.tecAvaliacaoPontualidade || 0,
    tecAvaliacaoFerramentas: tecnico?.tecAvaliacaoFerramentas || 0,
    tecAvaliacaoProdutividade: tecnico?.tecAvaliacaoProdutividade || 0,
    tecAvaliacaoConhecimento: tecnico?.tecAvaliacaoConhecimento || 0,
    tecAvaliacaoFlexibilidade: tecnico?.tecAvaliacaoFlexibilidade || 0
  });

  const handleBuscarCEP = async (cep: string) => {
    if (cep.length !== 8) return;
    setBuscandoCEP(true);
    try {
      const endereco = await buscarEnderecoPorCEP(cep);
      if (endereco) {
        setFormData({
          ...formData,
          tecRua: endereco.logradouro || '',
          tecBairro: endereco.bairro || '',
          tecCidade: endereco.localidade || '',
          tecUF: endereco.uf || ''
        });
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setBuscandoCEP(false);
    }
  };

  const handleSalvar = async () => {
    if (!formData.tecNome || !formData.tecTelefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSalvando(true);
    try {
      setGeocodificando(true);
      const coords = await geocodeAddress({
        tec_cep: formData.tecCEP.replace(/\D/g, ''),
        tec_rua: formData.tecRua,
        tec_numero: formData.tecNumero,
        tec_bairro: formData.tecBairro,
        tec_cidade: formData.tecCidade,
        tec_uf: formData.tecUF
      });

      await updateMutation.mutateAsync({
        id: tecnicoId!,
        tec_nome: formData.tecNome,
        tec_telefone: formData.tecTelefone,
        tec_cpf: formData.tecCPF,
        tec_rg: formData.tecRG,
        tec_cep: formData.tecCEP.replace(/\D/g, ''),
        tec_rua: formData.tecRua,
        tec_numero: formData.tecNumero,
        tec_complemento: formData.tecComplemento,
        tec_bairro: formData.tecBairro,
        tec_cidade: formData.tecCidade,
        tec_uf: formData.tecUF,
        tec_empresa_parceira: formData.tecEmpresaParceira,
        tec_observacoes: formData.tecObservacoes,
        tec_avaliacao_pontualidade: formData.tecAvaliacaoPontualidade,
        tec_avaliacao_ferramentas: formData.tecAvaliacaoFerramentas,
        tec_avaliacao_produtividade: formData.tecAvaliacaoProdutividade,
        tec_avaliacao_conhecimento: formData.tecAvaliacaoConhecimento,
        tec_avaliacao_flexibilidade: formData.tecAvaliacaoFlexibilidade,
        tec_avaliacao: Math.round(((formData.tecAvaliacaoPontualidade || 0) + (formData.tecAvaliacaoFerramentas || 0) + (formData.tecAvaliacaoProdutividade || 0) + (formData.tecAvaliacaoConhecimento || 0) + (formData.tecAvaliacaoFlexibilidade || 0)) / 5 * 100) / 100,
        ...(coords && { lat: coords.lat, long: coords.lng })
      });

      toast.success('Técnico atualizado com sucesso');
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao salvar técnico:', err);
      toast.error('Erro ao salvar técnico');
    } finally {
      setSalvando(false);
      setGeocodificando(false);
    }
  };

  const handleDeletar = async () => {
    if (!confirm(`Tem certeza que deseja deletar o técnico ${tecnico?.tecNome}?`)) return;
    try {
      await deleteMutation.mutateAsync({ id: tecnicoId! });
      toast.success('Técnico deletado com sucesso');
      setLocation('/tecnicos');
    } catch (err) {
      console.error('Erro ao deletar técnico:', err);
      toast.error('Erro ao deletar técnico');
    }
  };

  if (!tecnico) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/tecnicos')}
              className="gap-2"
            >
              <ArrowLeft size={20} />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">{tecnico.tecNome}</h1>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit3 size={18} />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeletar}
                  className="gap-2"
                >
                  <Trash2 size={18} />
                  Deletar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="gap-2"
                >
                  <X size={18} />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSalvar}
                  disabled={salvando || geocodificando}
                  className="gap-2"
                >
                  <Save size={18} />
                  {salvando || geocodificando ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeletar}
                  className="gap-2"
                >
                  <Trash2 size={18} />
                  Deletar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Informações Pessoais */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Informações Pessoais</h2>
            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                {isEditing ? (
                  <Input
                    value={formData.tecNome}
                    onChange={(e) => setFormData({...formData, tecNome: e.target.value})}
                    placeholder="Nome do técnico"
                  />
                ) : (
                  <p className="text-foreground">{formData.tecNome}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium mb-1">Telefone *</label>
                {isEditing ? (
                  <Input
                    value={formData.tecTelefone}
                    onChange={(e) => setFormData({
                      ...formData,
                      tecTelefone: aplicarMascaraTelefone(e.target.value)
                    })}
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <p className="text-foreground">{formData.tecTelefone}</p>
                )}
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium mb-1">CPF</label>
                {isEditing ? (
                  <Input
                    value={formData.tecCPF}
                    onChange={(e) => setFormData({
                      ...formData,
                      tecCPF: aplicarMascaraCPF(e.target.value)
                    })}
                    placeholder="000.000.000-00"
                  />
                ) : (
                  <p className="text-foreground">{formData.tecCPF || '-'}</p>
                )}
              </div>

              {/* RG */}
              <div>
                <label className="block text-sm font-medium mb-1">RG</label>
                {isEditing ? (
                  <Input
                    value={formData.tecRG}
                    onChange={(e) => setFormData({
                      ...formData,
                      tecRG: aplicarMascaraRG(e.target.value)
                    })}
                    placeholder="00.000.000-0"
                  />
                ) : (
                  <p className="text-foreground">{formData.tecRG || '-'}</p>
                )}
              </div>

              {/* Empresa Parceira */}
              <div>
                <label className="block text-sm font-medium mb-1">Empresa Parceira</label>
                {isEditing ? (
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
                ) : (
                  <p className="text-foreground">{formData.tecEmpresaParceira || '-'}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Endereço */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Endereço</h2>
            <div className="space-y-4">
              {/* CEP */}
              <div>
                <label className="block text-sm font-medium mb-1">CEP</label>
                {isEditing ? (
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
                ) : (
                  <p className="text-foreground">{formData.tecCEP || '-'}</p>
                )}
              </div>

              {/* Rua e Número */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Rua</label>
                  {isEditing ? (
                    <Input
                      value={formData.tecRua}
                      onChange={(e) => setFormData({...formData, tecRua: e.target.value})}
                      placeholder="Rua"
                    />
                  ) : (
                    <p className="text-foreground">{formData.tecRua || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número</label>
                  {isEditing ? (
                    <Input
                      value={formData.tecNumero}
                      onChange={(e) => setFormData({...formData, tecNumero: e.target.value})}
                      placeholder="Número"
                    />
                  ) : (
                    <p className="text-foreground">{formData.tecNumero || '-'}</p>
                  )}
                </div>
              </div>

              {/* Complemento */}
              <div>
                <label className="block text-sm font-medium mb-1">Complemento</label>
                {isEditing ? (
                  <Input
                    value={formData.tecComplemento}
                    onChange={(e) => setFormData({...formData, tecComplemento: e.target.value})}
                    placeholder="Apto, sala, etc"
                  />
                ) : (
                  <p className="text-foreground">{formData.tecComplemento || '-'}</p>
                )}
              </div>

              {/* Bairro, Cidade, UF */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Bairro</label>
                  {isEditing ? (
                    <Input
                      value={formData.tecBairro}
                      onChange={(e) => setFormData({...formData, tecBairro: e.target.value})}
                      placeholder="Bairro"
                    />
                  ) : (
                    <p className="text-foreground">{formData.tecBairro || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  {isEditing ? (
                    <Input
                      value={formData.tecCidade}
                      onChange={(e) => setFormData({...formData, tecCidade: e.target.value})}
                      placeholder="Cidade"
                    />
                  ) : (
                    <p className="text-foreground">{formData.tecCidade || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">UF</label>
                  {isEditing ? (
                    <Input
                      value={formData.tecUF}
                      onChange={(e) => setFormData({...formData, tecUF: e.target.value.toUpperCase()})}
                      placeholder="SP"
                      maxLength={2}
                    />
                  ) : (
                    <p className="text-foreground">{formData.tecUF || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Avaliação */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Avaliação do Técnico</h2>
            <div className="space-y-4">
              {/* Pontualidade */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Pontualidade</label>
                  <span className="text-sm text-gray-600">{formData.tecAvaliacaoPontualidade.toFixed(1)}</span>
                </div>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoPontualidade}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoPontualidade: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                ) : (
                  <div className="text-foreground">{formData.tecAvaliacaoPontualidade.toFixed(1)}</div>
                )}
              </div>

              {/* Ferramentas */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Ferramentas</label>
                  <span className="text-sm text-gray-600">{formData.tecAvaliacaoFerramentas.toFixed(1)}</span>
                </div>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoFerramentas}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoFerramentas: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                ) : (
                  <div className="text-foreground">{formData.tecAvaliacaoFerramentas.toFixed(1)}</div>
                )}
              </div>

              {/* Produtividade */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Produtividade</label>
                  <span className="text-sm text-gray-600">{formData.tecAvaliacaoProdutividade.toFixed(1)}</span>
                </div>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoProdutividade}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoProdutividade: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                ) : (
                  <div className="text-foreground">{formData.tecAvaliacaoProdutividade.toFixed(1)}</div>
                )}
              </div>

              {/* Conhecimento */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Conhecimento</label>
                  <span className="text-sm text-gray-600">{formData.tecAvaliacaoConhecimento.toFixed(1)}</span>
                </div>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoConhecimento}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoConhecimento: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                ) : (
                  <div className="text-foreground">{formData.tecAvaliacaoConhecimento.toFixed(1)}</div>
                )}
              </div>

              {/* Flexibilidade */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Flexibilidade</label>
                  <span className="text-sm text-gray-600">{formData.tecAvaliacaoFlexibilidade.toFixed(1)}</span>
                </div>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.tecAvaliacaoFlexibilidade}
                    onChange={(e) => setFormData({...formData, tecAvaliacaoFlexibilidade: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                ) : (
                  <div className="text-foreground">{formData.tecAvaliacaoFlexibilidade.toFixed(1)}</div>
                )}
              </div>

              {/* Média calculada */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded dark:bg-blue-900 dark:border-blue-700">
                <div className="flex justify-between items-center">
                  <span className="font-semibold dark:text-blue-100">Avaliação Média:</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
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
          </Card>

          {/* Observações */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Observações</h2>
            {isEditing ? (
              <textarea
                value={formData.tecObservacoes}
                onChange={(e) => setFormData({...formData, tecObservacoes: e.target.value})}
                placeholder="Observações"
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            ) : (
              <p className="text-foreground">{formData.tecObservacoes || '-'}</p>
            )}
          </Card>

          {/* Equipamentos do Técnico */}
          <EquipmentHistoryTab tecnicoId={tecnicoId!} tecnicoNome={tecnico.tecNome} />
        </div>
      </div>
    </div>
  );
}
