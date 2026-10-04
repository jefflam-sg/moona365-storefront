"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const value = await response.json();
      if (!response.ok)
        throw new Error(value.message ?? "Registration failed.");
      setMessage(value.message);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Registration failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="sf-width sf-account-activation">
      <h1>Create an account</h1>
      <p>Your verified account uses the same membership in store and online.</p>
      <form onSubmit={submit}>
        <label>
          Name
          <input
            required
            maxLength={160}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
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
          {busy ? "Sending activation…" : "Create account"}
        </button>
        <small>
          We will email a secure activation link. Creating an account does not
          subscribe you to marketing.
        </small>
        <Link href="/account/login">Already have an account? Sign in</Link>
      </form>
    </section>
  );
}
