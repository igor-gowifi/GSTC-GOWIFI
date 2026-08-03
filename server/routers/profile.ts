import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const profileRouter = router({

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.email) {
        throw new Error('Usuario nao autenticado');
      }

      try {
        // Get profile from Supabase auth user_metadata
        return {
          id: ctx.user.openId,
          name: ctx.user.name || ctx.user.email,
          email: ctx.user.email,
          role: ctx.user.role || 'analista',
        };
      } catch (error) {
        console.error('[tRPC] Error in getProfile:', error);
        throw error;
      }
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1, 'Nome eh obrigatorio'),
        password: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.email) {
          throw new Error('Usuario nao autenticado');
        }

        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          // Update user metadata in Supabase auth
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            ctx.user.openId,
            { 
              user_metadata: { 
                name: input.name,
                role: ctx.user.role
              } 
            }
          );

          if (updateError) {
            console.error('[tRPC] Error updating profile:', updateError);
            throw new Error('Erro ao atualizar perfil');
          }

          if (input.password) {
            const { error: passwordError } = await supabase.auth.admin.updateUserById(
              ctx.user.openId,
              { password: input.password }
            );

            if (passwordError) {
              console.error('[tRPC] Error updating password:', passwordError);
              throw new Error('Erro ao atualizar senha');
            }
          }

          const timestamp = new Date().getTime();
          const dataFormatada = new Date(timestamp).toLocaleString('pt-BR');
          
          await supabase.from('audit_logs').insert([{
            timestamp,
            data_formatada: dataFormatada,
            usuario: ctx.user.email,
            usuario_nome: input.name,
            acao: 'atualizacao_perfil',
            descricao: `${ctx.user.name || ctx.user.email} atualizou seu perfil`,
            tipo_documento: 'login',
            id_documento: ctx.user.openId || 'unknown',
          }]);

          return { success: true };
        } catch (error) {
          console.error('[tRPC] Error in updateProfile:', error);
          throw error;
        }
      }),

    validatePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, 'Senha eh obrigatoria'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.email) {
          throw new Error('Usuario nao autenticado');
        }

        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!
          );

          const { error } = await supabase.auth.signInWithPassword({
            email: ctx.user.email,
            password: input.currentPassword,
          });

          if (error) {
            console.error('[tRPC] Error validating password:', error);
            throw new Error('Senha atual incorreta');
          }

          return { success: true };
        } catch (error) {
          console.error('[tRPC] Error in validatePassword:', error);
          throw error;
        }
      }),
});
