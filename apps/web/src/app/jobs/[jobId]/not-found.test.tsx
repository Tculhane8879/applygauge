import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));

import JobNotFound from "./not-found";

describe("JobNotFound", () => {
  it("explains the missing resource without exposing details and offers recovery", () => {
    render(<JobNotFound />);

    expect(
      screen.getByRole("heading", { name: "Job not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This saved job is unavailable or does not exist."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to saved jobs" }),
    ).toHaveAttribute("href", "/jobs");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
