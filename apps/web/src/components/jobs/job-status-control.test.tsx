import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobStatusControl } from "./job-status-control";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("JobStatusControl", () => {
  it("shows all statuses and disables the current-status no-op", () => {
    const action = vi.fn();
    render(<JobStatusControl action={action} currentStatus="SAVED" />);
    expect(screen.getByLabelText("Application status")).toHaveValue("SAVED");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "Saved",
      "Applied",
      "Screening",
      "Interview",
      "Offer",
      "Rejected",
      "Withdrawn",
    ]);
    expect(
      screen.getByRole("button", { name: "Update status" }),
    ).toBeDisabled();
    expect(action).not.toHaveBeenCalled();
  });

  it("enables and submits a different status then refreshes server data", async () => {
    const action = vi.fn().mockResolvedValue({ success: true });
    render(<JobStatusControl action={action} currentStatus="SAVED" />);
    fireEvent.change(screen.getByLabelText("Application status"), {
      target: { value: "APPLIED" },
    });
    const button = screen.getByRole("button", { name: "Update status" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(action).toHaveBeenCalledWith("APPLIED"));
    expect(refresh).toHaveBeenCalled();
  });

  it("disables controls and shows Updating while pending", async () => {
    let resolve!: (value: { success: true }) => void;
    const action = vi
      .fn()
      .mockReturnValue(new Promise((done) => (resolve = done)));
    render(<JobStatusControl action={action} currentStatus="SAVED" />);
    fireEvent.change(screen.getByLabelText("Application status"), {
      target: { value: "APPLIED" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update status" }));
    expect(
      await screen.findByRole("button", { name: "Updating…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Application status")).toBeDisabled();
    resolve({ success: true });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Update status" }),
      ).toBeEnabled(),
    );
  });

  it.each([
    "This job already has that status.",
    "We couldn't update this status. Please try again.",
  ])("renders a safe associated error: %s", async (formError) => {
    const action = vi.fn().mockResolvedValue({ success: false, formError });
    render(<JobStatusControl action={action} currentStatus="SAVED" />);
    const select = screen.getByLabelText("Application status");
    fireEvent.change(select, { target: { value: "APPLIED" } });
    fireEvent.click(screen.getByRole("button", { name: "Update status" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(formError);
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAttribute("aria-describedby", alert.id);
  });
});
