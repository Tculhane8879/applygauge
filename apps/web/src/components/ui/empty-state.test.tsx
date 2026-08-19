import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders product-specific copy and an optional action", () => {
    render(
      <EmptyState
        action={<Link href="/jobs/new">Add job</Link>}
        description="Save an opportunity to begin."
        title="No saved jobs yet"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No saved jobs yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Save an opportunity to begin."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add job" })).toHaveAttribute(
      "href",
      "/jobs/new",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
