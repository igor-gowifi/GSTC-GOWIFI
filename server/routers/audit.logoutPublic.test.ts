import { describe, expect, it } from "vitest";
import { appRouter } from "./index";

describe("audit.logoutPublic", () => {
  it("should register logout event without authentication", async () => {
    // Create a caller without authentication context
    const caller = appRouter.createCaller({
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {} as any,
    });

    const result = await caller.audit.logoutPublic({
      usuario: "test@example.com",
      usuarioNome: "Test User",
      idDocumento: "test-user-id",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should handle missing usuarioNome gracefully", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {} as any,
    });

    const result = await caller.audit.logoutPublic({
      usuario: "test@example.com",
      idDocumento: "test-user-id",
    });

    expect(result.success).toBe(true);
  });
});
