'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Console() {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('Tudo');
  const [actionFilter, setActionFilter] = useState('Todas as ações');
  const [userFilter, setUserFilter] = useState('Todos os usuários');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: auditLogs = [], isLoading } = trpc.audit.list.useQuery();

  // Get unique users and actions
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    auditLogs.forEach(log => {
      if (log.usuario) users.add(log.usuario);
    });
    return Array.from(users).sort();
  }, [auditLogs]);

  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    auditLogs.forEach(log => {
      if (log.acao) actions.add(log.acao);
    });
    return Array.from(actions).sort();
  }, [auditLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = [...auditLogs];

    // Period filter
    if (periodFilter !== 'Tudo') {
      const now = new Date();
      const cutoffTime = new Date();
      
      if (periodFilter === '1 dia (últimas 24h)') {
        cutoffTime.setDate(cutoffTime.getDate() - 1);
      } else if (periodFilter === '3 dias') {
        cutoffTime.setDate(cutoffTime.getDate() - 3);
      } else if (periodFilter === '30 dias') {
        cutoffTime.setDate(cutoffTime.getDate() - 30);
      }
      
      filtered = filtered.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= cutoffTime;
      });
    }

    // Action filter
    if (actionFilter !== 'Todas as ações') {
      filtered = filtered.filter(log => log.acao === actionFilter);
    }

    // User filter
    if (userFilter !== 'Todos os usuários') {
      filtered = filtered.filter(log => log.usuario === userFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.descricao?.toLowerCase().includes(term) ||
        log.usuario?.toLowerCase().includes(term) ||
        log.id_documento?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [auditLogs, periodFilter, actionFilter, userFilter, searchTerm]);

  const getActionColor = (acao: string) => {
    switch (acao) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'logout':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'USUARIO_LOGADO':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'USUARIO_DESLOGADO':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'atualizacao_perfil':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDocumentTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'tecnico': '👨‍🔧 Técnico',
      'solicitacao': '📋 Solicitação',
      'equipamento': '🔧 Equipamento',
      'usuario': '👤 Usuário',
      'login': '🔐 Login',
    };
    return labels[tipo] || tipo;
  };

  const formatJson = (data: any) => {
    if (!data) return 'N/A';
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Logs de Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Visualize todas as alterações realizadas no sistema por qualquer usuário
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Buscar por descrição, usuário ou ID do documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Período</label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tudo">Tudo</SelectItem>
                <SelectItem value="1 dia (últimas 24h)">1 dia (últimas 24h)</SelectItem>
                <SelectItem value="3 dias">3 dias</SelectItem>
                <SelectItem value="30 dias">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Filtrar por Ação</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas as ações">Todas as ações</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Filtrar por Usuário</label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos os usuários">Todos os usuários</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Total: {filteredLogs.length} ações
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando logs...</p>
        </div>
      )}

      {/* Logs list */}
      {!isLoading && filteredLogs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum log encontrado</p>
        </div>
      )}

      {!isLoading && filteredLogs.length > 0 && (
        <div className="space-y-2">
          {filteredLogs.map((log, index) => (
            <div key={`${log.timestamp}-${index}`} className="border border-border rounded-lg overflow-hidden">
              {/* Log header - clickable */}
              <button
                onClick={() => setExpandedId(expandedId === `${log.timestamp}-${index}` ? null : `${log.timestamp}-${index}`)}
                className="w-full p-4 bg-card hover:bg-muted transition-colors text-left flex items-center justify-between"
              >
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.acao)}`}>
                        {log.acao}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {getDocumentTypeLabel(log.tipo_documento)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ID: {log.id_documento}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{log.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Por: {log.usuario_nome || log.usuario}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {log.data_formatada}
                  </span>
                  {expandedId === `${log.timestamp}-${index}` ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {expandedId === `${log.timestamp}-${index}` && (
                <div className="p-4 bg-muted border-t border-border space-y-4">
                  {/* User info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase">Informações do Usuário</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Email:</span> {log.usuario}</p>
                        <p><span className="text-muted-foreground">Nome:</span> {log.usuario_nome || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase">Informações do Documento</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Tipo:</span> {log.tipo_documento}</p>
                      </div>
                    </div>
                  </div>

                  {/* Before/After data */}
                  {(log.dados_antes || log.dados_depois) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase">Alterações</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {log.dados_antes && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Antes:</p>
                            <pre className="bg-background p-2 rounded text-xs overflow-auto max-h-48 border border-border">
                              {formatJson(log.dados_antes)}
                            </pre>
                          </div>
                        )}
                        {log.dados_depois && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Depois:</p>
                            <pre className="bg-background p-2 rounded text-xs overflow-auto max-h-48 border border-border">
                              {formatJson(log.dados_depois)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    <p>Timestamp: {new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
