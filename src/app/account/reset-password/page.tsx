"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    const token =
      new URLSearchParams(window.location.search).get("token") ?? "";
    const response = await fetch("/api/account/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const value = await response
      .json()
      .catch(() => ({ message: "Password reset failed." }));
    if (response.ok) {
      router.replace("/account");
      router.refresh();
      return;
    }
    setMessage(value.message);
    setBusy(false);
  }
  return (
    <section className="sf-width sf-account-activation">
      <h1>Choose a new password</h1>
      <p>
        Use at least 10 characters with upper-case, lower-case and a number.
      </p>
      <form onSubmit={submit}>
        <label>
          New password
          <input
            required
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          Confirm password
          <input
            required
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        {message && <p role="alert">{message}</p>}
        <button className="sf-primary-button" disabled={busy}>
          {busy ? "Updating…" : "Set new password"}
        </button>
      </form>
    </section>
  );
}
