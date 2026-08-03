import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const equipamentosRouter = router({
    create: protectedProcedure
      .input(z.object({
        tecnicoId: z.string(),
        equipamentoNome: z.string(),
        equipamentoMarca: z.string().optional(),
        equipamentoModelo: z.string().optional(),
        equipamentoIdEstoque: z.string().optional(),
        equipamentoDescricao: z.string().optional(),
        status: z.enum(['emprestado', 'devolvido', 'usado_em_cliente']).optional(),
        observacoes: z.string().optional(),
        dataSaida: z.number().optional(),
        dataDevolucao: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          );
          const { data, error } = await supabase
            .from('tecnicos_equipamentos_historico')
            .insert({
              tecnico_id: input.tecnicoId,
              equipamento_nome: input.equipamentoNome,
              equipamento_modelo: input.equipamentoModelo,
              equipamento_id_estoque: input.equipamentoIdEstoque,
              observacoes: input.observacoes,
              status: input.status || 'emprestado',
              data_saida: input.dataSaida ? new Date(input.dataSaida).toISOString() : new Date().toISOString(),
              data_devolucao: input.dataDevolucao ? new Date(input.dataDevolucao).toISOString() : null,
            })
            .select();
          if (error) throw error;
          return data?.[0] || null;
        } catch (error) {
          console.error('[tRPC] Error creating equipment history:', error);
          throw error;
        }
      }),

    markAsReturned: protectedProcedure
      .input(z.object({ 
        id: z.string(),
        dataDevolucao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          );
          const { data, error } = await supabase
            .from('tecnicos_equipamentos_historico')
            .update({
              status: 'devolvido',
              data_devolucao: input.dataDevolucao || new Date().toISOString(),
            })
            .eq('id', input.id)
            .select();
          if (error) throw error;
          return data?.[0] || null;
        } catch (error) {
          console.error('[tRPC] Error marking equipment as returned:', error);
          throw error;
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        equipamentoNome: z.string().optional(),
        equipamentoModelo: z.string().optional(),
        equipamentoIdEstoque: z.string().optional(),
        observacoes: z.string().optional(),
        dataSaida: z.string().optional(),
        dataDevolucao: z.string().optional(),
        status: z.string().optional(),
        tecnicoId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          );
          const updateData: any = {};
          if (input.equipamentoNome !== undefined) updateData.equipamento_nome = input.equipamentoNome;
          if (input.equipamentoModelo !== undefined) updateData.equipamento_modelo = input.equipamentoModelo;
          if (input.equipamentoIdEstoque !== undefined) updateData.equipamento_id_estoque = input.equipamentoIdEstoque;
          if (input.observacoes !== undefined) updateData.observacoes = input.observacoes;
          if (input.dataSaida !== undefined) updateData.data_saida = input.dataSaida;
          if (input.dataDevolucao !== undefined) updateData.data_devolucao = input.dataDevolucao;
          if (input.status !== undefined) updateData.status = input.status;
          if (input.tecnicoId !== undefined) updateData.tecnico_id = input.tecnicoId;
          const { data, error } = await supabase
            .from('tecnicos_equipamentos_historico')
            .update(updateData)
            .eq('id', input.id)
            .select();
          if (error) throw error;
          return data?.[0] || null;
        } catch (error) {
          console.error('[tRPC] Error updating equipment:', error);
          throw error;
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          );
          const { error } = await supabase
            .from('tecnicos_equipamentos_historico')
            .update({ equip_ativo: false })
            .eq('id', input.id);
          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error('[tRPC] Error deleting equipment:', error);
          throw error;
        }
      }),

    historico: protectedProcedure.query(async ({ ctx }) => {
      try {
        const { getAllEquipamentoHistorico } = await import('../db');
        const data = await getAllEquipamentoHistorico();
        return data;
      } catch (error) {
        console.error('[tRPC] Error fetching equipment history:', error);
        throw error;
      }
    }),

    historicoByTecnico: protectedProcedure
      .input(z.object({ tecnicoId: z.string() }))
      .query(async ({ input, ctx }) => {
        try {
          const { getEquipamentoHistoricoByTecnico } = await import('../db');
          const data = await getEquipamentoHistoricoByTecnico(input.tecnicoId);
          return data;
        } catch (error) {
          console.error('[tRPC] Error fetching equipment history by technician:', error);
          throw error;
        }
      }),

    historicoByStatus: protectedProcedure
      .input(z.object({ status: z.enum(['emprestado', 'devolvido', 'usado_em_cliente']) }))
      .query(async ({ input, ctx }) => {
        try {
          const { getEquipamentoHistoricoByStatus } = await import('../db');
          const data = await getEquipamentoHistoricoByStatus(input.status);
          return data;
        } catch (error) {
          console.error('[tRPC] Error fetching equipment by status:', error);
          throw error;
        }
      }),
});
