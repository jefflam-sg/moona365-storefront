"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ModalProps = {
  defaultEmail?: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

type Props =
  | { mode: "PAGE" }
  | ({ mode: "STORE_MODAL" } & ModalProps)
  | ({
      mode: "CHECKOUT_MODAL";
      onGuest: () => void | Promise<void>;
    } & ModalProps);

type View = "SIGN_IN" | "REGISTER" | "FORGOT_PASSWORD";

export function CustomerLogin(props: Props) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const isModal = props.mode !== "PAGE";
  const [view, setView] = useState<View>("SIGN_IN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(isModal ? (props.defaultEmail ?? "") : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"ERROR" | "STATUS">("STATUS");
  const [busy, setBusy] = useState(false);
  const modalOnClose = isModal ? props.onClose : undefined;

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
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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

  function changeView(next: View) {
    setView(next);
    setMessage("");
    setMessageKind("STATUS");
    setPassword("");
    setShowPassword(false);
    requestAnimationFrame(() =>
      panel.current
        ?.querySelector<HTMLInputElement>(
          next === "REGISTER" ? 'input[name="name"]' : 'input[type="email"]',
        )
        ?.focus(),
    );
  }

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
      if (isModal) {
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
      setMessageKind("ERROR");
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function register(event: FormEvent) {
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
      setMessageKind("STATUS");
      setMessage(
        value.message ??
          "If this email can be registered, an activation link will arrive shortly.",
      );
    } catch (error) {
      setMessageKind("ERROR");
      setMessage(
        error instanceof Error ? error.message : "Registration failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/password-reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const value = await response
        .json()
        .catch(() => ({ message: "Password reset is unavailable." }));
      if (!response.ok)
        throw new Error(value.message ?? "Password reset is unavailable.");
      setMessageKind("STATUS");
      setMessage(
        value.message ??
          "If an active account exists, a reset link will arrive shortly.",
      );
    } catch (error) {
      setMessageKind("ERROR");
      setMessage(
        error instanceof Error
          ? error.message
          : "Password reset is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  const heading =
    view === "SIGN_IN"
      ? "Welcome back"
      : view === "REGISTER"
        ? "Create an account"
        : "Reset your password";
  const description =
    view === "SIGN_IN"
      ? props.mode === "CHECKOUT_MODAL"
        ? "Sign in to continue your checkout, access member benefits and use your saved details."
        : "Sign in to view your orders, cashback and customer account."
      : view === "REGISTER"
        ? "Use the same membership and rewards in store and online."
        : "Enter your email and we will send a secure reset link if an active account exists.";

  const feedback = message && (
    <p
      className={messageKind === "ERROR" ? "sf-login-error" : "sf-login-status"}
      role={messageKind === "ERROR" ? "alert" : "status"}
    >
      {message}
    </p>
  );

  const content = (
    <div
      ref={panel}
      className={`sf-login-card ${isModal ? "sf-login-card--modal" : ""}`}
      role={isModal ? "dialog" : undefined}
      aria-modal={isModal ? true : undefined}
      aria-labelledby="customer-login-title"
    >
      {isModal && (
        <button
          className="sf-login-close"
          type="button"
          aria-label="Close customer account"
          onClick={props.onClose}
        >
          ×
        </button>
      )}
      <h1 id="customer-login-title">{heading}</h1>
      <p>{description}</p>

      {view === "SIGN_IN" && (
        <>
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
            <button
              className="sf-login-link"
              type="button"
              onClick={() => changeView("FORGOT_PASSWORD")}
            >
              Forgot password?
            </button>
            {feedback}
            <button className="sf-login-submit" disabled={busy} type="submit">
              {busy ? "Signing in…" : "Sign in →"}
            </button>
          </form>
          <div className="sf-login-divider">
            <span>or</span>
          </div>
          {props.mode === "CHECKOUT_MODAL" && (
            <button
              className="sf-login-secondary"
              type="button"
              onClick={() => void props.onGuest()}
            >
              Continue as guest
            </button>
          )}
          <div className="sf-login-new">
            <strong>New to this store?</strong>
            <button
              className="sf-login-secondary"
              type="button"
              onClick={() => changeView("REGISTER")}
            >
              Create an account
            </button>
          </div>
        </>
      )}

      {view === "REGISTER" && (
        <form onSubmit={register}>
          <label>
            Name
            <input
              required
              name="name"
              autoComplete="name"
              maxLength={160}
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
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {feedback}
          <button className="sf-login-submit" disabled={busy} type="submit">
            {busy ? "Sending activation…" : "Create account"}
          </button>
          <small>
            We will email a secure activation link. Registration does not
            subscribe you to marketing.
          </small>
          <button
            className="sf-login-link sf-login-link--back"
            type="button"
            onClick={() => changeView("SIGN_IN")}
          >
            Back to sign in
          </button>
        </form>
      )}

      {view === "FORGOT_PASSWORD" && (
        <form onSubmit={forgotPassword}>
          <label>
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {feedback}
          <button className="sf-login-submit" disabled={busy} type="submit">
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <button
            className="sf-login-link sf-login-link--back"
            type="button"
            onClick={() => changeView("SIGN_IN")}
          >
            Back to sign in
          </button>
        </form>
      )}

      <small className="sf-login-secure">Secure sign in</small>
    </div>
  );

  return isModal ? (
    <div
      className="sf-login-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onClose();
      }}
    >
      {content}
    </div>
  ) : (
    <section className="sf-width sf-login-page">
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
    </section>
  );
}
