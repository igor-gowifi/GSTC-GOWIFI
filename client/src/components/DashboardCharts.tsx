import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Solicitacao {
  solic_id?: string;
  solic_status?: string;
  solic_data_criacao?: string;
  solic_data_conclusao?: string;
  solic_projeto?: string;
  [key: string]: any;
}

interface DashboardChartsProps {
  solicitacoes: Solicitacao[];
  isLoading?: boolean;
  sortBy?: 'data-criacao' | 'data-atividade' | 'data-conclusao';
}

// Status colors: Agendado (blue), Concluído (green), Pendente (yellow), Improdutivo (red)
const getStatusColor = (status: string): string => {
  const normalizedStatus = status?.toLowerCase().trim() || '';
  // Match exact status values from database (singular forms)
  switch (normalizedStatus) {
    case 'agendado':
      return '#3b82f6'; // Blue
    case 'concluido':
    case 'concluído':
      return '#10b981'; // Green
    case 'pendente':
      return '#f59e0b'; // Yellow
    case 'improdutivo':
      return '#ef4444'; // Red
    default:
      return '#8b5cf6'; // Purple (default)
  }
};

// Removed COLORS array - use getStatusColor function instead

export function DashboardCharts({ solicitacoes, isLoading = false, sortBy = 'data-criacao' }: DashboardChartsProps) {
  // Type for timeline data with timestamp
  interface TimelineItem {
    date: string;
    count: number;
    timestamp?: number;
  }
  // Get the date field based on sortBy
  const getDateField = (sortByValue: string): keyof Solicitacao => {
    switch (sortByValue) {
      case 'data-atividade':
        return 'solic_data_atividade';
      case 'data-conclusao':
        return 'solic_data_conclusao';
      default:
        return 'solic_data_criacao';
    }
  };

  const dateField = getDateField(sortBy);
  const dateFieldLabel = sortBy === 'data-atividade' ? 'Atividade' : sortBy === 'data-conclusao' ? 'Conclusão' : 'Criação';

  // Calculate status distribution
  const statusData = solicitacoes.reduce((acc, sol) => {
    const status = sol.solic_status || 'Desconhecido';
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);
  
  // Debug logging
  console.log('[DashboardCharts] Status data:', statusData);
  statusData.forEach(item => {
    console.log(`[DashboardCharts] Status: "${item.name}" -> Color: ${getStatusColor(item.name)}`);
  });

  // Calculate timeline (requests by date) - based on sortBy
  const timelineData = solicitacoes.reduce((acc, sol) => {
    const dateValue = sol[dateField];
    const date = dateValue ? new Date(dateValue as string).toLocaleDateString('pt-BR') : 'Desconhecido';
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1, timestamp: dateValue ? new Date(dateValue as string).getTime() : 0 });
    }
    return acc;
  }, [] as TimelineItem[])
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)) // Sort by timestamp (oldest first)
    .slice(-7) // Last 7 days
    .map(({ date, count }) => ({ date, count } as { date: string; count: number })); // Remove timestamp from final data

  // Calculate completion rate
  const completedCount = solicitacoes.filter(sol => {
    const status = sol.solic_status?.toLowerCase().trim() || '';
    return status === 'concluído' || status === 'concluido';
  }).length;
  const completionRate = solicitacoes.length > 0 ? Math.round((completedCount / solicitacoes.length) * 100) : 0;

  // Calculate by project
  const projectData = solicitacoes.reduce((acc, sol) => {
    const projeto = sol.solic_projeto || 'Sem Projeto';
    const existing = acc.find(item => item.name === projeto);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: projeto, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => {
                    const color = getStatusColor(entry.name);
                    console.log(`[Pie Cell] ${entry.name} -> ${color}`);
                    return <Cell key={`cell-${entry.name}-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações por Data de {dateFieldLabel} (Últimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conclusão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-4xl font-bold text-blue-600">{completionRate}%</div>
            <div className="text-sm text-muted-foreground mt-2">
              {completedCount} de {solicitacoes.length} concluídas
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Project */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações por Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          {projectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
