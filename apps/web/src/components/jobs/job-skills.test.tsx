import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobSkills } from "./job-skills";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("JobSkills", () => {
  const actions = {
    addAction: vi.fn(),
    removeAction: vi.fn(),
  };

  it("renders the valid empty state", () => {
    render(<JobSkills {...actions} skills={[]} />);

    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByText("No skills added yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders canonical skill names in the provided order", () => {
    render(
      <JobSkills
        {...actions}
        skills={[
          { id: "python", name: "Python", category: "LANGUAGE" },
          { id: "postgres", name: "PostgreSQL", category: "DATABASE" },
        ]}
      />,
    );

    expect(
      within(screen.getByRole("list"))
        .getAllByRole("listitem")
        .map((item) => item.querySelector("span")?.textContent),
    ).toEqual(["Python", "PostgreSQL"]);
  });

  it("preserves punctuation-sensitive canonical display names exactly", () => {
    render(
      <JobSkills
        {...actions}
        skills={[
          { id: "c", name: "C", category: "LANGUAGE" },
          { id: "cpp", name: "C++", category: "LANGUAGE" },
          { id: "csharp", name: "C#", category: "LANGUAGE" },
          { id: "next", name: "Next.js", category: "FRAMEWORK" },
        ]}
      />,
    );

    for (const name of ["C", "C++", "C#", "Next.js"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.queryByText("cpp")).not.toBeInTheDocument();
    expect(screen.queryByText("NextJS")).not.toBeInTheDocument();
  });

  it("renders a safe unavailable state", () => {
    render(<JobSkills {...actions} skills={null} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Skills are unavailable right now.",
    );
    expect(screen.queryByLabelText("Skill name")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
