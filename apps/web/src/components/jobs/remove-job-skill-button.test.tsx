import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RemoveJobSkillButton } from "./remove-job-skill-button";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("RemoveJobSkillButton", () => {
  it("disables only its control while removal is pending", async () => {
    let resolve!: (value: { success: true }) => void;
    const action = vi.fn(
      () => new Promise<{ success: true }>((done) => (resolve = done)),
    );
    render(<RemoveJobSkillButton action={action} skillName="Python" />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Python" }));
    expect(
      await screen.findByRole("button", { name: "Removing Python…" }),
    ).toBeDisabled();
    resolve({ success: true });
  });

  it("removes the identified skill and refreshes after success", async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    render(<RemoveJobSkillButton action={action} skillName="C++" />);
    fireEvent.click(screen.getByRole("button", { name: "Remove C++" }));
    await waitFor(() => expect(action).toHaveBeenCalledWith());
    expect(refresh).toHaveBeenCalled();
  });

  it("renders a safe mutation failure", async () => {
    const action = vi.fn().mockResolvedValue({
      success: false,
      formError: "We couldn't update these skills. Please try again.",
    });
    render(<RemoveJobSkillButton action={action} skillName="Python" />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Python" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't update these skills. Please try again.",
    );
  });
});
