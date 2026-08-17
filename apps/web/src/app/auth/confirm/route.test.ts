import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp } }),
}));

import { GET } from "./route";

describe("confirmation route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("verifies a token hash and redirects to dashboard", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/confirm?token_hash=hash&type=email",
      ),
    );
    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "hash",
      type: "email",
    });
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
  });

  it("redirects missing or invalid tokens to a safe error page", async () => {
    const missing = await GET(
      new NextRequest("http://localhost:3000/auth/confirm"),
    );
    expect(missing.headers.get("location")).toBe(
      "http://localhost:3000/auth/confirm/error",
    );
    verifyOtp.mockResolvedValue({ error: new Error("expired") });
    const invalid = await GET(
      new NextRequest(
        "http://localhost:3000/auth/confirm?token_hash=bad&type=email",
      ),
    );
    expect(invalid.headers.get("location")).toBe(
      "http://localhost:3000/auth/confirm/error",
    );
  });
});
