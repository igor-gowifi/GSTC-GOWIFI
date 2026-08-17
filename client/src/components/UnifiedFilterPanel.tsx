'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

const STATUS_OPTIONS = ['Pendente', 'Agendado', 'Concluído', 'Improdutivo'];
const STATUS_DISPLAY: Record<string, string> = {
  'Pendente': 'Pendente',
  'Agendado': 'Agendado',
  'Concluído': 'Concluído',
  'Improdutivo': 'Improdutivo',
  'Cancelado': 'Cancelado'
};
const STATUS_VALUES: Record<string, string> = {
  'Pendente': 'pendente',
  'Agendado': 'agendado',
  'Concluído': 'concluído',
  'Improdutivo': 'improdutivo',
  'Cancelado': 'Cancelado'
};
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
const EMPRESAS_PARCEIRAS = [
  'infrafrele',
  'Cobe',
  'luciano-team',
  'findup',
  'gowifi'
];
const EMPRESAS_DISPLAY: Record<string, string> = {
  'infrafrele': 'Infrafrele',
  'Cabe':'Cobe',
  'luciano-team': 'Luciano-team',
  'findup': 'Findup',
  'gowifi': 'Gowifi'
};
const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];
const ANOS = Array.from({ length: 10 }, (_, i) => (2026 + i).toString());

const SEMANAS = [
  { value: 'esta-semana', label: 'Esta semana' },
  { value: 'semana-passada', label: 'Semana passada' },
  { value: 'semana-que-vem', label: 'Semana que vem' },
  { value: '1a-semana', label: '1ª semana do mês' },
  { value: '2a-semana', label: '2ª semana do mês' },
  { value: '3a-semana', label: '3ª semana do mês' },
  { value: '4a-semana', label: '4ª semana do mês' },
];

interface UnifiedFilterPanelProps {
  filters: {
    searchTerm?: string;
    status?: string;
    projeto?: string;
    servico?: string;
    cidade?: string;
    uf?: string;
    empresaParceira?: string;
    semana?: string;
    mes?: string;
    ano?: string;
    sortBy?: string;
    dataCriacaoStart?: string;
    dataCriacaoEnd?: string;
    dataAtividadeStart?: string;
    dataAtividadeEnd?: string;
    dataConclusaoStart?: string;
    dataConclusaoEnd?: string;
  };
  onFilterChange: (filters: any) => void;
  onExport?: () => void;
  currentSortBy?: string;
  showExportButton?: boolean;
}

export function UnifiedFilterPanel({ filters, onFilterChange, onExport, currentSortBy, showExportButton = false }: UnifiedFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch all solicitacoes to extract unique values dynamically
  const { data: allSolicitacoes = [] } = trpc.solicitacoes.list.useQuery();

  // Extract unique values from data
  const projetos = useMemo(() => {
    const unique = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_projeto).filter(Boolean)));
    return unique.length > 0 ? unique : GRUPOS_PROJETO;
  }, [allSolicitacoes]);

  const servicos = useMemo(() => {
    return Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_servico).filter(Boolean)));
  }, [allSolicitacoes]);

  const ufs = useMemo(() => {
    return Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_uf).filter(Boolean))).sort();
  }, [allSolicitacoes]);

  // Exibe apenas as cidades vinculadas ao UF selecionado (se houver UF ativo)
  const cidades = useMemo(() => {
    const solicitacoesFiltradas = filters.uf
      ? allSolicitacoes.filter((s: any) => s.solic_uf === filters.uf)
      : allSolicitacoes;

    return Array.from(new Set(solicitacoesFiltradas.map((s: any) => s.solic_cidade).filter(Boolean))).sort();
  }, [allSolicitacoes, filters.uf]);

  const empresas = useMemo(() => {
    const unique = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_empresa_parceira).filter(Boolean)));
    return unique.length > 0 ? unique : EMPRESAS_PARCEIRAS;
  }, [allSolicitacoes]);

  const handleUfChange = (selectedUf: string) => {
    const newUf = selectedUf === 'all' ? '' : selectedUf;
    onFilterChange({
      ...filters,
      uf: newUf,
      cidade: '', // Reseta o município para evitar incoerência
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      searchTerm: '',
      status: '',
      projeto: '',
      servico: '',
      cidade: '',
      uf: '',
      empresaParceira: '',
      semana: '',
      mes: '',
      ano: '',
      sortBy: '',
      dataCriacaoStart: '',
      dataCriacaoEnd: '',
      dataAtividadeStart: '',
      dataAtividadeEnd: '',
      dataConclusaoStart: '',
      dataConclusaoEnd: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="sticky top-4 h-fit">
      <Card className="w-80 bg-background border border-border h-full flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Filtros</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-foreground/60 hover:text-foreground"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {isExpanded && (
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Context Info */}
            {currentSortBy && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-1 font-semibold">Filtros baseados em:</p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-200">
                  {currentSortBy.includes('atividade') ? 'Data de Atividade' : currentSortBy.includes('conclusao') ? 'Data de Conclusão' : 'Data de Criação'}
                </p>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => onFilterChange({ ...filters, status: value === 'all' ? '' : value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUS_OPTIONS.map((status: string) => (
                    <SelectItem key={status} value={STATUS_VALUES[status]}>{STATUS_DISPLAY[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Projeto */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Projeto</label>
              <Select value={filters.projeto || 'all'} onValueChange={(value) => onFilterChange({ ...filters, projeto: value === 'all' ? '' : value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {projetos.map(projeto => (
                    <SelectItem key={projeto} value={projeto}>{projeto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Serviço */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Serviço</label>
              <Select value={filters.servico || 'all'} onValueChange={(value) => onFilterChange({ ...filters, servico: value === 'all' ? '' : value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {servicos.map(servico => (
                    <SelectItem key={servico} value={servico}>{servico}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* UF */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">UF</label>
              <Select value={filters.uf || 'all'} onValueChange={handleUfChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {ufs.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Município / Cidade */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Município</label>
              <Select value={filters.cidade || 'all'} onValueChange={(value) => onFilterChange({ ...filters, cidade: value === 'all' ? '' : value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {cidades.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empresa Parceira */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Empresa Parceira</label>
              <Select value={filters.empresaParceira || 'all'} onValueChange={(value) => onFilterChange({ ...filters, empresaParceira: value === 'all' ? '' : value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {empresas.map(empresa => (
                    <SelectItem key={empresa} value={empresa}>{EMPRESAS_DISPLAY[empresa] || empresa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semana */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Semana</label>
              <Select value={filters.semana || 'all'} onValueChange={(value) => onFilterChange({ ...filters, semana: value === 'all' ? '' : value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar semana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {SEMANAS.map(semana => (
                    <SelectItem key={semana.value} value={semana.value}>{semana.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mês */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Mês</label>
              <Select value={filters.mes || 'all'} onValueChange={(value) => onFilterChange({ ...filters, mes: value === 'all' ? '' : value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {MESES.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ano */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Ano</label>
              <Select value={filters.ano || 'all'} onValueChange={(value) => onFilterChange({ ...filters, ano: value === 'all' ? '' : value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ANOS.map(ano => (
                    <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botões */}
            <div className="pt-4 border-t border-border space-y-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
              {showExportButton && onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="w-full"
                >
                  Exportar
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}