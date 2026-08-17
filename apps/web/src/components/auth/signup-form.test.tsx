import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signUp = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signUp } }),
}));

import { SignupForm } from "./signup-form";

function fill(password = "password", confirmation = password) {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "person@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: confirmation },
  });
}

describe("SignupForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates password length and matching", () => {
    render(<SignupForm />);
    fill("short", "different");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Password must be at least 8 characters."),
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("shows the confirmation-required state", async () => {
    signUp.mockResolvedValue({ error: null });
    render(<SignupForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Check your email",
    );
  });

  it("shows a safe Supabase error", async () => {
    signUp.mockResolvedValue({ error: new Error("failure") });
    render(<SignupForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to create the account",
    );
  });
});
