import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell, type AppSection } from "./app-shell";

const expectedDestinations = [
  ["Dashboard", "/dashboard"],
  ["Jobs", "/jobs"],
  ["Insights", "/insights"],
] as const;

describe("AppShell", () => {
  it.each<AppSection>(["dashboard", "jobs", "insights"])(
    "marks only the %s destination as current",
    (activeSection) => {
      render(
        <AppShell
          activeSection={activeSection}
          description="Page context"
          title="Page title"
        >
          <p>Content</p>
        </AppShell>,
      );

      const navigation = screen.getByRole("navigation", { name: "Primary" });
      const links = within(navigation).getAllByRole("link");
      expect(links).toHaveLength(3);

      for (const [label, href] of expectedDestinations) {
        const link = within(navigation).getByRole("link", { name: label });
        expect(link).toHaveAttribute("href", href);
        if (label.toLowerCase() === activeSection) {
          expect(link).toHaveAttribute("aria-current", "page");
        } else {
          expect(link).not.toHaveAttribute("aria-current");
        }
      }
    },
  );

  it("keeps sign out as a native POST form outside the destination list", () => {
    render(
      <AppShell
        activeSection="dashboard"
        description="Page context"
        title="Page title"
      >
        <p>Content</p>
      </AppShell>,
    );

    const signOut = screen.getByRole("button", { name: "Sign out" });
    expect(signOut).toHaveClass(
      "!text-frame-muted",
      "hover:!bg-white/10",
      "hover:!text-white",
    );
    expect(signOut).toHaveAttribute("type", "submit");
    expect(signOut.closest("form")).toHaveAttribute("action", "/auth/signout");
    expect(signOut.closest("form")).toHaveAttribute("method", "post");
  });
});
