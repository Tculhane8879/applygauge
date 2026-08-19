import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobSkillForm } from "./job-skill-form";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("JobSkillForm", () => {
  it("disables its controls while the mutation is pending", async () => {
    let resolve!: (value: { success: true }) => void;
    const action = vi.fn(
      () => new Promise<{ success: true }>((done) => (resolve = done)),
    );
    render(<JobSkillForm action={action} />);
    fireEvent.change(screen.getByLabelText("Skill name"), {
      target: { value: "Python" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));
    expect(
      await screen.findByRole("button", { name: "Adding…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Skill name")).toBeDisabled();
    resolve({ success: true });
  });

  it("submits the entered alias, clears on success, and refreshes", async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    render(<JobSkillForm action={action} />);
    const input = screen.getByLabelText("Skill name");
    fireEvent.change(input, { target: { value: "postgres" } });
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));
    await waitFor(() => expect(action).toHaveBeenCalledWith("postgres"));
    await waitFor(() => expect(input).toHaveValue(""));
    expect(refresh).toHaveBeenCalled();
  });

  it("preserves input and associates a safe failure message", async () => {
    const action = vi.fn().mockResolvedValue({
      success: false,
      formError: "That skill isn't available in the catalog yet.",
    });
    render(<JobSkillForm action={action} />);
    const input = screen.getByLabelText("Skill name");
    fireEvent.change(input, { target: { value: "unknown" } });
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "That skill isn't available in the catalog yet.",
    );
    expect(input).toHaveValue("unknown");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
  });
});
