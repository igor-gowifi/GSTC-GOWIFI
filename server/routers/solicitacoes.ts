import { canFilterByAssignee, canFilterByScheduler } from '../../shared/solicitacaoFilters';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import { z } from "zod";
import { logAuditEvent } from "../auditHelper";
import { buildFullAddress } from "../geocodingHelper";
import { geocodeAddressWithRetry } from "../geocodingWithRetry";
import { getWeekRange, isDateInWeekRange } from "../weekHelper";
import { getDateFieldFromSortBy, isDateInDay, isDateInMonth, isDateInYear } from "../filterHelper";
import { applyCoordinatedFilters, getFilterSummary } from "../filterCoordinator";
import { createSupabaseServerClient, getSupabaseUserName } from "../supabaseUsers";

const assigneeInput = z.union([z.literal('me'), z.uuid()]).nullable();
const schedulerInput = z.uuid().nullable();
const schedulingNames = new Map([
  ['vinicius.bevilaqua@gowifi.com.br', 'Vinicius Bevilaqua'],
  ['okidathe.cocamaro@gowifi.com.br', 'Okidathe Cocamaro'],
]);
const previousSchedulingNames = new Map([
  ['Vinicius Bevilacqua', 'Vinicius Bevilaqua'],
  ['Okidathe', 'Okidathe Cocamaro'],
]);
const responsibilityColumns = [
  'solic_criado_por_nome',
  'solic_atribuido_a',
  'solic_atribuido_a_nome',
] as const;
const schedulingColumns = ['solic_agendamento_responsavel_id', 'solic_agendamento_responsavel_nome'] as const;
const assignmentUnavailableMessage = 'A atribuição ficará disponível após a atualização do banco de dados.';

function isMissingColumn(error: { code: string; message: string }, columns: readonly string[]) {
  return (error.code === '42703' || error.code === 'PGRST204') &&
    columns.some(column => error.message.includes(column));
}

type ResponsibilityColumns = {
  solic_criado_por?: string | null;
  solic_criado_por_nome?: string | null;
  solic_atribuido_a?: string | null;
  solic_atribuido_a_nome?: string | null;
  solic_agendamento_responsavel_id?: string | null;
  solic_agendamento_responsavel_nome?: string | null;
};

function withResponsibility<T extends ResponsibilityColumns>(row: T) {
  const schedulerName = row.solic_agendamento_responsavel_id && row.solic_agendamento_responsavel_nome;
  return {
    ...row,
    creatorName: row.solic_criado_por_nome || row.solic_criado_por || null,
    assigneeId: row.solic_atribuido_a || null,
    assigneeName: row.solic_atribuido_a ? row.solic_atribuido_a_nome || null : null,
    schedulerId: row.solic_agendamento_responsavel_id || null,
    schedulerName: schedulerName ? previousSchedulingNames.get(schedulerName) ?? schedulerName : null,
  };
}

function canAssignToUser(user: SupabaseUser) {
  return Boolean(user.email && user.email_confirmed_at && !user.is_anonymous &&
    (!user.banned_until || Date.parse(user.banned_until) <= Date.now()));
}

function isSchedulingUser(user: SupabaseUser) {
  return canAssignToUser(user) && schedulingNames.has(user.email!.trim().toLowerCase());
}

function getSchedulingName(user: SupabaseUser) {
  return schedulingNames.get(user.email?.trim().toLowerCase() ?? '') ?? getSupabaseUserName(user);
}

function requireSchedulingEditor(role: string) {
  if (!role || role === 'analista') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'O perfil Analista pode apenas visualizar o responsável pelo agendamento.',
    });
  }
}

async function getAssignmentUser(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  eligible: (user: SupabaseUser) => boolean,
) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error && error.status !== 404) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Não foi possível validar o usuário responsável.',
      cause: error,
    });
  }
  if (!data?.user || !eligible(data.user)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Este usuário não está disponível para atribuição.',
    });
  }

  return data.user;
}

async function resolveAssignee(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  assignee: z.infer<typeof assigneeInput>,
  currentUserId: string,
) {
  const user = assignee === null ? null : await getAssignmentUser(
    supabase, assignee === 'me' ? currentUserId : assignee, canAssignToUser
  );
  return {
    solic_atribuido_a: user?.id ?? null,
    solic_atribuido_a_nome: user ? getSupabaseUserName(user) : null,
  };
}

async function resolveScheduler(supabase: ReturnType<typeof createSupabaseServerClient>, schedulerId: string | null) {
  const user = schedulerId === null ? null : await getAssignmentUser(supabase, schedulerId, isSchedulingUser);
  return {
    solic_agendamento_responsavel_id: user?.id ?? null,
    solic_agendamento_responsavel_nome: user ? getSchedulingName(user) : null,
  };
}

async function areAssignmentColumnsAvailable(columns: readonly string[]) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('solicitacoes').select(columns.join(',')).limit(0);

  if (error && !isMissingColumn(error, columns)) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Não foi possível consultar a disponibilidade da atribuição.',
      cause: error,
    });
  }
  return !error;
}

async function listAssignmentUsers(
  eligible: (user: SupabaseUser) => boolean,
  getName = getSupabaseUserName,
) {
  const supabase = createSupabaseServerClient();
  const users: { id: string; name: string }[] = [];
  let page: number | null = 1;

  while (page !== null) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Não foi possível carregar os usuários para atribuição.',
        cause: error,
      });
    }
    users.push(...data.users.filter(eligible).map(user => ({
      id: user.id,
      name: getName(user),
    })));
    page = data.nextPage ?? null;
  }

  return users.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export const solicitacoesRouter = router({
  assignmentAvailable: protectedProcedure.query(() => areAssignmentColumnsAvailable(responsibilityColumns)),
  schedulingAssignmentAvailable: protectedProcedure.query(() => areAssignmentColumnsAvailable(schedulingColumns)),
  assignees: protectedProcedure.query(() => listAssignmentUsers(canAssignToUser)),
  schedulingAssignees: protectedProcedure.query(({ ctx }) => {
    requireSchedulingEditor(ctx.user.role);
    return listAssignmentUsers(isSchedulingUser, getSchedulingName);
  }),

  assign: protectedProcedure
    .input(z.object({ id: z.string(), assigneeId: assigneeInput }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createSupabaseServerClient();
      const assignment = await resolveAssignee(supabase, input.assigneeId, ctx.user.openId);
      const { data, error } = await supabase
        .from('solicitacoes')
        .update({ ...assignment, solic_atualizado_por: ctx.user.email })
        .eq('id', input.id)
        .eq('solic_ativo', true)
        .select()
        .maybeSingle();

      if (error) {
        if (isMissingColumn(error, responsibilityColumns)) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: assignmentUnavailableMessage });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Não foi possível salvar o responsável pela OS.',
          cause: error,
        });
      }
      if (!data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'OS não encontrada.' });
      }

      await logAuditEvent({
        usuario: ctx.user.email || 'unknown',
        usuarioNome: ctx.user.name,
        acao: 'update',
        descricao: assignment.solic_atribuido_a_nome
          ? `OS atribuída a ${assignment.solic_atribuido_a_nome}`
          : 'Atribuição da OS removida',
        tipoDocumento: 'solicitacao',
        idDocumento: input.id,
        dadosDepois: assignment,
      });

      return withResponsibility(data);
    }),

  assignScheduler: protectedProcedure
    .input(z.object({ id: z.string(), schedulerId: schedulerInput }))
    .mutation(async ({ ctx, input }) => {
      requireSchedulingEditor(ctx.user.role);
      const supabase = createSupabaseServerClient();
      const assignment = await resolveScheduler(supabase, input.schedulerId);
      const { data, error } = await supabase
        .from('solicitacoes')
        .update({ ...assignment, solic_atualizado_por: ctx.user.email })
        .eq('id', input.id)
        .eq('solic_ativo', true)
        .select()
        .maybeSingle();

      if (error) {
        if (isMissingColumn(error, schedulingColumns)) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: assignmentUnavailableMessage });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Não foi possível salvar o responsável pelo agendamento.',
          cause: error,
        });
      }
      if (!data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'OS não encontrada.' });
      }

      await logAuditEvent({
        usuario: ctx.user.email || 'unknown',
        usuarioNome: ctx.user.name,
        acao: 'update',
        descricao: assignment.solic_agendamento_responsavel_nome
          ? `Agendamento da OS atribuído a ${assignment.solic_agendamento_responsavel_nome}`
          : 'Responsável pelo agendamento da OS removido',
        tipoDocumento: 'solicitacao',
        idDocumento: input.id,
        dadosDepois: assignment,
      });

      return withResponsibility(data);
    }),

  create: protectedProcedure
    .input(
      z.object({
        nomeAtividade: z.string(),
        grupoProjeto: z.string().optional(),
        servico: z.string().optional(),
        operadora: z.string().optional(),
        freshdeskTicket: z.string().optional(),
        contatoLocal: z.string().nullable().optional(),
        cep: z.string().optional(),
        rua: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        dataAtividade: z.string().nullable().optional(),
        horaAtividade: z.string().nullable().optional(),
        status: z.string().optional(),
        observacoes: z.string().optional(),
        tecnicoId: z.string().nullable().optional(),
        assigneeId: assigneeInput.optional(),
        schedulerId: schedulerInput.optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.schedulerId) requireSchedulingEditor(ctx.user.role);

      try {
        const supabase = createSupabaseServerClient();
        const assignment = await resolveAssignee(supabase, input.assigneeId ?? null, ctx.user.openId);
        const scheduling = input.schedulerId ? await resolveScheduler(supabase, input.schedulerId) : {};
        console.log('[tRPC] solicitacoes.create called with:', { nomeAtividade: input.nomeAtividade, cidade: input.cidade, usuario: ctx.user?.email });
        console.log('[tRPC] Address fields:', { rua: input.rua, numero: input.numero, cidade: input.cidade, uf: input.uf });
        
        // Geocode the address
        let latitude: string | null = null;
        let longitude: string | null = null;

        if (input.rua && input.numero && input.cidade && input.uf) {
          const address = buildFullAddress(
            input.rua,
            input.numero,
            input.complemento,
            input.bairro,
            input.cidade,
            input.uf,
            input.cep
          );
          console.log('[tRPC] Geocoding address:', address);
          
          const coords = await geocodeAddressWithRetry(address);
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lon;
          }
        }

        // Build full address
        let fullAddress: string | null = null;
        if (input.rua && input.numero) {
          fullAddress = buildFullAddress(
            input.rua,
            input.numero,
            input.complemento,
            input.bairro,
            input.cidade,
            input.uf,
            input.cep
          );
        }

        // Fetch technician data if provided
        let tecnicoNome: string | null = null;
        let tecnicoTelefone: string | null = null;
        let tecnicoCpf: string | null = null;
        let empresaParceira: string | null = null;
        
        if (input.tecnicoId) {
          const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
          const tempSupabase = createSupabaseClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          const { data: tecnicoData } = await tempSupabase
            .from('tecnicos')
            .select('tec_nome, tec_telefone, tec_cpf, tec_empresa_parceira')
            .eq('id', input.tecnicoId)
            .eq('tec_ativo', true)
            .single();
          
          if (tecnicoData) {
            tecnicoNome = tecnicoData.tec_nome || null;
            tecnicoTelefone = tecnicoData.tec_telefone || null;
            tecnicoCpf = tecnicoData.tec_cpf || null;
            empresaParceira = tecnicoData.tec_empresa_parceira || null;
          }
        }

        // Create solicitacao in Supabase
        console.log('[tRPC] Preparing insert with:', { fullAddress, latitude, longitude, tecnicoNome, tecnicoTelefone });

<<<<<<< HEAD
        const row = {
          ...scheduling,
          solic_nome: input.nomeAtividade,
          solic_projeto: input.grupoProjeto,
          solic_servico: input.servico,
          solic_operadora: input.operadora,
          solic_freshdesk: input.freshdeskTicket,
          solic_contato_local: input.contatoLocal || null,
          solic_cep: input.cep,
          solic_rua: input.rua,
          solic_numero: input.numero,
          solic_complemento: input.complemento,
          solic_bairro: input.bairro,
          solic_cidade: input.cidade,
          solic_uf: input.uf,
          solic_data_atividade: input.dataAtividade || null,
          solic_hora_atividade: input.horaAtividade || null,
          solic_status: input.status || 'Pendente',
          solic_observacoes: input.observacoes,
          solic_tecnico_id: input.tecnicoId || null,
          solic_data_criacao: new Date().toISOString(),
          solic_criado_por: ctx.user?.email,
          solic_atualizado_por: ctx.user?.email,
          solic_endereco: fullAddress,
          solic_latitude: latitude,
          solic_longitude: longitude,
          solic_tecnico_nome: tecnicoNome,
          solic_tecnico_telefone: tecnicoTelefone,
          solic_tecnico_cpf: tecnicoCpf,
          solic_empresa_parceira: empresaParceira,
        };
        let result = await supabase.from('solicitacoes').insert([{
          ...row,
          solic_criado_por_nome: ctx.user.name || ctx.user.email,
          ...assignment,
        }]).select();

        if (result.error && isMissingColumn(result.error, responsibilityColumns)) {
          if (input.assigneeId) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: assignmentUnavailableMessage });
          }
          // An unknown column rejects the whole insert, so retrying with the old schema is safe.
          result = await supabase.from('solicitacoes').insert([row]).select();
        }
        const { data, error } = result;
        if (error && isMissingColumn(error, schedulingColumns)) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: assignmentUnavailableMessage });
        }
=======
        const { data, error } = await supabase
          .from('solicitacoes')
          .insert([
            {
              solic_nome: input.nomeAtividade,
              solic_projeto: input.grupoProjeto,
              solic_servico: input.servico,
              solic_operadora: input.operadora,
              solic_freshdesk: input.freshdeskTicket,
              solic_contato_local: input.contatoLocal || null,
              solic_cep: input.cep,
              solic_rua: input.rua,
              solic_numero: input.numero,
              solic_complemento: input.complemento,
              solic_bairro: input.bairro,
              solic_cidade: input.cidade,
              solic_uf: input.uf,
              solic_data_atividade: input.dataAtividade || null,
              solic_hora_atividade: input.horaAtividade || null,
              solic_status: input.status || 'Pendente',
              solic_observacoes: input.observacoes,
              solic_tecnico_id: input.tecnicoId || null,
              solic_data_criacao: new Date().toISOString(),
              solic_criado_por: ctx.user?.email,
              solic_atualizado_por: ctx.user?.email,
              solic_endereco: fullAddress,
              solic_latitude: latitude,
              solic_longitude: longitude,
              solic_tecnico_nome: tecnicoNome,
              solic_tecnico_telefone: tecnicoTelefone,
              solic_tecnico_cpf: tecnicoCpf,
              solic_empresa_parceira: empresaParceira,
            },
          ])
          .select();
>>>>>>> 42da2da8d4f2262c35405c03964e227516df5f77

        console.log('[tRPC] Insert result - data:', data?.[0], 'error:', error);
        
        if (error) {
          console.error('Error creating solicitacao:', error);
          throw new Error(error.message);
        }

        const novaSolicitacao = data?.[0];
        const osId = novaSolicitacao?.id;

        // Integração Automática com Freshdesk
        if (input.freshdeskTicket && osId) {
          const freshdeskTicketId = input.freshdeskTicket.replace('#', '').trim();
          const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || 'gowifiassist.freshdesk.com';
          const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;

          if (FRESHDESK_API_KEY) {
            const authHeader = `Basic ${Buffer.from(`${FRESHDESK_API_KEY}:X`).toString('base64')}`;
            const linkOS = `https://gestaocampo-gowifi.sytes.net:8088/detalhes/${osId}`;
            const usuarioCriador = ctx.user?.email || 'Sistema';
            const enderecoExibicao = fullAddress || 'Endereço não informado';

            try {
              console.log(`[Freshdesk Integration] Atualizando ticket #${freshdeskTicketId}...`);

              // 1️⃣ Atualiza status (9001), tipo de atendimento (Campo) e ID da OS no ticket
              const updateTicketRes = await fetch(`https://${FRESHDESK_DOMAIN}/api/v2/tickets/${freshdeskTicketId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader,
                },
                body: JSON.stringify({
                  status: 9001,
                  custom_fields: {
                    cf_tipo_de_atendimento: 'Campo',
<<<<<<< HEAD
                    cf_os_solicitacao_tecnico: parseInt(String(osId), 10),
=======
                    cf_os_solicitacao_tecnico: Number(osId),
>>>>>>> 42da2da8d4f2262c35405c03964e227516df5f77
                  },
                }),
              });

              if (!updateTicketRes.ok) {
                const errText = await updateTicketRes.text();
                console.error(`[Freshdesk Integration] Erro ao atualizar ticket #${freshdeskTicketId}:`, errText);
              }

              // 2️⃣ Adiciona nota privada com o criador, link e endereço da OS
              const noteContent = `
                <p><b>OS de solicitação de técnico criada por:</b> ${usuarioCriador}</p>
                <p><b>URL OS:</b> <a href="${linkOS}" target="_blank">${linkOS}</a></p>
                <p><b>Endereço:</b> ${enderecoExibicao}</p>
              `.trim();

              const createNoteRes = await fetch(`https://${FRESHDESK_DOMAIN}/api/v2/tickets/${freshdeskTicketId}/notes`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader,
                },
                body: JSON.stringify({
                  body: noteContent,
                  private: true,
                }),
              });

              if (!createNoteRes.ok) {
                const errText = await createNoteRes.text();
                console.error(`[Freshdesk Integration] Erro ao criar nota no ticket #${freshdeskTicketId}:`, errText);
              } else {
                console.log(`[Freshdesk Integration] Ticket #${freshdeskTicketId} e nota privada atualizados com sucesso.`);
              }

            } catch (fdError) {
              console.error('[Freshdesk Integration] Falha ao comunicar com a API do Freshdesk:', fdError);
            }
          } else {
            console.warn('[Freshdesk Integration] FRESHDESK_API_KEY não definida nas variáveis de ambiente.');
          }
        }

        // Log to audit
        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'create',
          descricao: `Solicitação criada: ${input.nomeAtividade}`,
          tipoDocumento: 'solicitacao',
          idDocumento: osId || 'unknown',
          dadosDepois: novaSolicitacao,
        });

<<<<<<< HEAD
        return novaSolicitacao ? withResponsibility(novaSolicitacao) : novaSolicitacao;
=======
        return novaSolicitacao;
>>>>>>> 42da2da8d4f2262c35405c03964e227516df5f77
      } catch (error) {
        console.error('Error in solicitacoes.create:', error);
        throw error;
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log('[tRPC] solicitacoes.list called');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*, tecnicos:solic_tecnico_id(id, tec_nome, tec_cpf, tec_telefone, tec_empresa_parceira)')
        .eq('solic_ativo', true)
        .neq('solic_status', 'cancelada')
        .order('solic_data_criacao', { ascending: false });

      if (error) {
        console.error('Error fetching solicitacoes:', error);
        throw new Error(error.message);
      }

      // Transform data to flatten technician info
      const transformedData = (data || []).map((sol: any) => ({
        ...withResponsibility(sol),
        solic_tecnico_nome: sol.tecnicos?.tec_nome || '',
        solic_tecnico_cpf: sol.tecnicos?.tec_cpf || '',
        solic_tecnico_telefone: sol.tecnicos?.tec_telefone || '',
        solic_tecnico_empresa: sol.tecnicos?.tec_empresa_parceira || sol.solic_empresa_parceira || '',
        solic_empresa_parceira: sol.solic_empresa_parceira || sol.tecnicos?.tec_empresa_parceira || '',
      }));
      console.log('[tRPC] solicitacoes.list returned:', transformedData?.length || 0, 'solicitacoes');
      return transformedData || [];
    } catch (error) {
      console.error('Error in solicitacoes.list:', error);
      throw error;
    }
  }),

  filter: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        assigneeId: z.uuid().optional(),
        schedulerId: z.uuid().optional(),
        status: z.string().optional(),
        projeto: z.string().optional(),
        servico: z.string().optional(),
        dia: z.enum(['hoje', 'ontem', 'amanha']).optional().or(z.literal('')),
        semana: z.enum(['esta-semana', 'semana-passada', 'semana-que-vem', '1a-semana', '2a-semana', '3a-semana', '4a-semana']).optional().or(z.literal('')),
        sortBy: z.string().optional(),
        mes: z.string().optional(),
        ano: z.string().optional(),
        empresaParceira: z.string().optional(),
        dataAtividadeStart: z.string().optional(),
        dataAtividadeEnd: z.string().optional(),
        dataCriacaoStart: z.string().optional(),
        dataCriacaoEnd: z.string().optional(),
        dataConclusaoStart: z.string().optional(),
        dataConclusaoEnd: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if ((input.assigneeId && !canFilterByAssignee(ctx.user.role)) ||
          (input.schedulerId && !canFilterByScheduler(ctx.user.role))) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Este filtro não está disponível para o seu perfil.' });
      }

      try {
        console.log('[tRPC] solicitacoes.filter called with:', input);
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let query = supabase.from('solicitacoes').select('*');
        
        // Filter out inactive solicitacoes
        query = query.eq('solic_ativo', true);

        if (input.assigneeId) {
          query = query.eq('solic_atribuido_a', input.assigneeId);
        }

        if (input.schedulerId) {
          query = query.eq('solic_agendamento_responsavel_id', input.schedulerId);
        }

        // Apply filters
        if (input.status) {
          query = query.ilike('solic_status', input.status);
        }

        if (input.projeto) {
          query = query.ilike('solic_projeto', input.projeto);
        }

        if (input.empresaParceira) {
          const { data: tecnicos, error: tecError } = await supabase
            .from('tecnicos')
            .select('id')
            .eq('tec_empresa_parceira', input.empresaParceira)
            .eq('tec_ativo', true);
          
          if (tecError) {
            console.error('Error fetching technicians by empresa parceira:', tecError);
          } else if (tecnicos && tecnicos.length > 0) {
            const tecnicoIds = tecnicos.map(t => t.id);
            query = query.in('solic_tecnico_id', tecnicoIds);
          } else {
            query = query.eq('id', -1);
          }
        }

        if (input.dataAtividadeStart) {
          query = query.gte('solic_data_atividade', input.dataAtividadeStart);
        }

        if (input.dataAtividadeEnd) {
          query = query.lte('solic_data_atividade', input.dataAtividadeEnd);
        }

        if (input.dataCriacaoStart) {
          query = query.gte('solic_data_criacao', input.dataCriacaoStart);
        }

        if (input.dataCriacaoEnd) {
          query = query.lte('solic_data_criacao', input.dataCriacaoEnd);
        }

        if (input.dataConclusaoStart) {
          query = query.gte('solic_data_conclusao', input.dataConclusaoStart);
        }

        if (input.servico) {
          query = query.ilike('solic_servico', input.servico);
        }

        if (input.dataConclusaoEnd) {
          query = query.lte('solic_data_conclusao', input.dataConclusaoEnd);
        }

        // Apply sorting based on sortBy parameter
        let sortField = 'solic_data_criacao';
        let ascending = false;
        
        if (input.sortBy === 'data-criacao-desc') {
          sortField = 'solic_data_criacao';
          ascending = false;
        } else if (input.sortBy === 'data-criacao-asc') {
          sortField = 'solic_data_criacao';
          ascending = true;
        } else if (input.sortBy === 'data-atividade-desc') {
          sortField = 'solic_data_atividade';
          ascending = false;
        } else if (input.sortBy === 'data-atividade-asc') {
          sortField = 'solic_data_atividade';
          ascending = true;
        } else if (input.sortBy === 'data-conclusao-desc') {
          sortField = 'solic_data_conclusao';
          ascending = false;
        } else if (input.sortBy === 'data-conclusao-asc') {
          sortField = 'solic_data_conclusao';
          ascending = true;
        } else if (input.sortBy === 'status-desc') {
          sortField = 'solic_status';
          ascending = false;
        } else if (input.sortBy === 'status-asc') {
          sortField = 'solic_status';
          ascending = true;
        } else if (input.sortBy === 'projeto-desc') {
          sortField = 'solic_projeto';
          ascending = false;
        } else if (input.sortBy === 'projeto-asc') {
          sortField = 'solic_projeto';
          ascending = true;
        } else if (input.sortBy === 'operadora-desc') {
          sortField = 'solic_operadora';
          ascending = false;
        } else if (input.sortBy === 'operadora-asc') {
          sortField = 'solic_operadora';
          ascending = true;
        } else if (input.sortBy === 'ticket-desc') {
          sortField = 'solic_ticket_freshdesk';
          ascending = false;
        } else if (input.sortBy === 'ticket-asc') {
          sortField = 'solic_ticket_freshdesk';
          ascending = true;
        }
        
<<<<<<< HEAD
        query = query.order(sortField, { ascending }).order('id', { ascending });
        const { data, error } = await query;
=======
        const { data, error } = await query
          .order(sortField, { ascending })
          .order('id', { ascending });
>>>>>>> 42da2da8d4f2262c35405c03964e227516df5f77

        if (error) {
          console.error('Error filtering solicitacoes:', error);
          throw new Error(error.message);
        }

        let filtered = data || [];
        if ((input.assigneeId || input.schedulerId) && filtered.length > 0) {
          // Supabase pode limitar o número de registros por resposta.
          let offset = filtered.length;
          while (true) {
            const { data: page, error: pageError } = await query.range(offset, offset + 999);
            if (pageError) throw new Error(pageError.message);
            if (!page?.length) break;
            filtered.push(...page);
            offset += page.length;
          }
        }
        
        const filterSummary = getFilterSummary(input);
        console.log(`[tRPC] solicitacoes.filter called with: ${filterSummary}, sortBy: ${input.sortBy || 'default'}`);
        
        filtered = applyCoordinatedFilters(filtered, input);
        
        console.log(`[tRPC] solicitacoes.filter returned: ${filtered.length} solicitacoes (${filterSummary})`);
        return filtered.map(withResponsibility);
      } catch (error) {
        console.error('Error in solicitacoes.filter:', error);
        throw error;
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
          .from('solicitacoes')
          .select('*')
          .eq('id', input.id)
          .single();

        if (error) {
          console.error('Error fetching solicitacao:', error);
          throw new Error(error.message);
        }

        return withResponsibility(data);
      } catch (error) {
        console.error('Error in solicitacoes.getById:', error);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nomeAtividade: z.string().optional(),
        grupoProjeto: z.string().optional(),
        servico: z.string().optional(),
        operadora: z.string().optional(),
        freshdeskTicket: z.string().optional(),
        contatoLocal: z.string().nullable().optional(),
        cep: z.string().optional(),
        rua: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().nullable().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        dataAtividade: z.string().nullable().optional(),
        horaAtividade: z.string().nullable().optional(),
        dataConclusao: z.string().optional(),
        horarioChegada: z.string().optional(),
        horarioLiberacao: z.string().optional(),
        horarioTermino: z.string().optional(),
        totalHoras: z.string().optional(),
        status: z.string().optional(),
        observacoes: z.string().optional(),
        faturamento: z.string().optional(),
        tecnicoId: z.string().nullable().optional(),
        tecnicoEscolhido: z.object({
          id: z.string(),
          nome: z.string(),
          telefone: z.string().optional(),
          cpf: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { id, ...updateData } = input;

        const updatePayload: any = {};
        if (updateData.nomeAtividade !== undefined) updatePayload.solic_nome = updateData.nomeAtividade;
        if (updateData.grupoProjeto !== undefined) updatePayload.solic_projeto = updateData.grupoProjeto;
        if (updateData.servico !== undefined) updatePayload.solic_servico = updateData.servico;
        if (updateData.operadora !== undefined) updatePayload.solic_operadora = updateData.operadora;
        if (updateData.freshdeskTicket !== undefined) updatePayload.solic_freshdesk = updateData.freshdeskTicket;
        if (updateData.contatoLocal !== undefined) updatePayload.solic_contato_local = updateData.contatoLocal;
        if (updateData.cep !== undefined) updatePayload.solic_cep = updateData.cep;
        if (updateData.rua !== undefined) updatePayload.solic_rua = updateData.rua;
        if (updateData.numero !== undefined) updatePayload.solic_numero = updateData.numero;
        if (updateData.complemento !== undefined) updatePayload.solic_complemento = updateData.complemento;
        if (updateData.bairro !== undefined) updatePayload.solic_bairro = updateData.bairro;
        if (updateData.cidade !== undefined) updatePayload.solic_cidade = updateData.cidade;
        if (updateData.uf !== undefined) updatePayload.solic_uf = updateData.uf;
        if (updateData.dataAtividade !== undefined) updatePayload.solic_data_atividade = updateData.dataAtividade;
        if (updateData.horaAtividade !== undefined) updatePayload.solic_hora_atividade = updateData.horaAtividade;
        if (updateData.dataConclusao !== undefined) updatePayload.solic_data_conclusao = updateData.dataConclusao;
        if (updateData.horarioChegada !== undefined) updatePayload.solic_horario_chegada = updateData.horarioChegada;
        if (updateData.horarioLiberacao !== undefined) updatePayload.solic_horario_liberacao = updateData.horarioLiberacao;
        if (updateData.horarioTermino !== undefined) updatePayload.solic_horario_termino = updateData.horarioTermino;
        if (updateData.totalHoras !== undefined) updatePayload.solic_total_horas = updateData.totalHoras;
        if (updateData.status !== undefined) updatePayload.solic_status = updateData.status;
        if (updateData.observacoes !== undefined) updatePayload.solic_observacoes = updateData.observacoes;
        if (updateData.faturamento !== undefined) updatePayload.solic_faturamento = updateData.faturamento;
        if (updateData.tecnicoId !== undefined) updatePayload.solic_tecnico_id = updateData.tecnicoId;
        if (updateData.tecnicoEscolhido !== undefined) updatePayload.solic_tecnico_id = updateData.tecnicoEscolhido.id;

        updatePayload.solic_atualizado_por = ctx.user?.email;
        
        console.log('[tRPC] UPDATE input data:', { rua: updateData.rua, numero: updateData.numero, cep: updateData.cep, cidade: updateData.cidade, uf: updateData.uf });
        const addressFieldsChanged = updateData.rua !== undefined || updateData.numero !== undefined || 
                                     updateData.complemento !== undefined || updateData.bairro !== undefined || 
                                     updateData.cidade !== undefined || updateData.uf !== undefined || updateData.cep !== undefined;
        console.log('[tRPC] addressFieldsChanged:', addressFieldsChanged);
        
        if (addressFieldsChanged) {
          console.log('[tRPC] Address fields changed, recalculating...');
          const { data: currentData } = await supabase
            .from('solicitacoes')
            .select('solic_rua, solic_numero, solic_complemento, solic_bairro, solic_cidade, solic_uf, solic_cep')
            .eq('id', id)
            .single();
          
          console.log('[tRPC] Current data from DB:', currentData);
          console.log('[tRPC] Update data:', updateData);
          
          if (currentData) {
            const rua = updateData.rua !== undefined ? updateData.rua : currentData.solic_rua;
            const numero = updateData.numero !== undefined ? updateData.numero : currentData.solic_numero;
            const complemento = updateData.complemento !== undefined ? updateData.complemento : currentData.solic_complemento;
            const bairro = updateData.bairro !== undefined ? updateData.bairro : currentData.solic_bairro;
            const cidade = updateData.cidade !== undefined ? updateData.cidade : currentData.solic_cidade;
            const uf = updateData.uf !== undefined ? updateData.uf : currentData.solic_uf;
            const cep = updateData.cep !== undefined ? updateData.cep : currentData.solic_cep;
            
            const fullAddress = buildFullAddress(rua, numero, complemento, bairro, cidade, uf, cep);
            console.log('[tRPC] Full address built:', fullAddress);
            updatePayload.solic_endereco = fullAddress;
            
            console.log('[tRPC] Checking geocoding conditions - rua:', rua, 'numero:', numero, 'cidade:', cidade, 'uf:', uf);
            if (rua && numero && cidade && uf) {
              console.log('[tRPC] Starting geocoding...');
              const address = buildFullAddress(rua, numero, complemento, bairro, cidade, uf, cep);
              const coords = await geocodeAddressWithRetry(address);
              if (coords) {
                console.log('[tRPC] Setting coordinates - lat:', coords.lat, 'lon:', coords.lon);
                updatePayload.solic_latitude = coords.lat;
                updatePayload.solic_longitude = coords.lon;
              }
            }
          }
        }
        
        const tecnicoChanged = updateData.tecnicoId !== undefined || updateData.tecnicoEscolhido !== undefined;
        if (tecnicoChanged) {
          const tecnicoId = updateData.tecnicoEscolhido?.id || updateData.tecnicoId;
          
          if (tecnicoId) {
            const { data: tecnicoData } = await supabase
              .from('tecnicos')
              .select('tec_nome, tec_telefone, tec_cpf, tec_empresa_parceira')
              .eq('id', tecnicoId)
              .eq('tec_ativo', true)
              .single();
            
            if (tecnicoData) {
              updatePayload.solic_tecnico_nome = tecnicoData.tec_nome || null;
              updatePayload.solic_tecnico_telefone = tecnicoData.tec_telefone || null;
              updatePayload.solic_tecnico_cpf = tecnicoData.tec_cpf || null;
              updatePayload.solic_empresa_parceira = tecnicoData.tec_empresa_parceira || null;
            }
          } else {
            updatePayload.solic_tecnico_nome = null;
            updatePayload.solic_tecnico_telefone = null;
            updatePayload.solic_tecnico_cpf = null;
            updatePayload.solic_empresa_parceira = null;
          }
        }

        const { data, error } = await supabase
          .from('solicitacoes')
          .update(updatePayload)
          .eq('id', id)
          .select();

        if (error) {
          console.error('Error updating solicitacao:', error);
          throw new Error(error.message);
        }

        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'update',
          descricao: `Solicitação atualizada: ${updateData.nomeAtividade || 'ID: ' + id}`,
          tipoDocumento: 'solicitacao',
          idDocumento: id,
          dadosDepois: data?.[0],
        });

        return data?.[0];
      } catch (error) {
        console.error('Error in solicitacoes.update:', error);
        throw error;
      }
    }),

  findNearestTecnicos: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        limit: z.number().optional().default(10),
        sortBy: z.enum(['distance', 'rating']).optional().default('distance'),
      })
    )
    .query(async ({ input }) => {
      try {
        const { findNearestTecnicos } = await import('../db');
        const tecnicos = await findNearestTecnicos(input.latitude, input.longitude, input.limit, input.sortBy);
        return tecnicos;
      } catch (error) {
        console.error('[tRPC] Error finding nearest technicians:', error);
        throw error;
      }
    }),

  sendToFreshdesk: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        data: z.string(),
        hora: z.string(),
        tecnicoNome: z.string(),
        tecnicoCpf: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { responderTicketFreshdesk, formatarTextoLiberacaoFreshdesk } = await import('../freshdesk');
        
        const mensagem = formatarTextoLiberacaoFreshdesk(
          input.data,
          input.hora,
          input.tecnicoNome,
          input.tecnicoCpf
        );
        
        const resultado = await responderTicketFreshdesk(input.ticketId, mensagem);
        
        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          tipoDocumento: 'solicitacao',
          idDocumento: String(input.ticketId),
          acao: 'update',
          descricao: `Resposta enviada ao ticket #${input.ticketId} com dados do técnico ${input.tecnicoNome}`,
        });
        
        return resultado;
      } catch (error) {
        console.error('[tRPC] Error sending to Freshdesk:', error);
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
          .from('solicitacoes')
          .update({ solic_ativo: false })
          .eq('id', input.id)
          .select();

        if (error) {
          throw new Error(error.message);
        }

        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'delete',
          descricao: `Solicitação deletada: ID ${input.id}`,
          tipoDocumento: 'solicitacao',
          idDocumento: input.id,
        });

        return data?.[0];
      } catch (error) {
        console.error('Error in solicitacoes.delete:', error);
        throw error;
      }
    }),
});