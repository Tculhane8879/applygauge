import { describe, expect, it } from "vitest";

import { validateLogin, validateSignup } from "./validation";

describe("authentication validation", () => {
  it("requires login fields and validates email", () => {
    expect(validateLogin("", "")).toEqual({
      email: "Email is required.",
      password: "Password is required.",
    });
    expect(validateLogin("invalid", "password").email).toBe(
      "Enter a valid email address.",
    );
  });

  it("enforces signup password length and confirmation", () => {
    expect(validateSignup("person@example.test", "short", "different")).toEqual(
      {
        password: "Password must be at least 8 characters.",
        confirmPassword: "Passwords do not match.",
      },
    );
  });
});
