"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function NewsletterUnsubscribeContent() {
  const token = useSearchParams().get("token") ?? "";
  const [message, setMessage] = useState("Checking your unsubscribe link...");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(
      `/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
      {
        cache: "no-store",
      },
    )
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.message);
        if (value.unsubscribed) {
          setMessage("This email address is already unsubscribed.");
          return;
        }
        setMessage(`Stop email updates from ${value.organizationName}?`);
        setReady(true);
      })
      .catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "Unsubscribe link is invalid or expired.",
        ),
      );
  }, [token]);

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.message);
      setMessage("You have been unsubscribed from email updates.");
      setReady(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not unsubscribe just now.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="sf-width"
      style={{ paddingBlock: "80px", maxWidth: "720px" }}
    >
      <span className="sf-eyebrow">EMAIL SUBSCRIPTION</span>
      <h1>Unsubscribe</h1>
      <p role="status">{message}</p>
      {ready && (
        <button
          className="sf-primary-button"
          type="button"
          disabled={busy}
          onClick={() => void unsubscribe()}
        >
          {busy ? "Unsubscribing..." : "Unsubscribe"}
        </button>
      )}
    </main>
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <Suspense
      fallback={<main className="sf-width">Checking your link...</main>}
    >
      <NewsletterUnsubscribeContent />
    </Suspense>
  );
}
