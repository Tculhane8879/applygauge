import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type StatusEventRead } from "@/lib/api/jobs";

import { StatusHistory } from "./status-history";

const events: StatusEventRead[] = [
  {
    id: "initial",
    from_status: null,
    to_status: "SAVED",
    changed_at: "2026-08-17T18:42:00Z",
  },
  {
    id: "applied",
    from_status: "SAVED",
    to_status: "APPLIED",
    changed_at: "2026-08-18T19:15:00Z",
  },
];

describe("StatusHistory", () => {
  it("renders initial and normal events in backend order with UTC timestamps", () => {
    render(<StatusHistory events={events} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Saved");
    expect(items[0]).not.toHaveTextContent(/None|null|→/);
    expect(items[0]).toHaveTextContent("Aug 17, 2026, 6:42 PM UTC");
    expect(items[1]).toHaveTextContent("Saved → Applied");
    expect(items[1]).toHaveTextContent("Aug 18, 2026, 7:15 PM UTC");
  });

  it.each([null, []])("renders a safe unavailable state for %j", (value) => {
    render(<StatusHistory events={value} />);
    expect(
      screen.getByText("Status history is unavailable."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
