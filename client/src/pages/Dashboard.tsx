import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useFilters } from '@/hooks/useFilters';
import { UnifiedFilterPanel } from '@/components/UnifiedFilterPanel';
import { DashboardCharts } from '@/components/DashboardCharts';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const { filters, updateFilter, clearFilters, getActiveFilterCount, getActiveFilters } = useFilters();
  const [sortBy, setSortBy] = useState<'data-criacao' | 'data-atividade'>('data-criacao');

  // Fetch filtered solicitacoes
  const { data: filteredSolicitacoes = [], isLoading } = trpc.solicitacoes.filter.useQuery(
    {
      searchTerm: filters.searchTerm,
      status: filters.status || '',
      projeto: filters.projeto || '',
      dia: filters.dia as any,
      semana: filters.semana as any,
      mes: filters.mes || '',
      ano: filters.ano || '',
      empresaParceira: filters.empresaParceira || '',
      dataAtividadeStart: filters.dataAtividadeStart || '',
      dataAtividadeEnd: filters.dataAtividadeEnd || '',
      dataCriacaoStart: filters.dataCriacaoStart || '',
      dataCriacaoEnd: filters.dataCriacaoEnd || '',
      dataConclusaoStart: filters.dataConclusaoStart || '',
      dataConclusaoEnd: filters.dataConclusaoEnd || '',
      sortBy: sortBy,
    }
  );

  // Get all solicitacoes for extracting unique values
  const { data: allSolicitacoes = [] } = trpc.solicitacoes.list.useQuery();

  // Extract unique projects and statuses
  const projetos = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_projeto).filter(Boolean)));
  const statuses = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_status).filter(Boolean)));
  const empresas = Array.from(new Set(allSolicitacoes.map((s: any) => s.solic_empresa_parceira).filter(Boolean)));

  const activeFilterCount = getActiveFilterCount();
  const activeFilters = getActiveFilters();

  const handleExport = () => {
    if (filteredSolicitacoes.length === 0) {
      toast.error('Nenhuma solicitação para exportar');
      return;
    }

    const dataToExport = filteredSolicitacoes.map((s: any) => ({
      'ID': s.solic_id,
      'Projeto': s.solic_projeto,
      'Status': s.solic_status,
      'Data Criação': s.solic_data_criacao,
      'Data Atividade': s.solic_data_atividade,
      'Data Conclusão': s.solic_data_conclusao,
      'Empresa Parceira': s.solic_empresa_parceira,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitações');
    XLSX.writeFile(workbook, 'solicitacoes.xlsx');
    toast.success('Solicitações exportadas com sucesso');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="space-y-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Visão geral do sistema de solicitações técnicas</p>
          </div>
          
          {/* Classificar por Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Classificar por:</label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data-criacao">Data de Criação</SelectItem>
                <SelectItem value="data-atividade">Data de Atividade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters on Mobile (Above Content) */}
        <div className="lg:hidden mb-6">
          <UnifiedFilterPanel
            filters={filters}
            currentSortBy={sortBy}
            onFilterChange={(newFilters) => {
              Object.entries(newFilters).forEach(([key, value]) => {
                updateFilter(key as any, value as string);
              });
            }}
            onExport={handleExport}
          />
        </div>

        {/* Main Layout: Content on Left, Filters on Right (Desktop) */}
        <div className="flex gap-6 items-start">
          {/* Left Content Area */}
          <div className="flex-1 min-w-0 space-y-6">
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
                <span className="ml-2 text-muted-foreground">Carregando dados do dashboard...</span>
              </div>
            )}

            {!isLoading && (
              <>
                {/* Charts */}
                <DashboardCharts solicitacoes={filteredSolicitacoes} isLoading={isLoading} sortBy={sortBy} />
              </>
            )}
          </div>

          {/* Right Sidebar: Unified Filter Panel (Fixed on Desktop) */}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
