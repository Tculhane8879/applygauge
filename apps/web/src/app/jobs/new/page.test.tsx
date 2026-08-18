import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireSession: vi.fn() }));
vi.mock("@/lib/api/server", () => ({
  requireAuthenticatedApiSession: mocks.requireSession,
}));
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));
vi.mock("@/components/jobs/job-form", () => ({
  JobForm: () => <form aria-label="job form" />,
}));

import NewJobPage from "./page";

describe("NewJobPage", () => {
  it("requires authentication before rendering the create form", async () => {
    mocks.requireSession.mockResolvedValue(vi.fn());
    render(await NewJobPage());
    expect(mocks.requireSession).toHaveBeenCalledOnce();
    expect(screen.getByRole("form", { name: "job form" })).toBeInTheDocument();
  });
});
