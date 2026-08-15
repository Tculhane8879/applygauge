import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiStatus } from "./api-status";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiStatus", () => {
  it("reports a successful backend connection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ status: "ok" }),
      }),
    );

    render(<ApiStatus />);

    expect(await screen.findByText("API: connected")).toBeInTheDocument();
  });

  it("reports an unavailable backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection refused")),
    );

    render(<ApiStatus />);

    expect(await screen.findByText("API: unavailable")).toBeInTheDocument();
  });
});
