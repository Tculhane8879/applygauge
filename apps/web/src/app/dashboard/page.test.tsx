import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  getSession: vi.fn(),
  getAuthenticatedIdentity: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: mocks.getClaims, getSession: mocks.getSession },
  }),
}));
vi.mock("@/lib/api", () => ({
  getAuthenticatedIdentity: (...args: unknown[]) =>
    mocks.getAuthenticatedIdentity(...args),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when verified claims are missing", async () => {
    mocks.getClaims.mockResolvedValue({ data: null });
    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("displays identity independently verified by FastAPI", async () => {
    mocks.getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-id",
          email: "person@example.test",
          role: "authenticated",
          is_anonymous: false,
        },
      },
    });
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
    mocks.getAuthenticatedIdentity.mockResolvedValue({
      id: "user-id",
      email: "person@example.test",
      session_id: "session-id",
    });
    render(await DashboardPage());
    expect(
      screen.getByText("Signed in as person@example.test"),
    ).toBeInTheDocument();
    expect(screen.getByText("Verified backend identity")).toBeInTheDocument();
    expect(screen.getByText("User ID: user-id")).toBeInTheDocument();
    expect(screen.queryByText("session-id")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Saved Jobs/ })).toHaveAttribute(
      "href",
      "/jobs",
    );
  });

  it("shows a safe error if FastAPI cannot verify the session", async () => {
    mocks.getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-id",
          email: "person@example.test",
          role: "authenticated",
          is_anonymous: false,
        },
      },
    });
    mocks.getAuthenticatedIdentity.mockRejectedValue(new Error("unavailable"));
    render(await DashboardPage());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "FastAPI could not verify",
    );
  });
});
