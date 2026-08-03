import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const auditRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Only adminmaster and admin can list audit logs
    if (ctx.user?.role !== 'adminmaster' && ctx.user?.role !== 'admin') {
      throw new Error('Voce nao tem permissao para acessar os logs de auditoria');
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Erro ao listar audit logs:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao listar audit logs:', error);
      throw error;
    }
  }),

  loginPublic: publicProcedure
    .input(
      z.object({
        usuario: z.string(),
        usuarioNome: z.string().optional(),
        idDocumento: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Usar GMT-3 (timezone do Brasil)
        const agora = new Date();
        const offsetGMT3 = -3 * 60 * 60 * 1000; // GMT-3 em milissegundos
        const timestamp = agora.getTime() + agora.getTimezoneOffset() * 60 * 1000 + offsetGMT3;
        const dataFormatada = new Date(timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        const { data, error } = await supabase
          .from('audit_logs')
          .insert([
            {
              timestamp,
              data_formatada: dataFormatada,
              usuario: input.usuario,
              usuario_nome: input.usuarioNome || input.usuario,
              acao: 'USUARIO_LOGADO',
              descricao: `${input.usuarioNome || input.usuario} fez login no sistema`,
              tipo_documento: 'login',
              id_documento: input.idDocumento,
            },
          ]);

        if (error) {
          console.error('Erro ao registrar login no Supabase:', error);
          return { success: false, error: error.message };
        }

        console.log(`📝 [AUDIT] USUARIO_LOGADO: ${input.usuario}`);
        return { success: true, data };
      } catch (error) {
        console.error('Erro ao registrar login:', error);
        return { success: false, error: String(error) };
      }
    }),

  logoutPublic: publicProcedure
    .input(
      z.object({
        usuario: z.string(),
        usuarioNome: z.string().optional(),
        idDocumento: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Usar GMT-3 (timezone do Brasil)
        const agora = new Date();
        const offsetGMT3 = -3 * 60 * 60 * 1000; // GMT-3 em milissegundos
        const timestamp = agora.getTime() + agora.getTimezoneOffset() * 60 * 1000 + offsetGMT3;
        const dataFormatada = new Date(timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        const { data, error } = await supabase
          .from('audit_logs')
          .insert([
            {
              timestamp,
              data_formatada: dataFormatada,
              usuario: input.usuario,
              usuario_nome: input.usuarioNome || input.usuario,
              acao: 'USUARIO_DESLOGADO',
              descricao: `${input.usuarioNome || input.usuario} fez logout`,
              tipo_documento: 'login',
              id_documento: input.idDocumento,
            },
          ]);

        if (error) {
          console.error('Erro ao registrar logout no Supabase:', error);
          return { success: false, error: error.message };
        }

        console.log(`📝 [AUDIT] USUARIO_DESLOGADO: ${input.usuario}`);
        return { success: true, data };
      } catch (error) {
        console.error('Erro ao registrar logout:', error);
        return { success: false, error: String(error) };
      }
    }),

  log: protectedProcedure
    .input(
      z.object({
        usuario: z.string(),
        usuarioNome: z.string().optional(),
        acao: z.string(),
        descricao: z.string(),
        tipoDocumento: z.enum(['tecnico', 'solicitacao', 'login']),
        idDocumento: z.string(),
        dadosAntes: z.record(z.string(), z.any()).optional(),
        dadosDepois: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Usar GMT-3 (timezone do Brasil)
        const agora = new Date();
        const offsetGMT3 = -3 * 60 * 60 * 1000; // GMT-3 em milissegundos
        const timestamp = agora.getTime() + agora.getTimezoneOffset() * 60 * 1000 + offsetGMT3;
        const dataFormatada = new Date(timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        const { data, error } = await supabase
          .from('audit_logs')
          .insert([
            {
              timestamp,
              data_formatada: dataFormatada,
              usuario: input.usuario,
              usuario_nome: input.usuarioNome,
              acao: input.acao,
              descricao: input.descricao,
              tipo_documento: input.tipoDocumento,
              id_documento: input.idDocumento,
              dados_antes: input.dadosAntes,
              dados_depois: input.dadosDepois,
            },
          ]);

        if (error) {
          console.error('Erro ao registrar audit log no Supabase:', error);
          return { success: false, error: error.message };
        }

        console.log(`📝 [AUDIT] ${input.acao}: ${input.descricao}`);
        return { success: true, data };
      } catch (error) {
        console.error('Erro ao registrar audit log:', error);
        return { success: false, error: String(error) };
      }
    }),
});
