"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/account/password-reset", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const value = await response
      .json()
      .catch(() => ({ message: "Password reset is unavailable." }));
    setMessage(value.message);
    setBusy(false);
  }
  return (
    <main className="sf-width sf-account-activation">
      <span className="sf-eyebrow">CUSTOMER ACCOUNT</span>
      <h1>Reset your password</h1>
      <p>
        Enter your account email and we will send a secure reset link if an
        active account exists.
      </p>
      <form onSubmit={submit}>
        <label>
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {message && <p role="status">{message}</p>}
        <button className="sf-primary-button" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
        <Link href="/account/login">Return to sign in</Link>
      </form>
    </main>
  );
}
