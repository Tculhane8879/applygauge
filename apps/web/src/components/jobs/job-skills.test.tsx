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
    expect(
      screen.getByText(
        "Skills can be added manually or detected from the saved job description.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("No skills added yet.")).toBeInTheDocument();
    expect(screen.getByLabelText("Skill name")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders canonical skill names in the provided order", () => {
    render(
      <JobSkills
        {...actions}
        skills={[
          {
            id: "python",
            name: "Python",
            category: "LANGUAGE",
            sources: ["DETECTED"],
          },
          {
            id: "postgres",
            name: "PostgreSQL",
            category: "DATABASE",
            sources: ["MANUAL"],
          },
          {
            id: "react",
            name: "React",
            category: "FRAMEWORK",
            sources: ["MANUAL", "DETECTED"],
          },
        ]}
      />,
    );

    expect(
      within(screen.getByRole("list"))
        .getAllByRole("listitem")
        .map((item) => item.querySelector("p")?.textContent),
    ).toEqual(["Python", "PostgreSQL", "React"]);
    expect(screen.getByText("Detected")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Manual + detected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Python" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove React" }),
    ).toBeInTheDocument();
  });

  it("preserves punctuation-sensitive canonical display names exactly", () => {
    render(
      <JobSkills
        {...actions}
        skills={[
          { id: "cpp", name: "C++", category: "LANGUAGE", sources: ["MANUAL"] },
          {
            id: "csharp",
            name: "C#",
            category: "LANGUAGE",
            sources: ["DETECTED"],
          },
          {
            id: "next",
            name: "Next.js",
            category: "FRAMEWORK",
            sources: ["MANUAL", "DETECTED"],
          },
          {
            id: "dotnet",
            name: ".NET",
            category: "FRAMEWORK",
            sources: ["MANUAL"],
          },
        ]}
      />,
    );

    for (const name of ["C++", "C#", "Next.js", ".NET"]) {
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
    expect(screen.queryByText(/suppression/i)).not.toBeInTheDocument();
  });
});
