import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const signOut = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signOut } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { POST } from "./route";

describe("sign-out route", () => {
  it("signs out server-side and redirects to login", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/auth/signout", { method: "POST" }),
    );
    expect(signOut).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login",
    );
  });
});
