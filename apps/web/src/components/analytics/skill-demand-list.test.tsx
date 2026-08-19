import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkillDemandList } from "./skill-demand-list";

describe("SkillDemandList", () => {
  it("preserves exact names and keeps text alongside decorative bars", () => {
    render(
      <SkillDemandList
        ranked
        skills={[
          {
            id: "cpp",
            name: "C++",
            category: "LANGUAGE",
            job_count: 1,
            job_percentage: 25,
          },
          {
            id: "long",
            name: "A Very Long Technology Name",
            category: "OTHER",
            job_count: 2,
            job_percentage: 50,
          },
        ]}
      />,
    );

    expect(screen.getByText("C++")).toBeInTheDocument();
    expect(screen.getByText("A Very Long Technology Name")).toBeInTheDocument();
    expect(screen.getByText(/1 job/)).toHaveTextContent("25.0%");
    expect(screen.getByText(/2 jobs/)).toHaveTextContent("50.0%");
    expect(document.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });
});
