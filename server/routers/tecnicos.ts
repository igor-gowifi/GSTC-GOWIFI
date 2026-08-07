import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { geocodeAddress } from "../db";
import { logAuditEvent } from "../auditHelper";

export const tecnicosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get all active technicians (tec_ativo = true)
      const { data, error } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('tec_ativo', true)
        .order('tec_data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao listar tecnicos:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao listar tecnicos:', error);
      throw error;
    }
  }),

  // Procedure para calcular técnicos mais próximos com base em coordenadas (Lat/Lng)
  buscarProximos: protectedProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Busca todos os técnicos ativos
        const { data: tecnicos, error } = await supabase
          .from('tecnicos')
          .select('*')
          .eq('tec_ativo', true);

        if (error) {
          console.error('Erro ao buscar técnicos próximos:', error);
          throw new Error(error.message);
        }

        if (!tecnicos || tecnicos.length === 0) return [];

        // Função Haversine para calcular distância em Km
        const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371; // Raio da Terra em km
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        // Mapeia adicionando a distância calculada e propriedades compativeis com o modal
        const tecnicosComDistancia = tecnicos.map((tec) => {
          let distancia: number | null = null;

          if (tec.tec_latitude && tec.tec_longitude) {
            distancia = calcularDistancia(
              input.lat,
              input.lng,
              Number(tec.tec_latitude),
              Number(tec.tec_longitude)
            );
          }

          const distCalculada = distancia !== null ? Math.round(distancia * 10) / 10 : undefined;

          return {
            ...tec,
            distancia: distCalculada,
            distanciaKm: distCalculada,
          };
        });

        // Ordena pelos mais próximos (técnicos sem coordenada vão para o final)
        return tecnicosComDistancia.sort((a, b) => {
          if (a.distancia === undefined) return 1;
          if (b.distancia === undefined) return -1;
          return a.distancia - b.distancia;
        });
      } catch (error) {
        console.error('Erro em buscarProximos:', error);
        throw error;
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        tec_nome: z.string(),
        tec_telefone: z.string().optional(),
        tec_cpf: z.string().optional(),
        tec_rg: z.string().optional(),
        tec_cep: z.string().optional(),
        tec_rua: z.string().optional(),
        tec_numero: z.string().optional(),
        tec_complemento: z.string().optional(),
        tec_bairro: z.string().optional(),
        tec_cidade: z.string().optional(),
        tec_uf: z.string().optional(),
        tec_empresa_parceira: z.string().optional(),
        tec_observacoes: z.string().optional(),
        // Individual evaluation fields
        tec_avaliacao_pontualidade: z.number().min(0).max(5).optional(),
        tec_avaliacao_ferramentas: z.number().min(0).max(5).optional(),
        tec_avaliacao_produtividade: z.number().min(0).max(5).optional(),
        tec_avaliacao_conhecimento: z.number().min(0).max(5).optional(),
        tec_avaliacao_flexibilidade: z.number().min(0).max(5).optional(),
        // Average evaluation (calculated from 5 individual fields on frontend)
        tec_avaliacao: z.number().min(0).max(5).optional(),
        lat: z.number().optional(),
        long: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Use the average evaluation provided by frontend
        const avaliacaoMedia = input.tec_avaliacao || 0;

        // Geocoding: Get lat/long from address if not provided
        let lat = input.lat;
        let long = input.long;

        if (!lat || !long) {
          try {
            const coords = await geocodeAddress(
              input.tec_rua || '',
              input.tec_numero || '',
              input.tec_bairro || '',
              input.tec_cidade || '',
              input.tec_uf || '',
              input.tec_cep
            );
            if (coords) {
              lat = coords.lat;
              long = coords.long;
            }
          } catch (geocodeError) {
            console.warn("Geocoding failed, continuing without coordinates:", geocodeError);
          }
        }

        // Remove lat/long from input as they're not table columns
        const { lat: _, long: __, ...cleanInput } = input as any;
        
        const { data, error } = await supabase
          .from('tecnicos')
          .insert([{
            ...cleanInput,
            tec_avaliacao: avaliacaoMedia,
            tec_latitude: lat,
            tec_longitude: long,
            tec_criado_por: ctx.user?.email,
            tec_atualizado_por: ctx.user?.email,
          }])
          .select();

        if (error) {
          console.error('Erro ao criar tecnico:', error);
          throw new Error(error.message);
        }

        // Log to audit
        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'create',
          descricao: `Técnico criado: ${input.tec_nome}`,
          tipoDocumento: 'tecnico',
          idDocumento: data?.[0]?.id || 'unknown',
          dadosDepois: data?.[0],
        });
        
        return data?.[0];
      } catch (error) {
        console.error('Erro ao criar tecnico:', error);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tec_nome: z.string().optional(),
        tec_telefone: z.string().optional(),
        tec_cpf: z.string().optional(),
        tec_rg: z.string().optional(),
        tec_cep: z.string().optional(),
        tec_rua: z.string().optional(),
        tec_numero: z.string().optional(),
        tec_complemento: z.string().optional(),
        tec_bairro: z.string().optional(),
        tec_cidade: z.string().optional(),
        tec_uf: z.string().optional(),
        tec_empresa_parceira: z.string().optional(),
        tec_observacoes: z.string().optional(),
        // Individual evaluation fields
        tec_avaliacao_pontualidade: z.number().min(0).max(5).optional(),
        tec_avaliacao_ferramentas: z.number().min(0).max(5).optional(),
        tec_avaliacao_produtividade: z.number().min(0).max(5).optional(),
        tec_avaliacao_conhecimento: z.number().min(0).max(5).optional(),
        tec_avaliacao_flexibilidade: z.number().min(0).max(5).optional(),
        // Average evaluation (calculated from 5 individual fields on frontend)
        tec_avaliacao: z.number().min(0).max(5).optional(),
        lat: z.number().optional(),
        long: z.number().optional(),
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

        // Use the average evaluation provided by frontend (if provided)
        const avaliacaoMedia = updateData.tec_avaliacao;

        // Geocoding: Get lat/long from address if address fields are provided
        let lat = updateData.lat;
        let long = updateData.long;

        if ((!lat || !long) && (updateData.tec_rua || updateData.tec_bairro || updateData.tec_cidade || updateData.tec_uf)) {
          try {
            const coords = await geocodeAddress(
              updateData.tec_rua || '',
              updateData.tec_numero || '',
              updateData.tec_bairro || '',
              updateData.tec_cidade || '',
              updateData.tec_uf || '',
              updateData.tec_cep
            );
            if (coords) {
              lat = coords.lat;
              long = coords.long;
            }
          } catch (geocodeError) {
            console.warn("Geocoding failed, continuing without coordinates:", geocodeError);
          }
        }

        // Remove lat/long from updateData but KEEP address fields and individual evaluation fields
        const { lat: _, long: __, tec_avaliacao_pontualidade, tec_avaliacao_ferramentas, tec_avaliacao_produtividade, tec_avaliacao_conhecimento, tec_avaliacao_flexibilidade, ...cleanUpdateData } = updateData;
        const updatePayload: any = cleanUpdateData;
        
        // Ensure address fields are included in payload
        if (updateData.tec_rua !== undefined) updatePayload.tec_rua = updateData.tec_rua;
        if (updateData.tec_numero !== undefined) updatePayload.tec_numero = updateData.tec_numero;
        if (updateData.tec_complemento !== undefined) updatePayload.tec_complemento = updateData.tec_complemento;
        if (updateData.tec_bairro !== undefined) updatePayload.tec_bairro = updateData.tec_bairro;
        if (updateData.tec_cidade !== undefined) updatePayload.tec_cidade = updateData.tec_cidade;
        if (updateData.tec_uf !== undefined) updatePayload.tec_uf = updateData.tec_uf;
        if (updateData.tec_cep !== undefined) updatePayload.tec_cep = updateData.tec_cep;
        
        // Include individual evaluation fields in payload
        if (tec_avaliacao_pontualidade !== undefined) updatePayload.tec_avaliacao_pontualidade = tec_avaliacao_pontualidade;
        if (tec_avaliacao_ferramentas !== undefined) updatePayload.tec_avaliacao_ferramentas = tec_avaliacao_ferramentas;
        if (tec_avaliacao_produtividade !== undefined) updatePayload.tec_avaliacao_produtividade = tec_avaliacao_produtividade;
        if (tec_avaliacao_conhecimento !== undefined) updatePayload.tec_avaliacao_conhecimento = tec_avaliacao_conhecimento;
        if (tec_avaliacao_flexibilidade !== undefined) updatePayload.tec_avaliacao_flexibilidade = tec_avaliacao_flexibilidade;
        
        // Average evaluation will be calculated by the database trigger
        if (avaliacaoMedia !== undefined) updatePayload.tec_avaliacao = avaliacaoMedia;
        
        updatePayload.tec_latitude = lat;
        updatePayload.tec_longitude = long;
        updatePayload.tec_atualizado_por = ctx.user?.email;
        updatePayload.tec_data_atualizacao = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('tecnicos')
          .update(updatePayload)
          .eq('id', id)
          .select();

        if (error) {
          console.error('Erro ao atualizar tecnico:', error);
          throw new Error(error.message);
        }

        // Log to audit
        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'update',
          descricao: `Técnico atualizado: ${updateData.tec_nome || 'ID: ' + id}`,
          tipoDocumento: 'tecnico',
          idDocumento: id,
          dadosDepois: data?.[0],
        });
        
        return data?.[0];
      } catch (error) {
        console.error('Erro ao atualizar tecnico:', error);
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('[TECNICO DELETE] Starting delete for ID:', input.id);
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Soft delete: set tec_ativo = false
        const { error: updateError } = await supabase
          .from('tecnicos')
          .update({ tec_ativo: false })
          .eq('id', input.id);

        if (updateError) {
          console.error('[TECNICO DELETE] Error updating tec_ativo:', updateError);
          throw new Error(updateError.message);
        }

        console.log('[TECNICO DELETE] Delete completed successfully for ID:', input.id);
        return { success: true };
      } catch (error) {
        console.error('[TECNICO DELETE] Error:', error);
        throw error;
      }
    }),

  equipamentos: router({
    list: protectedProcedure
      .input(z.object({ tecnicoId: z.string() }))
      .query(async ({ input }) => {
        return [];
      }),

    create: protectedProcedure
      .input(z.object({
        tecnicoId: z.string(),
        equipamentos: z.array(z.object({
          tec_equip_tipo: z.enum(['AP', 'RB', 'Switch']),
          tec_equip_nome: z.string(),
          tec_equip_modelo: z.string().optional(),
          tec_equip_quantidade: z.number().min(1),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        return [];
      }),

    update: protectedProcedure
      .input(z.object({
        tecnicoId: z.string(),
        equipamentos: z.array(z.object({
          tec_equip_tipo: z.enum(['AP', 'RB', 'Switch']),
          tec_equip_nome: z.string(),
          tec_equip_modelo: z.string().optional(),
          tec_equip_quantidade: z.number().min(1),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        return [];
      }),

    historico: protectedProcedure
      .input(z.object({ tecnicoId: z.string() }))
      .query(async ({ input }) => {
        return [];
      }),

    updateReturnStatus: protectedProcedure
      .input(z.object({ historicoId: z.string(), devolvido: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        return { id: input.historicoId, devolvido: input.devolvido };
      }),
  }),
});