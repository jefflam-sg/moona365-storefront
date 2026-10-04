"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props =
  | { mode: "PAGE" }
  | {
      mode: "CHECKOUT_MODAL";
      defaultEmail?: string;
      onClose: () => void;
      onGuest: () => void | Promise<void>;
      onSuccess: () => void | Promise<void>;
    };

export function CustomerLogin(props: Props) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState(
    props.mode === "CHECKOUT_MODAL" ? (props.defaultEmail ?? "") : "",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const modalOnClose =
    props.mode === "CHECKOUT_MODAL" ? props.onClose : undefined;

  useEffect(() => {
    if (!modalOnClose) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") modalOnClose();
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(
        panel.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]),a[href],input:not([disabled])",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current
      ?.querySelector<HTMLInputElement>('input[type="email"]')
      ?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [modalOnClose]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const value = await response.json();
      if (!response.ok)
        throw new Error(value.message ?? "Email or password is incorrect.");
      if (props.mode === "CHECKOUT_MODAL") {
        await props.onSuccess();
        props.onClose();
      } else {
        const requested = new URLSearchParams(window.location.search).get(
          "returnTo",
        );
        const returnTo =
          requested?.startsWith("/") && !requested.startsWith("//")
            ? requested
            : "/account";
        router.replace(returnTo);
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  const content = (
    <div
      ref={panel}
      className={`sf-login-card ${props.mode === "CHECKOUT_MODAL" ? "sf-login-card--modal" : ""}`}
      role={props.mode === "CHECKOUT_MODAL" ? "dialog" : undefined}
      aria-modal={props.mode === "CHECKOUT_MODAL" ? true : undefined}
      aria-labelledby="customer-login-title"
    >
      {props.mode === "CHECKOUT_MODAL" && (
        <button
          className="sf-login-close"
          type="button"
          aria-label="Close sign in"
          onClick={props.onClose}
        >
          ×
        </button>
      )}
      <span className="sf-login-brand">
        CUSTOMER <span>ACCOUNT</span>
      </span>
      <h1 id="customer-login-title">Welcome back</h1>
      <p>
        {props.mode === "CHECKOUT_MODAL"
          ? "Sign in to continue your checkout, access member benefits and use your saved details."
          : "Sign in to view your orders, cashback and customer account."}
      </p>
      <form onSubmit={login}>
        <label>
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <span className="sf-password-field">
            <input
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        <Link className="sf-login-forgot" href="/account/forgot-password">
          Forgot password?
        </Link>
        {message && (
          <p className="sf-login-error" role="alert">
            {message}
          </p>
        )}
        <button className="sf-login-submit" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in →"}
        </button>
      </form>
      <div className="sf-login-divider">
        <span>or</span>
      </div>
      {props.mode === "CHECKOUT_MODAL" ? (
        <button
          className="sf-login-secondary"
          type="button"
          onClick={() => void props.onGuest()}
        >
          Continue as guest
        </button>
      ) : (
        <div className="sf-login-new">
          <strong>New to this store?</strong>
          <Link className="sf-login-secondary" href="/account/register">
            Create an account
          </Link>
        </div>
      )}
      <small className="sf-login-secure">Secure sign in</small>
    </div>
  );

  return props.mode === "CHECKOUT_MODAL" ? (
    <div
      className="sf-login-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onClose();
      }}
    >
      {content}
    </div>
  ) : (
    <main className="sf-width sf-login-page">
      <section>{content}</section>
      <aside>
        <span className="sf-eyebrow">MEMBER BENEFITS</span>
        <h2>Your shopping, all together</h2>
        <p>
          Keep your purchases and member cashback together wherever you shop.
        </p>
        <ul>
          <li>View your website order history</li>
          <li>Earn cashback on signed-in purchases</li>
          <li>Use the same membership in store and online</li>
          <li>Checkout faster next time</li>
        </ul>
      </aside>
    </main>
  );
}
