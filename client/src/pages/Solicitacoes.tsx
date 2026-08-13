import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useFilters } from '@/hooks/useFilters';
import { UnifiedFilterPanel } from '@/components/UnifiedFilterPanel';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { formatDatePtBr, formatTimePtBr } from '@/lib/dateFormatter';
import { useAuth } from '@/_core/hooks/useAuth';
import Fuse from 'fuse.js';

const ITEMS_PER_PAGE = 50;

type SortOption = 'data-criacao-desc' | 'data-criacao-asc' | 'data-atividade-desc' | 'data-atividade-asc' | 'data-conclusao-desc' | 'data-conclusao-asc' | 'status-asc' | 'status-desc';

// Função utilitária para checar se a solicitação está agendada e em atraso (dia anterior a hoje)
const isSolicitacaoAtrasada = (status?: string, dataAtividadeStr?: string | null): boolean => {
  if (!status || !dataAtividadeStr) return false;
  
  const normalizedStatus = status.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalizedStatus !== 'agendado') return false;

  // Extrai apenas os números da data YYYY-MM-DD para evitar alteração de fuso horário (UTC)
  const parts = dataAtividadeStr.split('T')[0].split('-');
  if (parts.length < 3) return false;

  const ano = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10) - 1; // Mês em JS vai de 0 a 11
  const dia = parseInt(parts[2], 10);

  // Cria a data no fuso local exato
  const dataAtividade = new Date(ano, mes, dia, 0, 0, 0, 0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return dataAtividade < hoje;
};

export default function Solicitacoes() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('data-criacao-desc');
  const [, navigate] = useLocation();
  const { filters, updateFilter, clearFilters, getActiveFilterCount, getActiveFilters } = useFilters();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm || '');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm || '');
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  // Fetch filtered solicitacoes (without searchTerm - we'll filter client-side with Fuse)
  const { data: filteredSolicitacoes = [], isLoading } = trpc.solicitacoes.filter.useQuery(
    {
      searchTerm: '', // Empty search - we'll use Fuse.js on client
      status: filters.status || '',
      projeto: filters.projeto || '',
      servico: filters.servico || '',
      dia: filters.dia as any,
      semana: filters.semana as any,
      sortBy: sortBy || '',
      mes: filters.mes || '',
      ano: filters.ano || '',
      empresaParceira: filters.empresaParceira || '',
      dataAtividadeStart: filters.dataAtividadeStart || '',
      dataAtividadeEnd: filters.dataAtividadeEnd || '',
      dataCriacaoStart: filters.dataCriacaoStart || '',
      dataCriacaoEnd: filters.dataCriacaoEnd || '',
      dataConclusaoStart: filters.dataConclusaoStart || '',
      dataConclusaoEnd: filters.dataConclusaoEnd || '',
    }
  );

  // Get all solicitacoes for extracting unique values
  const { data: allSolicitacoes = [] } = trpc.solicitacoes.list.useQuery();

  // Extract unique projects and statuses
  const projetos = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_projeto).filter(Boolean)));
  const statuses = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_status).filter(Boolean)));
  const empresas = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_empresa_parceira).filter(Boolean)));
  const servicos = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_servico).filter(Boolean)));

  // Fuse.js fuzzy search
  const fuseSearchResults = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 1) {
      return filteredSolicitacoes;
    }

    const fuse = new Fuse(filteredSolicitacoes, {
      keys: [
        { name: 'solic_nome', weight: 0.4 },
        { name: 'solic_projeto', weight: 0.3 },
        { name: 'solic_servico', weight: 0.2 },
        { name: 'solic_freshdesk', weight: 0.2 },
        { name: 'solic_contato_local', weight: 0.1 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
    });

    return fuse.search(debouncedSearchTerm).map((result) => result.item);
  }, [filteredSolicitacoes, debouncedSearchTerm]);

  // Sorting function
  const sortedSolicitacoes = useMemo(() => {
    const sorted = [...fuseSearchResults];
    switch (sortBy) {
      case 'data-criacao-desc':
        return sorted.sort((a, b) => new Date(b.solic_data_criacao || '').getTime() - new Date(a.solic_data_criacao || '').getTime());
      case 'data-criacao-asc':
        return sorted.sort((a, b) => new Date(a.solic_data_criacao || '').getTime() - new Date(b.solic_data_criacao || '').getTime());
      case 'data-atividade-desc':
        return sorted.sort((a, b) => new Date(b.solic_data_atividade || '').getTime() - new Date(a.solic_data_atividade || '').getTime());
      case 'data-atividade-asc':
        return sorted.sort((a, b) => new Date(a.solic_data_atividade || '').getTime() - new Date(b.solic_data_atividade || '').getTime());
      case 'data-conclusao-desc':
        return sorted.sort((a, b) => new Date(b.solic_data_conclusao || '').getTime() - new Date(a.solic_data_conclusao || '').getTime());
      case 'data-conclusao-asc':
        return sorted.sort((a, b) => new Date(a.solic_data_conclusao || '').getTime() - new Date(b.solic_data_conclusao || '').getTime());
      case 'status-asc':
        return sorted.sort((a, b) => (a.solic_status || '').localeCompare(b.solic_status || ''));
      case 'status-desc':
        return sorted.sort((a, b) => (b.solic_status || '').localeCompare(a.solic_status || ''));
      default:
        return sorted;
    }
  }, [fuseSearchResults, sortBy]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Pagination
  const totalPages = Math.ceil(sortedSolicitacoes.length / ITEMS_PER_PAGE);
  const paginatedSolicitacoes = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedSolicitacoes.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [currentPage, sortedSolicitacoes]);

  const activeFilterCount = getActiveFilterCount();
  const activeFilters = getActiveFilters();

  const handleExport = () => {
    try {
      const exportData = filteredSolicitacoes.map((sol: any, index: number) => ({
        '#': index + 1,
        'ID': sol.id,
        'Nome da Atividade': sol.solic_nome || '',
        'Projeto': sol.solic_projeto || '',
        'Serviço': sol.solic_servico || '',
        'Operadora': sol.solic_operadora || '',
        'Ticket Freshdesk': sol.solic_freshdesk || '',
        'Contato Local': sol.solic_contato_local || '',
        'Rua': sol.solic_rua || '',
        'Número': sol.solic_numero || '',
        'Complemento': sol.solic_complemento || '',
        'Bairro': sol.solic_bairro || '',
        'Cidade': sol.solic_cidade || '',
        'UF': sol.solic_uf || '',
        'CEP': sol.solic_cep || '',
        'Latitude': sol.solic_latitude || '',
        'Longitude': sol.solic_longitude || '',
        'Data de Criação': formatDatePtBr(sol.solic_data_criacao),
        'Data da Atividade': formatDatePtBr(sol.solic_data_atividade),
        'Hora da Atividade': sol.solic_hora_atividade || '',
        'Data de Conclusão': formatDatePtBr(sol.solic_data_conclusao),
        'Horário de Chegada': formatTimePtBr(sol.solic_horario_chegada),
        'Horário de Liberação': formatTimePtBr(sol.solic_horario_liberacao),
        'Horário de Término': formatTimePtBr(sol.solic_horario_termino),
        'Status': sol.solic_status || '',
        'Faturamento': sol.solic_faturamento || '',
        'Técnico': sol.solic_tecnico_nome || '',
        'CPF do Técnico': sol.solic_tecnico_cpf || '',
        'Telefone do Técnico': sol.solic_tecnico_telefone || '',
        'Empresa Parceira': sol.solic_empresa_parceira || '',
        'Observações': sol.solic_observacoes || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Solicitações');
      
      ws['!cols'] = [
        { wch: 4 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
        { wch: 30 }
      ];
      
      const now = new Date();
      const fileName = `solicitacoes_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Solicitações exportadas com sucesso! (${filteredSolicitacoes.length} registros)`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar solicitações');
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = (status || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    switch(normalizedStatus) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'agendado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'concluido':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'improdutivo':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleViewDetails = (sol: any) => {
    navigate(`/detalhes/${sol.id}`, { replace: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Solicitações</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie todas as solicitações técnicas do sistema</p>
        </div>

        {/* Filters on Mobile */}
        <div className="lg:hidden mb-6">
          <UnifiedFilterPanel
            filters={filters}
            onFilterChange={(newFilters) => {
              Object.entries(newFilters).forEach(([key, value]) => {
                updateFilter(key as any, value as string);
              });
            }}
            onExport={handleExport}
            currentSortBy={sortBy}
            showExportButton={true}
          />
        </div>

        {/* Main Layout */}
        <div className="flex gap-6 items-start">
          {/* Left Content Area */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Active Filters Badge */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="secondary">
                    {filter}
                  </Badge>
                ))}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-muted-foreground">Carregando solicitações...</span>
              </div>
            )}

            {/* Search Field */}
            {!isLoading && (
              <div>
                <Input
                  placeholder="Buscar por nome, ticket, status..."
                  value={filters.searchTerm || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    if (value.length === 0 || value.length >= 1) {
                      updateFilter('searchTerm', value);
                    }
                  }}
                  className="h-9 w-full"
                />
              </div>
            )}

            {/* Results Info and Sorting */}
            {!isLoading && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {sortedSolicitacoes.length > 0 ? (
                    <>
                      {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedSolicitacoes.length)} de {sortedSolicitacoes.length}
                    </>
                  ) : (
                    'Nenhuma solicitação encontrada'
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Classificar por:</label>
                  <Select value={sortBy} onValueChange={(value) => {
                    setSortBy(value as SortOption);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-48 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data-criacao-desc">Data de Criação (Recente)</SelectItem>
                      <SelectItem value="data-criacao-asc">Data de Criação (Antigo)</SelectItem>
                      <SelectItem value="data-atividade-desc">Data de Atividade (Recente)</SelectItem>
                      <SelectItem value="data-atividade-asc">Data de Atividade (Antigo)</SelectItem>
                      <SelectItem value="data-conclusao-desc">Data de Conclusão (Recente)</SelectItem>
                      <SelectItem value="data-conclusao-asc">Data de Conclusão (Antigo)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Cards List */}
            {!isLoading && paginatedSolicitacoes.length > 0 && (
              <div className="space-y-3">
                {paginatedSolicitacoes.map((sol: any) => {
                  const atrasado = isSolicitacaoAtrasada(sol.solic_status, sol.solic_data_atividade);

                  return (
                    <Card 
                      key={sol.id} 
                      className={`p-4 transition-all hover:shadow-lg ${
                        atrasado 
                          ? 'border-l-4 border-l-red-600 border-red-500/30 bg-red-950/10' 
                          : ''
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base">{sol.solic_nome || 'Sem nome'}</h3>
                            <p className="text-xs text-muted-foreground">ID: {sol.id}</p>
                          </div>

                          {/* Badge do Status / Atrasado */}
                          {atrasado ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white shadow-sm">
                              Agendado (Atrasado)
                            </span>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sol.solic_status)}`}>
                              {sol.solic_status || 'N/A'}
                            </span>
                          )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Projeto</p>
                            <p className="font-medium">{sol.solic_projeto || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Serviço</p>
                            <p className="font-medium">{sol.solic_servico || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Operadora</p>
                            <p className="font-medium">{sol.solic_operadora || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ticket</p>
                            <p className="font-medium">{sol.solic_freshdesk || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Contato</p>
                            <p className="font-medium">{sol.solic_contato_local || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Data Criação</p>
                            <p className="font-medium">{formatDatePtBr(sol.solic_data_criacao)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Data Atividade</p>
                            <p className={`font-medium ${atrasado ? 'text-red-500 font-bold' : ''}`}>
                              {formatDatePtBr(sol.solic_data_atividade)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Data Conclusão</p>
                            <p className="font-medium">{formatDatePtBr(sol.solic_data_conclusao)}</p>
                          </div>
                          {user?.role !== 'analista' && (
                            <div>
                              <p className="text-muted-foreground">Faturamento</p>
                              <p className="font-medium">{sol.solic_faturamento || '-'}</p>
                            </div>
                          )}
                        </div>

                        {/* Technician Info */}
                        {sol.tecnico && (
                          <div className="border-t border-border pt-3 grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">Técnico</p>
                              <p className="font-medium">{sol.tecnico.tec_nome || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Telefone</p>
                              <p className="font-medium">{sol.tecnico.tec_telefone || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">CPF</p>
                              <p className="font-medium">{sol.tecnico.tec_cpf || '-'}</p>
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(sol)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && paginatedSolicitacoes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Unified Filter Panel */}
          <div className="hidden lg:block w-80 sticky top-6 h-fit">
            <UnifiedFilterPanel
              filters={filters}
              currentSortBy={sortBy}
              onFilterChange={(newFilters) => {
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key as any, value as string);
                });
              }}
              onExport={handleExport}
              showExportButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}