import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from "zod";
import { logAuditEvent } from "../auditHelper";
import { buildFullAddress } from "../geocodingHelper";
import { geocodeAddressWithRetry } from "../geocodingWithRetry";
import { getWeekRange, isDateInWeekRange } from "../weekHelper";
import { getDateFieldFromSortBy, isDateInDay, isDateInMonth, isDateInYear } from "../filterHelper";
import { applyCoordinatedFilters, getFilterSummary } from "../filterCoordinator";

export const solicitacoesRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        nomeAtividade: z.string(),
        grupoProjeto: z.string().optional(),
        servico: z.string().optional(),
        operadora: z.string().optional(),
        freshdeskTicket: z.string().optional(),
        contatoLocal: z.string().optional(),
        cep: z.string().optional(),
        rua: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        dataAtividade: z.string().optional(),
        horaAtividade: z.string().optional(),
        status: z.string().optional(),
        observacoes: z.string().optional(),
        tecnicoId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
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
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log('[tRPC] Preparing insert with:', { fullAddress, latitude, longitude, tecnicoNome, tecnicoTelefone });

        const { data, error } = await supabase
          .from('solicitacoes')
          .insert([
            {
              solic_nome: input.nomeAtividade,
              solic_projeto: input.grupoProjeto,
              solic_servico: input.servico,
              solic_operadora: input.operadora,
              solic_freshdesk: input.freshdeskTicket,
              solic_contato_local: input.contatoLocal,
              solic_cep: input.cep,
              solic_rua: input.rua,
              solic_numero: input.numero,
              solic_complemento: input.complemento,
              solic_bairro: input.bairro,
              solic_cidade: input.cidade,
              solic_uf: input.uf,
              solic_data_atividade: input.dataAtividade,
              solic_hora_atividade: input.horaAtividade,
              solic_status: input.status || 'pendente',
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

        console.log('[tRPC] Insert result - data:', data?.[0], 'error:', error);
        
        if (error) {
          console.error('Error creating solicitacao:', error);
          throw new Error(error.message);
        }

        // Log to audit
        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'create',
          descricao: `Solicitação criada: ${input.nomeAtividade}`,
          tipoDocumento: 'solicitacao',
          idDocumento: data?.[0]?.id || 'unknown',
          dadosDepois: data?.[0],
        });

        return data?.[0];
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
        ...sol,
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
        status: z.string().optional(),
        projeto: z.string().optional(),
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

        // Apply filters
        if (input.status) {
          // Use case-insensitive filter
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
        
        // Order by the selected field, then by ID with same direction as primary sort
        const { data, error } = await query
          .order(sortField, { ascending })
          .order('id', { ascending });

        if (error) {
          console.error('Error filtering solicitacoes:', error);
          throw new Error(error.message);
        }

        let filtered = data || [];
        
        // Use the coordinated filter system
        const filterSummary = getFilterSummary(input);
        console.log(`[tRPC] solicitacoes.filter called with: ${filterSummary}, sortBy: ${input.sortBy || 'default'}`);
        
        filtered = applyCoordinatedFilters(filtered, input);
        
        console.log(`[tRPC] solicitacoes.filter returned: ${filtered.length} solicitacoes (${filterSummary})`);
        return filtered;
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

        return data;
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
        contatoLocal: z.string().optional(),
        cep: z.string().optional(),
        rua: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        dataAtividade: z.string().optional(),
        horaAtividade: z.string().optional(),
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

        // Always update solic_atualizado_por
        updatePayload.solic_atualizado_por = ctx.user?.email;
        
        // Recalculate address and coordinates if any address field changed
        console.log('[tRPC] UPDATE input data:', { rua: updateData.rua, numero: updateData.numero, cep: updateData.cep, cidade: updateData.cidade, uf: updateData.uf });
        const addressFieldsChanged = updateData.rua !== undefined || updateData.numero !== undefined || 
                                     updateData.complemento !== undefined || updateData.bairro !== undefined || 
                                     updateData.cidade !== undefined || updateData.uf !== undefined || updateData.cep !== undefined;
        console.log('[tRPC] addressFieldsChanged:', addressFieldsChanged);
        
        if (addressFieldsChanged) {
          console.log('[tRPC] Address fields changed, recalculating...');
          // Get current values from database
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
            
            // Build full address
            const fullAddress = buildFullAddress(rua, numero, complemento, bairro, cidade, uf, cep);
            console.log('[tRPC] Full address built:', fullAddress);
            updatePayload.solic_endereco = fullAddress;
            
            // Geocode the address
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
        
        // Fetch technician data if tecnico_id changed
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
            // If tecnico_id is null, clear technician fields
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
