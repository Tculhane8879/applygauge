import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert } from "./alert";

describe("Alert", () => {
  it("announces a concise title and safe message", () => {
    render(<Alert title="Page unavailable">Please try again later.</Alert>);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Page unavailable");
    expect(alert).toHaveTextContent("Please try again later.");
  });
});
