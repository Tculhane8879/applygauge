"use client";

import { useEffect, useState } from "react";

import { getApiHealth } from "@/lib/api";

type ApiState = "checking" | "connected" | "unavailable";

export function ApiStatus() {
  const [state, setState] = useState<ApiState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    void getApiHealth(controller.signal)
      .then(() => setState("connected"))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setState("unavailable");
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <p className="mt-8 text-sm text-slate-500" role="status">
      API: {state}
    </p>
  );
}
