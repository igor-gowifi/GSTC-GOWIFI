import { AuditActionType } from '@/types';

/**
 * Registra uma ação no histórico de auditoria via tRPC fetch
 */
export async function registrarAuditLog(
  usuario: string,
  usuarioNome: string | undefined,
  acao: AuditActionType,
  descricao: string,
  tipoDocumento: 'tecnico' | 'solicitacao' | 'login',
  idDocumento: string,
  dadosAntes?: Record<string, any>,
  dadosDepois?: Record<string, any>
): Promise<void> {
  try {
    // Send audit log to backend via tRPC
    const response = await fetch('/api/trpc/audit.log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        json: {
          usuario,
          usuarioNome: usuarioNome || '',
          acao,
          descricao,
          tipoDocumento,
          idDocumento,
          dadosAntes,
          dadosDepois,
        },
      }),
    });

    if (!response.ok) {
      console.error('Erro ao registrar audit log:', response.statusText);
      return;
    }

    console.log(`📝 [AUDIT] ${acao}: ${descricao}`);
  } catch (err) {
    console.error('❌ Erro ao registrar audit log:', err);
    // Não lançar erro para não quebrar a operação principal
  }
}

/**
 * Gera descrição automática baseada na ação
 */
export function gerarDescricaoAuditLog(
  acao: AuditActionType,
  dados: Record<string, any>
): string {
  switch (acao) {
    case 'TECNICO_CRIADO':
      return `Técnico "${dados.nome}" criado`;
    case 'TECNICO_ATUALIZADO':
      return `Técnico "${dados.nome}" atualizado`;
    case 'TECNICO_DELETADO':
      return `Técnico "${dados.nome}" deletado`;
    case 'SOLICITACAO_CRIADA':
      return `Solicitação "${dados.nomeAtividade}" criada`;
    case 'SOLICITACAO_ATUALIZADA':
      return `Solicitação "${dados.nomeAtividade}" atualizada`;
    case 'SOLICITACAO_DELETADA':
      return `Solicitação "${dados.nomeAtividade}" deletada`;
    case 'SOLICITACAO_CONCLUIDA':
      return `Solicitação "${dados.nomeAtividade}" concluída`;
    case 'TECNICO_ATRIBUIDO':
      return `Técnico "${dados.tecnicoNome}" atribuído à solicitação`;
    case 'STATUS_ALTERADO':
      return `Status alterado de "${dados.statusAnterior}" para "${dados.statusNovo}"`;
    case 'USUARIO_LOGADO':
      return `Usuário "${dados.email}" fez login`;
    case 'USUARIO_DESLOGADO':
      return `Usuário "${dados.email}" fez logout (${dados.tempoOnline})`;
    default:
      return 'Ação registrada';
  }
}

/**
 * Extrai apenas os campos que mudaram
 */
export function extrairMudancas(
  dadosAntes: Record<string, any>,
  dadosDepois: Record<string, any>
): Record<string, any> {
  const mudancas: Record<string, any> = {};

  Object.keys(dadosDepois).forEach(chave => {
    if (JSON.stringify(dadosAntes[chave]) !== JSON.stringify(dadosDepois[chave])) {
      mudancas[chave] = {
        antes: dadosAntes[chave],
        depois: dadosDepois[chave]
      };
    }
  });

  return mudancas;
}
