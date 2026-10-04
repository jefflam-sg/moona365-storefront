import { NextResponse } from "next/server";
import { storefrontProxyHeaders } from "@/lib/storefront-proxy";

const CART_COOKIE = "moona365_cart";
const CHECKOUT_COOKIE = "moona365_checkout";
const CUSTOMER_COOKIE = "moona365_customer";
const hostOf = (request: Request) =>
  (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();
const cookie = (request: Request, name: string) =>
  request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
const api = () => process.env.MOONA365_API_URL?.replace(/\/$/, "");

export async function POST(request: Request) {
  const base = api();
  const host = hostOf(request);
  const cartToken = cookie(request, CART_COOKIE);
  const customerSessionToken = cookie(request, CUSTOMER_COOKIE);
  if (!base || !host || !cartToken)
    return NextResponse.json(
      { message: "Checkout is unavailable." },
      { status: 503 },
    );
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== host)
        return NextResponse.json(
          { message: "Invalid checkout request." },
          { status: 403 },
        );
    } catch {
      return NextResponse.json(
        { message: "Invalid checkout request." },
        { status: 403 },
      );
    }
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid checkout details." },
      { status: 400 },
    );
  }
  try {
    const response = await fetch(
      `${base}/public/storefront/v1/checkout/begin`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...storefrontProxyHeaders(request),
        },
        body: JSON.stringify({
          ...body,
          host,
          cartToken: decodeURIComponent(cartToken),
          customerSessionToken: customerSessionToken
            ? decodeURIComponent(customerSessionToken)
            : null,
        }),
      },
    );
    const value = await response
      .json()
      .catch(() => ({ message: "Checkout is temporarily unavailable." }));
    const checkoutToken = value?.checkoutToken;
    const publicValue =
      value && typeof value === "object" ? { ...value } : value;
    if (publicValue && typeof publicValue === "object")
      delete publicValue.checkoutToken;
    const result = NextResponse.json(publicValue, {
      status: response.status,
      headers: { "Cache-Control": "private, no-store" },
    });
    if (response.ok && checkoutToken)
      result.cookies.set(CHECKOUT_COOKIE, checkoutToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });
    return result;
  } catch {
    return NextResponse.json(
      { message: "Checkout is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  const base = api();
  const host = hostOf(request);
  const checkoutToken = cookie(request, CHECKOUT_COOKIE);
  if (!base || !host || !checkoutToken)
    return NextResponse.json(
      { message: "Checkout not found." },
      { status: 404 },
    );
  try {
    const response = await fetch(
      `${base}/public/storefront/v1/checkout/status?host=${encodeURIComponent(host)}&checkoutToken=${encodeURIComponent(decodeURIComponent(checkoutToken))}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...storefrontProxyHeaders(request),
        },
      },
    );
    return NextResponse.json(
      await response
        .json()
        .catch(() => ({ message: "Checkout is temporarily unavailable." })),
      {
        status: response.status,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "Checkout is temporarily unavailable." },
      { status: 503 },
    );
  }
}
