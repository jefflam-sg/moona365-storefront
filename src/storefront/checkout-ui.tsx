"use client";

/* eslint-disable @next/next/no-img-element -- Tenant image URLs are runtime-managed. */
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { WebsiteCart, loadCart, setCartNote } from "./commerce-local";

const price = (amount: string, currency: string) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency }).format(
    Number(amount),
  );
const requestId = () => crypto.randomUUID().replace(/-/g, "");
type CheckoutBreakdown = {
  id: string;
  total: string;
  currency: string;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  merchandiseTotal: string;
  deliveryFee: string;
  merchandiseGst: string;
  deliveryGst: string;
  gstTotal: string;
  grandTotal: string;
};
type BeginResult = {
  publishableKey: string;
  clientSecret: string;
  checkout: CheckoutBreakdown;
};
const callingCodes = [
  ["+65", "SG +65"],
  ["+60", "MY +60"],
  ["+62", "ID +62"],
  ["+63", "PH +63"],
  ["+66", "TH +66"],
  ["+84", "VN +84"],
  ["+91", "IN +91"],
  ["+61", "AU +61"],
  ["+64", "NZ +64"],
  ["+44", "UK +44"],
  ["+1", "US/CA +1"],
] as const;

function CheckoutProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="sf-checkout-progress" aria-label="Checkout progress">
      {["Information", "Payment", "Confirmation"].map((label, index) => (
        <li className={index + 1 <= step ? "is-active" : ""} key={label}>
          <span>{index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function PaymentForm({ checkout }: { checkout: BeginResult["checkout"] }) {
  const stripe = useStripe(),
    elements = useElements();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
      },
    });
    if (result.error) {
      setError(result.error.message ?? "Payment could not be completed.");
      setBusy(false);
    }
  }
  return (
    <form className="sf-checkout-payment" onSubmit={submit}>
      <CheckoutProgress step={2} />
      <h1>Payment</h1>
      <p>Choose a payment method to complete your order.</p>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <p className="sf-checkout-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={!stripe || busy}>
        {busy
          ? "Processing…"
          : `Pay ${price(checkout.grandTotal, checkout.currency)}`}
      </button>
      <small>Secure payment processed by Stripe.</small>
    </form>
  );
}

export function CheckoutContent() {
  const formRef = useRef<HTMLFormElement>(null);
  const [cart, setCart] = useState<WebsiteCart | null>(null);
  const [method, setMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [firstName, setFirstName] = useState(""),
    [lastName, setLastName] = useState(""),
    [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(""),
    [phoneCountryCode, setPhoneCountryCode] = useState("+65"),
    [phone, setPhone] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [line1, setLine1] = useState(""),
    [line2, setLine2] = useState(""),
    [city, setCity] = useState(""),
    [postal, setPostal] = useState("");
  const [shipToDifferentRecipient, setShipToDifferentRecipient] =
    useState(false);
  const [recipientFirstName, setRecipientFirstName] = useState(""),
    [recipientLastName, setRecipientLastName] = useState(""),
    [recipientPhoneCountryCode, setRecipientPhoneCountryCode] = useState("+65"),
    [recipientPhone, setRecipientPhone] = useState("");
  const [recipientLine1, setRecipientLine1] = useState(""),
    [recipientLine2, setRecipientLine2] = useState(""),
    [recipientCity, setRecipientCity] = useState(""),
    [recipientPostal, setRecipientPostal] = useState("");
  const [orderNote, setOrderNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BeginResult | null>(null),
    [stripe, setStripe] = useState<PromiseLike<Stripe | null> | null>(null),
    [idempotencyKey] = useState(requestId);

  useEffect(() => {
    void loadCart()
      .then((value) => {
        setCart(value);
        setOrderNote(value.orderNote ?? "");
        if (!value.delivery?.enabled) setMethod("PICKUP");
      })
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Cart is unavailable.",
        ),
      );
  }, []);
  useEffect(() => {
    void fetch("/api/account/session", { cache: "no-store" })
      .then(async (response) =>
        response.ok ? ((await response.json()).customer ?? null) : null,
      )
      .then((customer) => {
        if (!customer) return;
        setSignedIn(true);
        setFirstName((current) => current || customer.firstName || "");
        setLastName((current) => current || customer.lastName || "");
        setCompanyName((current) => current || customer.companyName || "");
        setEmail((current) => current || customer.email || "");
        const countryCode = customer.phoneCountryCode || "+65";
        setPhoneCountryCode(countryCode);
        setPhone(
          (current) =>
            current || String(customer.phone || "").replace(countryCode, ""),
        );
        const address = customer.defaultAddress;
        if (address) {
          setLine1((current) => current || address.line1 || "");
          setLine2((current) => current || address.line2 || "");
          setCity((current) => current || address.city || "");
          setPostal((current) => current || address.postalCode || "");
        }
      })
      .catch(() => undefined);
  }, []);
  const options = useMemo(
    () =>
      result
        ? {
            clientSecret: result.clientSecret,
            appearance: {
              theme: "stripe" as const,
              variables: { colorPrimary: "#14664f", borderRadius: "8px" },
            },
          }
        : null,
    [result],
  );
  const validate = (field: string, valid: boolean, message: string) =>
    setValidation((current) => ({
      ...current,
      [field]: valid ? "" : message,
    }));

  async function begin(event: FormEvent) {
    event.preventDefault();
    const form = formRef.current;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      form?.querySelector<HTMLElement>(":invalid")?.focus();
      return;
    }
    setBusy(true);
    setError("");
    try {
      let activeCart = cart!;
      if (orderNote !== activeCart.orderNote) {
        activeCart = await setCartNote(orderNote);
        setCart(activeCart);
      }
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyName: companyName.trim() || null,
          customerEmail: email.trim(),
          phoneCountryCode,
          customerPhone: phone.replace(/[\s()-]/g, ""),
          marketingOptIn,
          createAccount,
          fulfillmentMethod: method,
          buyerAddress: {
            line1: line1.trim(),
            line2: line2.trim(),
            city: city.trim() || "Singapore",
            postalCode: postal,
            countryCode: "SG",
          },
          shipToDifferentRecipient:
            method === "DELIVERY" && shipToDifferentRecipient,
          recipient:
            method === "DELIVERY" && shipToDifferentRecipient
              ? {
                  firstName: recipientFirstName.trim(),
                  lastName: recipientLastName.trim(),
                  phoneCountryCode: recipientPhoneCountryCode,
                  phone: recipientPhone.replace(/[\s()-]/g, ""),
                  address: {
                    line1: recipientLine1.trim(),
                    line2: recipientLine2.trim(),
                    city: recipientCity.trim() || "Singapore",
                    postalCode: recipientPostal,
                    countryCode: "SG",
                  },
                }
              : null,
        }),
      });
      const value = await response.json();
      if (!response.ok)
        throw new Error(value.message ?? "Checkout could not be started.");
      setResult(value);
      setStripe(loadStripe(value.publishableKey));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Checkout could not be started.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!cart) return <p className="sf-cart-loading">Loading checkout…</p>;
  if (!cart.cartReadyForCheckout)
    return (
      <section className="sf-checkout-empty">
        <h1>Review your cart</h1>
        <p>Your cart needs attention before checkout.</p>
        <Link href="/cart">Return to cart</Link>
      </section>
    );
  if (result && stripe && options)
    return (
      <section className="sf-checkout-page">
        <div className="sf-checkout-layout">
          <Elements stripe={stripe} options={options}>
            <PaymentForm checkout={result.checkout} />
          </Elements>
          <CheckoutSummary
            cart={cart}
            method={result.checkout.fulfillmentMethod}
            checkout={result.checkout}
          />
        </div>
      </section>
    );

  return (
    <section className="sf-checkout-page">
      <CheckoutProgress step={1} />
      <div className="sf-checkout-heading">
        <div>
          <p className="sf-eyebrow">Secure checkout</p>
          <h1>Information</h1>
          <p>Enter your details and choose how you will receive your order.</p>
        </div>
        <span>🔒 Secure checkout</span>
      </div>
      <div className="sf-checkout-layout">
        <form
          ref={formRef}
          className="sf-checkout-form"
          onSubmit={begin}
          noValidate
        >
          <div className="sf-checkout-returning">
            <span className="sf-checkout-returning-icon" aria-hidden="true">
              &#9786;
            </span>
            <span>
              <strong>
                {signedIn ? "Welcome back" : "Returning customer?"}
              </strong>
              <small>
                {signedIn
                  ? "Your saved details have been added to this checkout."
                  : "Log in for a faster checkout and to view your orders."}
              </small>
            </span>
            {signedIn ? (
              <Link href="/account">View account</Link>
            ) : (
              <Link href="/account/login?returnTo=/checkout">
                Click here to log in
              </Link>
            )}
          </div>
          <fieldset>
            <legend>Contact details</legend>
            <p>We’ll use this information to send your order updates.</p>
            <label>
              Email address <b>*</b>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() =>
                  validate(
                    "email",
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
                    "Enter a valid email address.",
                  )
                }
                aria-invalid={Boolean(validation.email)}
              />
              {validation.email && (
                <small className="sf-checkout-field-error">
                  {validation.email}
                </small>
              )}
            </label>
            <div className="sf-checkout-pair">
              <label>
                First name <b>*</b>
                <input
                  required
                  autoComplete="given-name"
                  value={firstName}
                  maxLength={80}
                  onChange={(event) => setFirstName(event.target.value)}
                  onBlur={() =>
                    validate(
                      "firstName",
                      Boolean(firstName.trim()),
                      "Enter your first name.",
                    )
                  }
                  aria-invalid={Boolean(validation.firstName)}
                />
                {validation.firstName && (
                  <small className="sf-checkout-field-error">
                    {validation.firstName}
                  </small>
                )}
              </label>
              <label>
                Last name <b>*</b>
                <input
                  required
                  autoComplete="family-name"
                  value={lastName}
                  maxLength={80}
                  onChange={(event) => setLastName(event.target.value)}
                  onBlur={() =>
                    validate(
                      "lastName",
                      Boolean(lastName.trim()),
                      "Enter your last name.",
                    )
                  }
                  aria-invalid={Boolean(validation.lastName)}
                />
                {validation.lastName && (
                  <small className="sf-checkout-field-error">
                    {validation.lastName}
                  </small>
                )}
              </label>
            </div>
            <div className="sf-checkout-pair">
              <label>
                Phone number <b>*</b>
                <span className="sf-checkout-phone">
                  <select
                    aria-label="Country calling code"
                    value={phoneCountryCode}
                    onChange={(event) =>
                      setPhoneCountryCode(event.target.value)
                    }
                  >
                    {callingCodes.map(([code, label]) => (
                      <option value={code} key={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    pattern="[0-9 ()-]{6,20}"
                    autoComplete="tel-national"
                    value={phone}
                    maxLength={20}
                    onChange={(event) => setPhone(event.target.value)}
                    onBlur={() =>
                      validate(
                        "phone",
                        /^\d{6,15}$/.test(phone.replace(/[\s()-]/g, "")),
                        "Enter a valid phone number.",
                      )
                    }
                    aria-invalid={Boolean(validation.phone)}
                  />
                </span>
                {validation.phone && (
                  <small className="sf-checkout-field-error">
                    {validation.phone}
                  </small>
                )}
              </label>
              <label>
                Company name <small>(optional)</small>
                <input
                  autoComplete="organization"
                  value={companyName}
                  maxLength={160}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Buyer address</legend>
            <p>
              This address will be used for this order and as your account&apos;s
              default delivery address.
            </p>
            <label>
              Country / Region <b>*</b>
              <select value="SG" disabled>
                <option value="SG">Singapore</option>
              </select>
            </label>
            <div className="sf-checkout-address-row">
              <label>
                Street address <b>*</b>
                <input
                  required
                  autoComplete="section-buyer shipping address-line1"
                  placeholder="House number and street name"
                  value={line1}
                  maxLength={180}
                  onChange={(event) => setLine1(event.target.value)}
                  onBlur={() =>
                    validate(
                      "line1",
                      Boolean(line1.trim()),
                      "Enter the buyer's street address.",
                    )
                  }
                  aria-invalid={Boolean(validation.line1)}
                />
                {validation.line1 && (
                  <small className="sf-checkout-field-error">
                    {validation.line1}
                  </small>
                )}
              </label>
              <label>
                Apartment, suite or unit <small>(optional)</small>
                <input
                  autoComplete="section-buyer shipping address-line2"
                  value={line2}
                  maxLength={180}
                  onChange={(event) => setLine2(event.target.value)}
                />
              </label>
            </div>
            <div className="sf-checkout-pair">
              <label>
                Town / City <small>(optional)</small>
                <input
                  autoComplete="section-buyer shipping address-level2"
                  placeholder="Singapore"
                  value={city}
                  maxLength={100}
                  onChange={(event) => setCity(event.target.value)}
                />
              </label>
              <label>
                Postcode <b>*</b>
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  autoComplete="section-buyer shipping postal-code"
                  placeholder="e.g. 568730"
                  value={postal}
                  maxLength={6}
                  onChange={(event) =>
                    setPostal(event.target.value.replace(/\D/g, ""))
                  }
                  onBlur={() =>
                    validate(
                      "postal",
                      /^\d{6}$/.test(postal),
                      "Enter a valid six-digit Singapore postcode.",
                    )
                  }
                  aria-invalid={Boolean(validation.postal)}
                />
                {validation.postal && (
                  <small className="sf-checkout-field-error">
                    {validation.postal}
                  </small>
                )}
              </label>
            </div>
            {method === "DELIVERY" && (
              <label className="sf-checkout-different-recipient">
                <input
                  type="checkbox"
                  checked={shipToDifferentRecipient}
                  onChange={(event) =>
                    setShipToDifferentRecipient(event.target.checked)
                  }
                />
                <span>
                  <strong>Ship to a different recipient</strong>
                  <small>
                    Add the recipient&apos;s name, phone number and delivery
                    address.
                  </small>
                </span>
              </label>
            )}
          </fieldset>
          <fieldset className="sf-checkout-preferences">
            <legend>Account and updates</legend>
            <p>Choose the optional services you would like with this order.</p>
            <div className="sf-checkout-preference-grid">
              {!signedIn && (
                <label className="sf-checkout-choice-card">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(event) => setCreateAccount(event.target.checked)}
                  />
                  <span className="sf-checkout-choice-icon" aria-hidden="true">
                    &#128100;
                  </span>
                  <span>
                    <strong>Create my customer account</strong>
                    <small>
                      After payment, we&apos;ll email a secure activation link. Your
                      order will already be connected to the account.
                    </small>
                  </span>
                </label>
              )}
              <label className="sf-checkout-choice-card">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                />
                <span className="sf-checkout-choice-icon" aria-hidden="true">
                  &#9993;
                </span>
                <span>
                  <strong>Send me news and offers</strong>
                  <small>
                    Latest News and Updates, New Arrivals, Promotions and
                    Special Deals. You can change your preferences or
                    unsubscribe anytime.
                  </small>
                </span>
              </label>
            </div>
          </fieldset>
          {method === "DELIVERY" && shipToDifferentRecipient && (
            <fieldset>
              <legend>Recipient details</legend>
              <p>
                Tell us who should receive this delivery and where to send it.
              </p>
              <div className="sf-checkout-pair">
                <label>
                  First name <b>*</b>
                  <input
                    required
                    autoComplete="section-recipient shipping given-name"
                    value={recipientFirstName}
                    maxLength={80}
                    onChange={(event) =>
                      setRecipientFirstName(event.target.value)
                    }
                  />
                </label>
                <label>
                  Last name <b>*</b>
                  <input
                    required
                    autoComplete="section-recipient shipping family-name"
                    value={recipientLastName}
                    maxLength={80}
                    onChange={(event) =>
                      setRecipientLastName(event.target.value)
                    }
                  />
                </label>
              </div>
              <label>
                Phone number <b>*</b>
                <span className="sf-checkout-phone">
                  <select
                    aria-label="Recipient country calling code"
                    value={recipientPhoneCountryCode}
                    onChange={(event) =>
                      setRecipientPhoneCountryCode(event.target.value)
                    }
                  >
                    {callingCodes.map(([code, label]) => (
                      <option value={code} key={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    pattern="[0-9 ()-]{6,20}"
                    autoComplete="section-recipient shipping tel-national"
                    value={recipientPhone}
                    maxLength={20}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                  />
                </span>
              </label>
              <label>
                Country / Region <b>*</b>
                <select value="SG" disabled>
                  <option value="SG">Singapore</option>
                </select>
              </label>
              <div className="sf-checkout-address-row">
                <label>
                  Street address <b>*</b>
                  <input
                    required
                    autoComplete="section-recipient shipping address-line1"
                    placeholder="House number and street name"
                    value={recipientLine1}
                    maxLength={180}
                    onChange={(event) => setRecipientLine1(event.target.value)}
                  />
                </label>
                <label>
                  Apartment, suite or unit <small>(optional)</small>
                  <input
                    autoComplete="section-recipient shipping address-line2"
                    value={recipientLine2}
                    maxLength={180}
                    onChange={(event) => setRecipientLine2(event.target.value)}
                  />
                </label>
              </div>
              <div className="sf-checkout-pair">
                <label>
                  Town / City <small>(optional)</small>
                  <input
                    autoComplete="section-recipient shipping address-level2"
                    placeholder="Singapore"
                    value={recipientCity}
                    maxLength={100}
                    onChange={(event) => setRecipientCity(event.target.value)}
                  />
                </label>
                <label>
                  Postcode <b>*</b>
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    autoComplete="section-recipient shipping postal-code"
                    placeholder="e.g. 568730"
                    value={recipientPostal}
                    maxLength={6}
                    onChange={(event) =>
                      setRecipientPostal(event.target.value.replace(/\D/g, ""))
                    }
                  />
                </label>
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend>Delivery method</legend>
            <p>Choose how you would like to receive your order.</p>
            <div className="sf-checkout-methods">
              <label className={method === "DELIVERY" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="fulfilment"
                  checked={method === "DELIVERY"}
                  disabled={!cart.delivery?.enabled}
                  onChange={() => setMethod("DELIVERY")}
                />
                <span>
                  <strong>Delivery</strong>
                  <small>
                    {shipToDifferentRecipient
                      ? "Delivered to the recipient address"
                      : "Delivered to the buyer address"}
                  </small>
                  <b>
                    {cart.delivery?.enabled
                      ? Number(cart.delivery.estimatedFee) > 0
                        ? price(cart.delivery.estimatedFee, cart.currency)
                        : "Free"
                      : "Unavailable"}
                  </b>
                </span>
              </label>
              <label className={method === "PICKUP" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="fulfilment"
                  checked={method === "PICKUP"}
                  onChange={() => setMethod("PICKUP")}
                />
                <span>
                  <strong>Pickup</strong>
                  <small>
                    Self-collection at {cart.fulfillmentLocationName}
                  </small>
                  <b>Free</b>
                </span>
              </label>
            </div>
            <details className="sf-checkout-note">
              <summary>Order notes (optional)</summary>
              <textarea
                value={orderNote}
                maxLength={500}
                placeholder="Add delivery or order instructions."
                onChange={(event) => setOrderNote(event.target.value)}
              />
              <small>{orderNote.length} / 500</small>
            </details>
          </fieldset>{" "}
          {error && (
            <p className="sf-checkout-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="sf-checkout-continue"
            type="submit"
            disabled={busy}
          >
            {busy ? "Checking your order…" : "Continue to payment →"}
          </button>
        </form>
        <div className="sf-checkout-summary-column">
          <CheckoutSummary cart={cart} method={method} />
          <div className="sf-checkout-trust">
            <span>🔒 Secure payment by Stripe</span>
            <span>✉ Order confirmation by email</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckoutSummary({
  cart,
  method,
  checkout,
}: {
  cart: WebsiteCart;
  method: "DELIVERY" | "PICKUP";
  checkout?: CheckoutBreakdown;
}) {
  const deliveryFee =
    checkout?.deliveryFee ??
    (method === "DELIVERY" ? (cart.delivery?.estimatedFee ?? "0.00") : "0.00");
  const gstTotal =
    checkout?.gstTotal ??
    (method === "DELIVERY"
      ? (cart.delivery?.estimatedGstTotal ?? cart.merchandiseGst)
      : cart.merchandiseGst);
  const grandTotal =
    checkout?.grandTotal ??
    (method === "DELIVERY"
      ? (cart.delivery?.estimatedGrandTotal ?? cart.merchandiseTotal)
      : cart.merchandiseTotal);
  return (
    <aside className="sf-checkout-summary">
      <header>
        <h2>Order summary</h2>
        <span>({cart.itemCount} items)</span>
        <Link href="/cart">Edit cart</Link>
      </header>
      {cart.lines.map((line) => (
        <div className="sf-checkout-summary-line" key={line.lineId}>
          <span className="sf-checkout-summary-image">
            {line.image ? (
              <img src={line.image.src} alt={line.image.alt} />
            ) : null}
          </span>
          <span>
            <strong>{line.productName}</strong>
            <small>{line.variantLabel}</small>
            <b>{price(line.effectiveUnitPrice, cart.currency)}</b>
          </span>
          <em aria-label={`Quantity ${line.requestedQuantity}`}>
            {line.requestedQuantity}
          </em>
          <strong>{price(line.lineTotal, cart.currency)}</strong>
        </div>
      ))}
      <div>
        <span>Subtotal</span>
        <span>{price(cart.subtotal, cart.currency)}</span>
      </div>
      {Number(cart.discountTotal) > 0 && (
        <div className="sf-cart-saving">
          <span>Savings</span>
          <span>−{price(cart.discountTotal, cart.currency)}</span>
        </div>
      )}
      <div>
        <span>Delivery</span>
        <span>
          {Number(deliveryFee) > 0 ? price(deliveryFee, cart.currency) : "Free"}
        </span>
      </div>
      <div>
        <span>GST {cart.gstInclusive ? "(included)" : ""}</span>
        <span>{price(gstTotal, cart.currency)}</span>
      </div>
      <div className="sf-checkout-total">
        <strong>{checkout ? "Total" : "Estimated total"}</strong>
        <strong>{price(grandTotal, cart.currency)}</strong>
      </div>
    </aside>
  );
}

export function CheckoutConfirmation() {
  const [state, setState] = useState<{
      status: string;
      id: string;
      total: string;
      currency: string;
      fulfillmentMethod: string;
      confirmationEmailStatus: string;
      accountInvitationStatus?: string;
      failureMessage?: string | null;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await fetch("/api/checkout", { cache: "no-store" });
        const value = await response.json();
        if (!response.ok)
          throw new Error(
            value.message ?? "Order confirmation is unavailable.",
          );
        if (!active) return;
        setState(value.checkout);
        if (
          !["PAID", "PAYMENT_FAILED", "ACTION_REQUIRED"].includes(
            value.checkout.status,
          )
        )
          timer = setTimeout(poll, 1800);
      } catch (caught) {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "Order confirmation is unavailable.",
          );
      }
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  if (error)
    return (
      <section className="sf-checkout-confirmation">
        <h1>We could not load this order</h1>
        <p>{error}</p>
        <Link href="/">Return home</Link>
      </section>
    );
  if (!state || ["PAYMENT_PENDING", "PROCESSING"].includes(state.status))
    return (
      <section className="sf-checkout-confirmation">
        <CheckoutProgress step={3} />
        <div className="sf-checkout-spinner" />
        <h1>Confirming your payment</h1>
        <p>Please keep this page open. This normally takes a few seconds.</p>
      </section>
    );
  if (state.status === "PAID")
    return (
      <section className="sf-checkout-confirmation">
        <CheckoutProgress step={3} />
        <div className="sf-checkout-success">✓</div>
        <h1>Thank you for your order</h1>
        <p>
          {state.confirmationEmailStatus === "SENT"
            ? "Payment is confirmed. We sent the confirmation to your email address."
            : "Payment is confirmed and your order has been received."}
        </p>
        {["PENDING", "SENT"].includes(state.accountInvitationStatus ?? "") && (
          <div className="sf-checkout-account-invite">
            <strong>Save time on your next order</strong>
            <span>
              Check your email for the secure link to activate your account.
              This order will already be linked to it.
            </span>
          </div>
        )}
        {state.accountInvitationStatus === "ALREADY_ACTIVE" && (
          <div className="sf-checkout-account-invite">
            <strong>Your order is linked to your account</strong>
            <span>You can sign in later to view your order history.</span>
          </div>
        )}
        <dl>
          <div>
            <dt>Order reference</dt>
            <dd>{state.id}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{price(state.total, state.currency)}</dd>
          </div>
          <div>
            <dt>Fulfilment</dt>
            <dd>
              {state.fulfillmentMethod === "DELIVERY" ? "Delivery" : "Pickup"}
            </dd>
          </div>
        </dl>
        <Link href="/">Continue shopping</Link>
      </section>
    );
  return (
    <section className="sf-checkout-confirmation">
      <h1>Your order needs attention</h1>
      <p>
        {state.failureMessage ??
          "Payment was not completed. Please contact the store before trying again."}
      </p>
      <Link href="/cart">Return to cart</Link>
    </section>
  );
}
