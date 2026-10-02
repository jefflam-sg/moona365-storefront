"use client";

import { useState, type FormEvent } from "react";
import type { StorefrontIconName } from "./contracts";
import { StorefrontIcon } from "./icons";

type NewsletterInterest = {
  id: string;
  label: string;
  icon: StorefrontIconName;
};

export function NewsletterSignup({
  buttonLabel,
  interests,
  preview = false,
}: {
  buttonLabel: string;
  interests: NewsletterInterest[];
  preview?: boolean;
}) {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) return;
    setSubmitting(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          phone: form.get("phone"),
          company: form.get("company"),
          communicationPreference: "EMAIL",
          interests: form.getAll("interests"),
          consent: form.get("consent") === "yes",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof result.message === "string"
            ? result.message
            : "Could not subscribe just now.",
        );
      event.currentTarget.reset();
      setStatus(
        typeof result.message === "string"
          ? result.message
          : "Check your email to confirm your subscription.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not subscribe just now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="sf-newsletter-form" onSubmit={submit}>
      <fieldset className="sf-newsletter-interests">
        <legend>Select your interest(s)</legend>
        {interests.map((interest) => (
          <label key={interest.id}>
            <input
              type="checkbox"
              name="interests"
              value={interest.label}
              disabled={preview}
            />
            <StorefrontIcon name={interest.icon} />
            <span>{interest.label}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="sf-newsletter-preferences">
        <legend>How you will receive updates</legend>
        <label>
          <input
            type="radio"
            name="preference"
            value="EMAIL"
            checked
            readOnly
            disabled={preview}
          />
          <StorefrontIcon name="mail" />
          <span>Email</span>
        </label>
        <small>
          WhatsApp subscriptions will be available after phone verification is
          introduced.
        </small>
      </fieldset>
      <div className="sf-newsletter-submit">
        <input
          name="email"
          type="email"
          maxLength={254}
          autoComplete="email"
          placeholder="Your email address"
          aria-label="Email address"
          required
          disabled={preview}
        />
        <input
          className="sf-newsletter-trap"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <label className="sf-newsletter-consent">
          <input
            type="checkbox"
            name="consent"
            value="yes"
            required
            disabled={preview}
          />
          <span>
            I agree to receive these updates and can unsubscribe at any time.
          </span>
        </label>
        <button type="submit" disabled={preview || submitting}>
          {submitting ? "Subscribing…" : buttonLabel}
          <StorefrontIcon name="arrow" />
        </button>
        {status && (
          <p role="status" className="sf-newsletter-status">
            {status}
          </p>
        )}
      </div>
    </form>
  );
}
