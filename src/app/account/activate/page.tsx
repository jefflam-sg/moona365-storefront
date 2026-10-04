"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function AccountActivationContent() {
  const token = useSearchParams().get("token") ?? "";
  const [organization, setOrganization] = useState("");
  const [requiresExistingPassword, setRequiresExistingPassword] =
    useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("Checking your activation link…");
  const [ready, setReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/account/activation?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.message);
        setOrganization(value.organizationName);
        setRequiresExistingPassword(value.requiresExistingPassword === true);
        setMessage("");
        setReady(true);
      })
      .catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "Activation link is invalid or expired.",
        ),
      );
  }, [token]);

  async function activate(event: FormEvent) {
    event.preventDefault();
    if (!requiresExistingPassword && password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.message);
      setActivated(true);
      setReady(false);
      setMessage("Your customer account is active.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Account activation could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sf-width sf-account-activation">
      <span className="sf-eyebrow">CUSTOMER ACCOUNT</span>
      <h1>Activate your account</h1>
      {organization && <p>Complete your account for {organization}.</p>}
      {message && <p role="status">{message}</p>}
      {ready && (
        <form onSubmit={activate}>
          <label>
            {requiresExistingPassword
              ? "Existing Moona365 password"
              : "Create a password"}
            <input
              required
              type="password"
              minLength={10}
              autoComplete={
                requiresExistingPassword ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {!requiresExistingPassword && (
            <label>
              Confirm password
              <input
                required
                type="password"
                minLength={10}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
          )}
          <small>
            Use at least 10 characters with upper-case, lower-case and a number.
          </small>
          <button className="sf-primary-button" disabled={busy} type="submit">
            {busy ? "Activating…" : "Activate account"}
          </button>
        </form>
      )}
      {activated && <Link href="/account">View your account</Link>}
    </main>
  );
}

export default function AccountActivationPage() {
  return (
    <Suspense fallback={<main className="sf-width">Checking your link…</main>}>
      <AccountActivationContent />
    </Suspense>
  );
}
