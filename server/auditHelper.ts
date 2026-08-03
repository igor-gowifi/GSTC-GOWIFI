import { createClient } from '@supabase/supabase-js';

export interface AuditLogInput {
  usuario: string;
  usuarioNome?: string | null;
  acao: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'create_equipamentos' | 'update_equipamentos' | 'update_equipment_return';
  descricao: string;
  tipoDocumento: 'usuario' | 'tecnico' | 'solicitacao' | 'login' | 'equipamento' | 'equipamento_historico';
  idDocumento: string;
  dadosAntes?: Record<string, any>;
  dadosDepois?: Record<string, any>;
}

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    console.log('[AUDIT] logAuditEvent called with:', { usuario: input.usuario, acao: input.acao });
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Usar GMT-3 (timezone do Brasil)
    const agora = new Date();
    const offsetGMT3 = -3 * 60 * 60 * 1000; // GMT-3 em milissegundos
    const timestamp = agora.getTime() + agora.getTimezoneOffset() * 60 * 1000 + offsetGMT3;
    const dataFormatada = new Date(timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    console.log('[AUDIT] Inserting into audit_logs:', { usuario: input.usuario, acao: input.acao, timestamp });
    const { data, error } = await supabase.from('audit_logs').insert([{
      timestamp,
      data_formatada: dataFormatada,
      usuario: input.usuario,
      usuario_nome: input.usuarioNome || input.usuario,
      acao: input.acao,
      descricao: input.descricao,
      tipo_documento: input.tipoDocumento,
      id_documento: input.idDocumento,
      dados_antes: input.dadosAntes || null,
      dados_depois: input.dadosDepois || null,
    }]);
    
    if (error) {
      console.error('[AUDIT] Error inserting audit log:', error);
      console.error('[AUDIT] Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('[AUDIT] Audit log inserted successfully:', { usuario: input.usuario, acao: input.acao });
    }
  } catch (error) {
    console.error('[AUDIT] Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

export function buildAuditDescription(
  action: 'create' | 'update' | 'delete',
  entityType: string,
  entityName: string,
  userName: string
): string {
  const actionText = {
    create: 'criou',
    update: 'atualizou',
    delete: 'deletou',
  }[action];

  return `${userName} ${actionText} ${entityType}: ${entityName}`;
}
