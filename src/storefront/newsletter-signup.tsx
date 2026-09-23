"use client";

import { useState, type FormEvent } from "react";

export function NewsletterSignup({ heading, description, buttonLabel, interests }: { heading: string; description: string; buttonLabel: string; interests: string[] }) {
  const [preference, setPreference] = useState<"EMAIL" | "WHATSAPP" | "BOTH">("EMAIL");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const needsPhone = preference !== "EMAIL";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setStatus("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), phone: form.get("phone"), company: form.get("company"), communicationPreference: preference, interests: form.getAll("interests"), consent: form.get("consent") === "yes" }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Could not subscribe just now.");
      event.currentTarget.reset(); setPreference("EMAIL"); setStatus("Thank you. You are subscribed.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not subscribe just now."); }
    finally { setSubmitting(false); }
  }
  return <form className="sf-footer-newsletter" onSubmit={submit}><h2>{heading}</h2>{description && <p>{description}</p>}<div className="sf-footer-newsletter-fields"><label>Name<input name="name" maxLength={120} autoComplete="name" required /></label><label>Email <span>*</span><input name="email" type="email" maxLength={254} autoComplete="email" required /></label>{needsPhone && <label>Phone number <span>*</span><input name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="e.g. 8123 4567 or +60…" required /></label>}<input className="sf-newsletter-trap" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" /></div>
    {interests.length > 0 && <fieldset><legend>Select your interest(s)</legend>{interests.map((interest) => <label key={interest}><input type="checkbox" name="interests" value={interest} /> {interest}</label>)}</fieldset>}
    <fieldset><legend>Select how you would like to receive updates</legend><label><input type="radio" name="preference" value="EMAIL" checked={preference === "EMAIL"} onChange={() => setPreference("EMAIL")} /> Email</label><label><input type="radio" name="preference" value="WHATSAPP" checked={preference === "WHATSAPP"} onChange={() => setPreference("WHATSAPP")} /> WhatsApp</label><label><input type="radio" name="preference" value="BOTH" checked={preference === "BOTH"} onChange={() => setPreference("BOTH")} /> WhatsApp &amp; Email</label></fieldset>
    <label className="sf-newsletter-consent"><input type="checkbox" name="consent" value="yes" required /> I agree to receive these updates and can unsubscribe at any time.</label><button type="submit" disabled={submitting}>{submitting ? "Subscribing…" : buttonLabel}</button>{status && <p role="status" className="sf-newsletter-status">{status}</p>}</form>;
}
