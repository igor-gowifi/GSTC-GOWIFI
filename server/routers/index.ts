import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./auth";
import { auditRouter } from "./audit";
import { tecnicosRouter } from "./tecnicos";
import { solicitacoesRouter } from "./solicitacoes";
import { usuariosRouter } from "./usuarios";
import { equipamentosRouter } from "./equipamentos";
import { profileRouter } from "./profile";
import { consoleRouter } from "./console";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  audit: auditRouter,
  tecnicos: tecnicosRouter,
  solicitacoes: solicitacoesRouter,
  usuarios: usuariosRouter,
  equipamentos: equipamentosRouter,
  profile: profileRouter,
  console: consoleRouter,
});

export type AppRouter = typeof appRouter;
