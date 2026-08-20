import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteJobButton } from "./delete-job-button";

describe("DeleteJobButton", () => {
  it("moves focus into confirmation and returns it on cancel", async () => {
    const action = vi.fn();
    render(<DeleteJobButton action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));
    expect(screen.getByRole("button", { name: "Delete job" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(action).not.toHaveBeenCalled();
    const trigger = screen.getByRole("button", { name: "Delete job" });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("invokes deletion once and displays a safe failure", async () => {
    const action = vi.fn().mockResolvedValue({
      success: false,
      formError: "We couldn't delete this job. Please try again.",
    });
    render(<DeleteJobButton action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "couldn't delete",
    );
    expect(action).toHaveBeenCalledOnce();
  });

  it("shows a pending state", async () => {
    let resolve!: (value: { success: false }) => void;
    const action = vi
      .fn()
      .mockReturnValue(new Promise((done) => (resolve = done)));
    render(<DeleteJobButton action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));
    expect(
      await screen.findByRole("button", { name: "Deleting…" }),
    ).toBeDisabled();
    resolve({ success: false });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete job" })).toBeEnabled(),
    );
  });
});
