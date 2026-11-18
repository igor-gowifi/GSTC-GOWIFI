import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import { solicitacoesRouter } from "./solicitacoes";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from }) }));

const creatorId = "7d793dd0-24e1-43f4-8453-e70186c7a0d2";
const assigneeId = "202af4e5-3811-4e64-b74b-9b18d68da4f9";
const date = new Date("2026-11-18T10:00:00Z");

function createContext(role: string): TrpcContext {
  return {
    user: {
      id: 1,
      openId: creatorId,
      name: "Beatriz",
      email: "beatriz@example.test",
      role,
      loginMethod: "email",
      createdAt: date,
      updatedAt: date,
      lastSignedIn: date,
    },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

beforeEach(() => vi.resetAllMocks());

describe("Filtros por responsável", () => {
  it.each([
    ["admin", { assigneeId }],
    ["analista", { schedulerId: creatorId }],
  ] as const)("rejeita o filtro indisponível para %s", async (role, input) => {
    const caller = solicitacoesRouter.createCaller(createContext(role));

    await expect(caller.filter(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(from).not.toHaveBeenCalled();
  });

  it.each([
    ["analista", { assigneeId }],
    ["admin", { schedulerId: creatorId }],
    ["adminmaster", { assigneeId, schedulerId: creatorId }],
  ] as const)("aplica os filtros autorizados para %s em todas as páginas", async (role, input) => {
    const row = {
      id: 489,
      solic_atribuido_a: assigneeId,
      solic_agendamento_responsavel_id: creatorId,
    };
    const firstPage = Promise.resolve({ data: [row], error: null });
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: firstPage.then.bind(firstPage),
      range: vi.fn()
        .mockResolvedValueOnce({ data: [{ ...row, id: 490 }], error: null })
        .mockResolvedValueOnce({ data: [], error: null }),
    };
    from.mockReturnValue(query);
    const caller = solicitacoesRouter.createCaller(createContext(role));

    await expect(caller.filter(input)).resolves.toMatchObject([
      { id: 489, assigneeId, schedulerId: creatorId },
      { id: 490, assigneeId, schedulerId: creatorId },
    ]);
    expect(query.eq.mock.calls).toEqual([
      ["solic_ativo", true],
      ...("assigneeId" in input ? [["solic_atribuido_a", assigneeId]] : []),
      ...("schedulerId" in input ? [["solic_agendamento_responsavel_id", creatorId]] : []),
    ]);
    expect(query.range.mock.calls).toEqual([[1, 1000], [2, 1001]]);
  });
});
