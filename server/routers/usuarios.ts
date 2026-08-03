import { z } from "zod";
import { logAuditEvent } from "../auditHelper";
import { router, protectedProcedure } from "../_core/trpc";

export const usuariosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userRole = ctx.user?.role;
    if (userRole !== 'adminmaster' && userRole !== 'admin') {
      throw new Error('Você não tem permissão para acessar esta página');
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Fetch users from Supabase auth
      const { data: { users }, error } = await supabase.auth.admin.listUsers();

      if (error) {
        console.error('Erro ao listar usuarios:', error);
        throw new Error(error.message);
      }

      // Transform auth users to match expected format
      return (users || []).map((user, idx) => ({
        id: idx + 1,
        uid: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || '',
        role: user.user_metadata?.role || 'analista',
        login_method: 'email',
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));
    } catch (error) {
      console.error('Erro ao listar usuarios:', error);
      throw error;
    }
  }),

  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum(['adminmaster', 'admin', 'analista']),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userRole = ctx.user?.role;

      if (userRole === 'analista') {
        throw new Error('Você não tem permissão para criar usuários');
      }

      if (userRole === 'admin' && input.role === 'adminmaster') {
        throw new Error('Você não pode criar usuários com perfil adminmaster');
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let userId: string | undefined;

        const { data: { users: existingAuthUsers } } = await supabase.auth.admin.listUsers();
        const existingAuthUser = existingAuthUsers?.find(u => u.email === input.email);

        if (existingAuthUser) {
          userId = existingAuthUser.id;
          // Update existing user with new metadata
          await supabase.auth.admin.updateUserById(existingAuthUser.id, {
            user_metadata: {
              name: input.name,
              role: input.role,
            },
          });
        } else {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: input.email,
            password: input.password || Math.random().toString(36).slice(-8),
            email_confirm: true,
            user_metadata: {
              name: input.name,
              role: input.role,
            },
          });

          if (authError) {
            throw new Error(authError.message);
          }

          userId = authData.user?.id;
        }

        // Return formatted user data
        const data = [{
          id: 1,
          uid: userId,
          email: input.email,
          name: input.name,
          role: input.role,
          login_method: 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }];

        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'create',
          descricao: `Usuário criado: ${input.email} (${input.role})`,
          tipoDocumento: 'usuario',
          idDocumento: userId || 'unknown',
          dadosDepois: { email: input.email, role: input.role },
        });

        return data?.[0];
      } catch (error) {
        console.error('Erro ao criar usuario:', error);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        role: z.enum(['adminmaster', 'admin', 'analista']).optional(),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userRole = ctx.user?.role;

      if (userRole === 'analista') {
        throw new Error('Você não tem permissão para editar usuários');
      }

      if (input.password && userRole !== 'adminmaster') {
        throw new Error('Apenas adminmaster pode alterar senhas de usuários');
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get user from auth
        const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();
        const targetUser = allUsers?.find(u => u.email === input.email || u.id === String(input.id));

        if (listError || !targetUser) {
          throw new Error('Usuário não encontrado');
        }

        if (userRole === 'admin') {
          if (targetUser.user_metadata?.role === 'adminmaster') {
            throw new Error('Você não pode editar usuários com perfil adminmaster');
          }
          if (input.role === 'adminmaster') {
            throw new Error('Você não pode definir o perfil como adminmaster');
          }
        }

        if (input.password) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            targetUser.id,
            { password: input.password }
          );

          if (passwordError) {
            throw new Error('Erro ao atualizar senha: ' + passwordError.message);
          }
        }

        // Update user metadata in auth
        const updateMetadata: any = {};
        if (input.name) updateMetadata.name = input.name;
        if (input.role) updateMetadata.role = input.role;

        const { error } = await supabase.auth.admin.updateUserById(
          targetUser.id,
          { user_metadata: { ...targetUser.user_metadata, ...updateMetadata } }
        );

        if (error) {
          throw new Error(error.message);
        }

        const data = [{
          id: 1,
          uid: targetUser.id,
          email: input.email || targetUser.email || '',
          name: input.name || targetUser.user_metadata?.name || '',
          role: input.role || targetUser.user_metadata?.role || 'analista',
          login_method: 'email',
          created_at: targetUser.created_at,
          updated_at: new Date().toISOString(),
        }];

        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'update',
          descricao: `Usuário atualizado: ${input.email || targetUser.email}`,
          tipoDocumento: 'usuario',
          idDocumento: String(input.id),
          dadosAntes: { email: targetUser.email, role: targetUser.user_metadata?.role },
          dadosDepois: { email: input.email || targetUser.email, role: input.role || targetUser.user_metadata?.role },
        });
        
        return data?.[0];
      } catch (error) {
        console.error('Erro ao atualizar usuario:', error);
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userRole = ctx.user?.role;

      if (userRole === 'analista') {
        throw new Error('Você não tem permissão para deletar usuários');
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get user from auth
        const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();
        const targetUser = allUsers?.find(u => u.id === String(input.id));

        if (listError || !targetUser) {
          throw new Error('Usuário não encontrado');
        }

        if (userRole === 'admin' && targetUser.user_metadata?.role === 'adminmaster') {
          throw new Error('Você não pode deletar usuários com perfil adminmaster');
        }

        // Delete user from auth
        const { error } = await supabase.auth.admin.deleteUser(targetUser.id);

        if (error) {
          throw new Error(error.message);
        }

        await logAuditEvent({
          usuario: ctx.user?.email || 'unknown',
          usuarioNome: ctx.user?.name,
          acao: 'delete',
          descricao: `Usuário deletado: ${targetUser.email}`,
          tipoDocumento: 'usuario',
          idDocumento: String(input.id),
          dadosAntes: { email: targetUser.email, role: targetUser.user_metadata?.role },
        });

        return { success: true };
      } catch (error) {
        console.error('Erro ao deletar usuario:', error);
        throw error;
      }
    }),
});
