import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "./page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Home", () => {
  it("identifies the application", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ status: "ok" }),
      }),
    );

    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "ApplyGauge" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("API: connected")).toBeInTheDocument();
  });
});
