import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { unifiService } from '../services/unifiService';

export const unifiRouter = router({
  listDevices: protectedProcedure.query(async () => {
    return await unifiService.listDevices();
  }),

  provisionAgency: protectedProcedure
    .input(
      z.object({
        agencia: z.string().length(4, 'A agência deve conter 4 dígitos'),
        nomeFormatado: z.string().min(3, 'O nome da agência é obrigatório'),
        macs: z.array(
          z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Formato de MAC Address inválido')
        ).min(1, 'Informe ao menos 1 MAC address'),
      })
    )
    .mutation(async ({ input }) => {
      const result = await unifiService.provisionAgency(input);
      return {
        message: `Agência ${input.agencia} provisionada com sucesso!`,
        logs: result.logs,
      };
    }),
});