"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function NewsletterConfirmationContent() {
  const token = useSearchParams().get("token") ?? "";
  const [message, setMessage] = useState("Checking your confirmation link...");
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(
      `/api/newsletter/confirmation?token=${encodeURIComponent(token)}`,
      {
        cache: "no-store",
      },
    )
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.message);
        setMessage(`Confirm email updates from ${value.organizationName}.`);
        setReady(true);
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Confirmation link is invalid or expired.",
        );
        setInvalid(true);
      });
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/newsletter/confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.message);
      setMessage("Your email subscription is confirmed.");
      setReady(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not confirm your subscription.",
      );
      setReady(false);
      setInvalid(true);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    try {
      await fetch("/api/newsletter/confirmation/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMessage(
        "If that subscription is pending, a new confirmation email is on its way.",
      );
      setInvalid(false);
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
      <h1>Confirm your subscription</h1>
      <p role="status">{message}</p>
      {ready && (
        <button
          className="sf-primary-button"
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
        >
          {busy ? "Confirming..." : "Confirm subscription"}
        </button>
      )}
      {invalid && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void resend();
          }}
        >
          <label htmlFor="newsletter-resend-email">Email address</label>
          <input
            id="newsletter-resend-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button className="sf-primary-button" type="submit" disabled={busy}>
            {busy ? "Sending..." : "Send a new confirmation link"}
          </button>
        </form>
      )}
    </main>
  );
}

export default function NewsletterConfirmationPage() {
  return (
    <Suspense
      fallback={<main className="sf-width">Checking your link...</main>}
    >
      <NewsletterConfirmationContent />
    </Suspense>
  );
}
