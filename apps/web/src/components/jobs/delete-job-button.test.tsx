import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteJobButton } from "./delete-job-button";

describe("DeleteJobButton", () => {
  it("requires confirmation and cancel does not invoke deletion", () => {
    const action = vi.fn();
    render(<DeleteJobButton action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("invokes deletion once and displays a safe failure", async () => {
    const action = vi.fn().mockResolvedValue({
      success: false,
      formError: "We couldn't delete this job. Please try again.",
    });
    render(<DeleteJobButton action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(
      await screen.findByRole("button", { name: "Deleting…" }),
    ).toBeDisabled();
    resolve({ success: false });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Confirm delete" }),
      ).toBeEnabled(),
    );
  });
});
