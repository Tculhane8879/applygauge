import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("presents the v1 product and authentication actions", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "ApplyGauge" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Track opportunities/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.queryByText(/Engineering foundation/),
    ).not.toBeInTheDocument();
  });
});
