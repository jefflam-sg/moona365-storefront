"use client";

import { useEffect, useState } from "react";
import type { PreviewStorefrontBootstrap } from "@/lib/bootstrap";
import { StorefrontRenderer } from "@/storefront/storefront-renderer";

type State =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "ready"; preview: PreviewStorefrontBootstrap };

export function PreviewClient() {
  const [state, setState] = useState<State>({ kind: "loading" });
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      queueMicrotask(() => setState({ kind: "invalid" }));
      return;
    }
    const controller = new AbortController();
    void fetch("/api/preview", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Preview not found");
        return (await response.json()) as PreviewStorefrontBootstrap;
      })
      .then((preview) => setState({ kind: "ready", preview }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "invalid" });
      });
    return () => controller.abort();
  }, []);

  if (state.kind === "loading") return <p>Opening secure preview…</p>;
  if (state.kind === "invalid") return <p>This preview is invalid or has expired.</p>;
  return <StorefrontRenderer snapshot={state.preview.snapshot} preview />;
}
