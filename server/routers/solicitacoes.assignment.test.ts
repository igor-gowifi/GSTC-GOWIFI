import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import { sdk } from "../_core/sdk";
import { solicitacoesRouter } from "./solicitacoes";

const { supabase, logAuditEvent } = vi.hoisted(() => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      admin: { getUserById: vi.fn(), listUsers: vi.fn() },
    },
    from: vi.fn(),
  },
  logAuditEvent: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: () => supabase }));
vi.mock("../auditHelper", () => ({ logAuditEvent }));

const creatorId = "7d793dd0-24e1-43f4-8453-e70186c7a0d2";
const assigneeId = "202af4e5-3811-4e64-b74b-9b18d68da4f9";
const date = "2026-11-18T10:00:00Z";
const missingAssignmentColumn = {
  code: "PGRST204",
  message: "Could not find the 'solic_atribuido_a' column of 'solicitacoes' in the schema cache",
};
const missingSchedulingColumn = {
  code: "PGRST204",
  message: "Could not find the 'solic_agendamento_responsavel_id' column of 'solicitacoes' in the schema cache",
};
const creator = {
  id: 1,
  openId: creatorId,
  name: "Beatriz",
  email: "beatriz@example.test",
  role: "analista",
  loginMethod: "email",
  createdAt: new Date(date),
  updatedAt: new Date(date),
  lastSignedIn: new Date(date),
};

function createContext(user: TrpcContext["user"] = creator): TrpcContext {
  return {
    user,
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function authUser(id: string, name: string) {
  return {
    id,
    email: `${name.toLowerCase()}@example.test`,
    email_confirmed_at: date,
    user_metadata: { name },
  };
}

beforeEach(() => vi.resetAllMocks());

describe("Pessoa responsável pela OS", () => {
  it("lista usuários elegíveis em todas as páginas", async () => {
    supabase.auth.admin.listUsers
      .mockResolvedValueOnce({
        data: {
          nextPage: 2,
          users: [authUser(creatorId, "Beatriz"), {
            ...authUser("banned", "Bloqueado"),
            banned_until: "2100-01-01T00:00:00Z",
          }],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          nextPage: null,
          users: [authUser(assigneeId, "Ana"), {
            ...authUser("pending", "Pendente"),
            email_confirmed_at: undefined,
          }],
        },
        error: null,
      });

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.assignees()).resolves.toEqual([
      { id: assigneeId, name: "Ana" },
      { id: creatorId, name: "Beatriz" },
    ]);
    expect(supabase.auth.admin.listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 100 });
  });

  it("salva o usuário autenticado quando a opção é atribuir a mim", async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: authUser(creatorId, "Beatriz") },
      error: null,
    });
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 489, solic_atribuido_a: creatorId, solic_atribuido_a_nome: "Beatriz" },
        error: null,
      }),
    };
    supabase.from.mockReturnValue(query);

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.assign({ id: "489", assigneeId: "me" })).resolves.toMatchObject({
      assigneeId: creatorId,
      assigneeName: "Beatriz",
    });
    expect(supabase.auth.admin.getUserById).toHaveBeenCalledWith(creatorId);
    expect(query.update).toHaveBeenCalledWith({
      solic_atribuido_a: creatorId,
      solic_atribuido_a_nome: "Beatriz",
      solic_atualizado_por: creator.email,
    });
    expect(query.eq).toHaveBeenCalledWith("solic_ativo", true);
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ idDocumento: "489" }));
  });

  it("grava o nome de quem criou e de quem recebeu a nova OS", async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: authUser(assigneeId, "Ana") },
      error: null,
    });
    const insert = vi.fn(([row]) => ({
      select: vi.fn().mockResolvedValue({ data: [{ id: 489, ...row }], error: null }),
    }));
    supabase.from.mockReturnValue({ insert });

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.create({ nomeAtividade: "OS teste", assigneeId })).resolves.toMatchObject({
      creatorName: "Beatriz",
      assigneeId,
      assigneeName: "Ana",
    });
    expect(insert).toHaveBeenCalledWith([expect.objectContaining({
      solic_criado_por: creator.email,
      solic_criado_por_nome: "Beatriz",
      solic_atribuido_a: assigneeId,
      solic_atribuido_a_nome: "Ana",
    })]);
  });

  it("detecta quando as colunas ficam disponíveis sem reiniciar o servidor", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce({
        error: { code: "42703", message: "column solicitacoes.solic_criado_por_nome does not exist" },
      }).mockResolvedValueOnce({ error: null }),
    };
    supabase.from.mockReturnValue(query);

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.assignmentAvailable()).resolves.toBe(false);
    await expect(caller.assignmentAvailable()).resolves.toBe(true);
    expect(query.limit).toHaveBeenCalledWith(0);
  });

  it("cria a OS sem responsável enquanto a tabela ainda usa o esquema antigo", async () => {
    const insert = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: null, error: missingAssignmentColumn }),
      })
      .mockImplementationOnce(([row]) => ({
        select: vi.fn().mockResolvedValue({ data: [{ id: 489, ...row }], error: null }),
      }));
    supabase.from.mockReturnValue({ insert });

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.create({ nomeAtividade: "OS teste", assigneeId: null })).resolves.toMatchObject({
      creatorName: creator.email,
      assigneeId: null,
    });
    const [row] = insert.mock.calls[1][0];
    expect(row).not.toHaveProperty("solic_criado_por_nome");
    expect(row).not.toHaveProperty("solic_atribuido_a");
    expect(row).not.toHaveProperty("solic_atribuido_a_nome");
    expect(logAuditEvent).toHaveBeenCalledTimes(1);
  });

  it("pede a atualização do banco se houver seleção explícita de um responsável", async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: authUser(creatorId, "Beatriz") },
      error: null,
    });
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: missingAssignmentColumn }),
    });
    supabase.from.mockReturnValue({ insert });

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.create({ nomeAtividade: "OS teste", assigneeId: "me" }))
      .rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it("recusa usuários indisponíveis antes de atualizar a OS", async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { ...authUser(assigneeId, "Ana"), is_anonymous: true } },
      error: null,
    });

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.assign({ id: "489", assigneeId })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("exige uma sessão autenticada para listar usuários e atribuir a OS", async () => {
    const caller = solicitacoesRouter.createCaller(createContext(null));

    await expect(caller.assignees()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.assign({ id: "489", assigneeId: "me" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(supabase.auth.admin.listUsers).not.toHaveBeenCalled();
  });

  it("valida o token no Supabase ao identificar o autor da OS", async () => {
    const req = createContext().req;
    req.headers.authorization = "Bearer token-de-teste";
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Sessão inválida"),
    });

    await expect(sdk.authenticateRequest(req)).rejects.toThrow("Invalid session");
    expect(supabase.auth.getUser).toHaveBeenCalledWith("token-de-teste");
    expect(supabase.auth.admin.getUserById).not.toHaveBeenCalled();
  });
});

describe("Pessoa responsável pelo agendamento", () => {
  const editorContext = createContext({ ...creator, role: "admin" });
  const vinicius = {
    ...authUser(assigneeId, "Vinicius Bevilacqua"),
    email: "vinicius.bevilaqua@gowifi.com.br",
  };
  const okidathe = {
    ...authUser(creatorId, "Okidathe"),
    email: "okidathe.cocamaro@gowifi.com.br",
  };

  it("lista apenas as duas contas habilitadas para agendamento", async () => {
    supabase.auth.admin.listUsers.mockResolvedValue({
      data: { users: [vinicius, authUser("other", "Outra Pessoa"), okidathe], nextPage: null },
      error: null,
    });

    const caller = solicitacoesRouter.createCaller(editorContext);
    await expect(caller.schedulingAssignees()).resolves.toEqual([
      { id: creatorId, name: "Okidathe Cocamaro" },
      { id: assigneeId, name: "Vinicius Bevilaqua" },
    ]);
  });

  it.each(["admin", "adminmaster", "tecnico"])(
    "permite a %s salvar e remover a atribuição sem sobrescrever o responsável pela OS",
    async role => {
      supabase.auth.admin.getUserById.mockResolvedValue({ data: { user: vinicius }, error: null });
      const existingRow = { id: 489, solic_atribuido_a: creatorId, solic_atribuido_a_nome: creator.name };
      const update = vi.fn((assignment) => ({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { ...existingRow, ...assignment }, error: null }),
      }));
      supabase.from.mockReturnValue({ update });

      const caller = solicitacoesRouter.createCaller(createContext({ ...creator, role }));
      await expect(caller.assignScheduler({ id: "489", schedulerId: assigneeId })).resolves.toMatchObject({
        assigneeId: creatorId,
        schedulerId: assigneeId,
        schedulerName: "Vinicius Bevilaqua",
      });
      await expect(caller.assignScheduler({ id: "489", schedulerId: null })).resolves.toMatchObject({
        assigneeId: creatorId,
        schedulerId: null,
        schedulerName: null,
      });
      expect(update).toHaveBeenNthCalledWith(1, {
        solic_agendamento_responsavel_id: assigneeId,
        solic_agendamento_responsavel_nome: "Vinicius Bevilaqua",
        solic_atualizado_por: creator.email,
      });
    }
  );

  it("recusa salvar uma conta ativa fora das opções de agendamento", async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: authUser(assigneeId, "Ana") },
      error: null,
    });

    const caller = solicitacoesRouter.createCaller(editorContext);
    await expect(caller.assignScheduler({ id: "489", schedulerId: assigneeId }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("permite criar uma OS com responsável e sem agendamento antes da migração", async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: authUser(assigneeId, "Ana") },
      error: null,
    });
    const insert = vi.fn(([row]) => ({
      select: vi.fn().mockResolvedValue({ data: [{ id: 489, ...row }], error: null }),
    }));
    supabase.from.mockReturnValue({ insert });

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.create({ nomeAtividade: "OS teste", assigneeId, schedulerId: null }))
      .resolves.toMatchObject({ assigneeId, schedulerId: null });
    expect(insert.mock.calls[0][0][0]).not.toHaveProperty("solic_agendamento_responsavel_id");
  });

  it("sinaliza a migração pendente se um agendador foi selecionado na criação", async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({ data: { user: vinicius }, error: null });
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: missingSchedulingColumn }),
    });
    supabase.from.mockReturnValue({ insert });

    const caller = solicitacoesRouter.createCaller(editorContext);
    await expect(caller.create({ nomeAtividade: "OS teste", schedulerId: assigneeId }))
      .rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("permite que analistas consultem quem foi atribuído ao agendamento", async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 489,
          solic_agendamento_responsavel_id: assigneeId,
          solic_agendamento_responsavel_nome: vinicius.user_metadata.name,
        },
        error: null,
      }),
    });

    const caller = solicitacoesRouter.createCaller(createContext());
    await expect(caller.getById({ id: "489" })).resolves.toMatchObject({
      schedulerId: assigneeId,
      schedulerName: "Vinicius Bevilaqua",
    });
  });

  it("impede que analistas atribuam, removam ou definam um agendador na criação", async () => {
    const caller = solicitacoesRouter.createCaller(createContext());

    await expect(caller.schedulingAssignees()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.assignScheduler({ id: "489", schedulerId: assigneeId }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.assignScheduler({ id: "489", schedulerId: null }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.create({ nomeAtividade: "OS teste", schedulerId: assigneeId }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.auth.admin.getUserById).not.toHaveBeenCalled();
  });
});
