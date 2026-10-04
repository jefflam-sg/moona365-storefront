"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function NewsletterPreferencesContent() {
  const token = useSearchParams().get("token") ?? "";
  const [organization, setOrganization] = useState("");
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("Loading your email preferences…");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(
      `/api/newsletter/preferences?token=${encodeURIComponent(token)}`,
      {
        cache: "no-store",
      },
    )
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.message);
        setOrganization(value.organizationName);
        setAvailable(value.availableInterests ?? []);
        setSelected(value.interests ?? []);
        setMessage("");
        setReady(true);
      })
      .catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "Preference link is invalid or expired.",
        ),
      );
  }, [token]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, interests: selected }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.message);
      setMessage(
        value.status === "UNSUBSCRIBED"
          ? "You have been unsubscribed from email updates."
          : "Your email preferences have been saved.",
      );
      if (value.status === "UNSUBSCRIBED") setReady(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Preferences could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sf-width sf-newsletter-preferences">
      <span className="sf-eyebrow">EMAIL PREFERENCES</span>
      <h1>Choose what you receive</h1>
      {organization && <p>Manage email updates from {organization}.</p>}
      {message && <p role="status">{message}</p>}
      {ready && (
        <form onSubmit={save}>
          {available.map((interest) => (
            <label key={interest}>
              <input
                type="checkbox"
                checked={selected.includes(interest)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, interest]
                      : current.filter((item) => item !== interest),
                  )
                }
              />
              {interest}
            </label>
          ))}
          <small>Clear all options to unsubscribe from email updates.</small>
          <button className="sf-primary-button" disabled={busy} type="submit">
            {busy ? "Saving…" : "Save preferences"}
          </button>
        </form>
      )}
    </main>
  );
}

export default function NewsletterPreferencesPage() {
  return (
    <Suspense fallback={<main className="sf-width">Loading preferences…</main>}>
      <NewsletterPreferencesContent />
    </Suspense>
  );
}
