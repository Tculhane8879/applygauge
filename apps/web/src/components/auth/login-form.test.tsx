import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword } }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows required-field errors", () => {
    render(<LoginForm />);
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form")!,
    );
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("shows a safe authentication failure", async () => {
    signInWithPassword.mockResolvedValue({ error: new Error("invalid") });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to sign in",
    );
  });

  it("disables submission while pending and redirects on success", async () => {
    let resolve!: (value: { error: null }) => void;
    signInWithPassword.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: "Please wait…" })).toBeDisabled();
    resolve({ error: null });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});
