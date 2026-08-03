import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";

export const authRouter = router({
  me: publicProcedure.query((opts) => {
    if (!opts.ctx.user) return null;
    
    const role = opts.ctx.user.role || 'analista';
    
    return {
      uid: opts.ctx.user.openId,
      email: opts.ctx.user.email || '',
      name: opts.ctx.user.name || opts.ctx.user.email || '',
      role: role as 'adminmaster' | 'admin' | 'analista' | 'tecnico',
    };
  }),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    console.log('[Logout] Logout mutation called');
    console.log('[Logout] ctx.user:', ctx.user ? `${ctx.user.email} (${ctx.user.name})` : 'null');
    console.log('[Logout] Authorization header:', ctx.req.headers.authorization ? 'present' : 'missing');
    
    let userEmail = ctx.user?.email;
    let userName = ctx.user?.name;
    let userId = ctx.user?.openId;
    
    // Always try to extract from token if ctx.user is null
    if (!userEmail && ctx.req.headers.authorization?.startsWith('Bearer ')) {
      console.log('[Logout] ctx.user is null, extracting from token...');
      try {
        const token = ctx.req.headers.authorization.slice(7);
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          userEmail = payload.email;
          userId = payload.sub;
          console.log('[Logout] Extracted from token - email:', userEmail, 'userId:', userId);
          
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
              process.env.SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            if (userId) {
              const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
              if (authUser?.user_metadata?.name) {
                userName = authUser.user_metadata.name;
                console.log('[Logout] Got name from auth:', userName);
              }
            }
          } catch (e) {
            console.warn('[Logout] Failed to get user name from auth:', e);
          }
        }
      } catch (e) {
        console.warn('[Logout] Failed to extract email from token:', e);
      }
    }
    
    console.log('[Logout] Final values - email:', userEmail, 'name:', userName, 'userId:', userId);
    
    if (userEmail) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const timestamp = new Date().getTime();
        const dataFormatada = new Date(timestamp).toLocaleString('pt-BR');
        
        const auditLog = {
          timestamp,
          data_formatada: dataFormatada,
          usuario: userEmail,
          usuario_nome: userName || userEmail,
          acao: 'USUARIO_DESLOGADO',
          descricao: `${userName || userEmail} fez logout`,
          tipo_documento: 'login',
          id_documento: userId || 'unknown',
        };
        
        console.log('[Logout] Inserting audit log:', auditLog);
        const { error } = await supabase.from('audit_logs').insert([auditLog]);
        if (error) {
          console.error('[Logout] Failed to insert audit log:', error);
        } else {
          console.log('[Logout] Audit log inserted successfully for:', userEmail);
        }
      } catch (error) {
        console.error('[Logout] Failed to log logout:', error);
      }
    } else {
      console.warn('[Logout] Could not extract user email for logging - no audit log will be created');
    }
    
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

    return {
      success: true,
    } as const;
  }),
});
