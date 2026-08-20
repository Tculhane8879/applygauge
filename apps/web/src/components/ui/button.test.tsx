import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it } from "vitest";

import { Button, buttonStyles } from "./button";

describe("Button", () => {
  it("defaults to a non-submitting native button", () => {
    render(<Button>Action</Button>);

    expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("preserves native submit and disabled semantics", () => {
    render(
      <Button disabled type="submit">
        Saving…
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("type", "submit");
  });

  it.each([
    "primary",
    "secondary",
    "ghost",
    "destructive",
    "destructive-subtle",
  ] as const)("provides the %s variant", (variant) => {
    expect(buttonStyles({ variant })).toContain("focus-ring");
    expect(buttonStyles({ variant })).toMatch(
      variant === "primary"
        ? /bg-brand/
        : variant === "secondary"
          ? /border-line/
          : variant === "ghost"
            ? /bg-transparent/
            : /danger|red-50/,
    );
  });

  it("shares link-safe classes without changing element semantics", () => {
    render(
      <Link className={buttonStyles({ variant: "secondary" })} href="/jobs">
        Cancel
      </Link>,
    );

    expect(screen.getByRole("link", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });
});
