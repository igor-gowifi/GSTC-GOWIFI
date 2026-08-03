import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const consoleRouter = router({

    getLogs: protectedProcedure.query(async ({ ctx }) => {
      const userRole = ctx.user?.role;

      // Only admin and adminmaster can access console
      if (userRole === 'analista') {
        throw new Error('Você não tem permissão para acessar o console');
      }

      try {
        const { getAuditLogsByRole } = await import('../db');
        const logs = await getAuditLogsByRole(userRole || 'analista', 1000);
        return logs;
      } catch (error) {
        console.error('[tRPC] Error fetching audit logs:', error);
        throw error;
      }
    }),

    getLogsByAction: protectedProcedure
      .input(z.object({ acao: z.string() }))
      .query(async ({ ctx, input }) => {
        const userRole = ctx.user?.role;

        if (userRole === 'analista') {
          throw new Error('Você não tem permissão para acessar o console');
        }

        try {
          const { getAuditLogs } = await import('../db');
          let logs = await getAuditLogs(1000);
          
          // Filter by action
          logs = logs.filter((log: any) => log.acao?.includes(input.acao));
          
          // Apply role-based filtering
          if (userRole === 'admin') {
            logs = logs.filter((log: any) => !log.acao?.includes('adminmaster'));
          }
          
          return logs;
        } catch (error) {
          console.error('[tRPC] Error fetching audit logs by action:', error);
          throw error;
        }
      }),
});
