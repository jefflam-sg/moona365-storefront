import { NextResponse } from "next/server";
import { storefrontProxyHeaders } from "@/lib/storefront-proxy";

const COOKIE = "moona365_cart";
const hostOf = (request: Request) =>
  (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();

async function proxy(request: Request, mutation?: unknown) {
  const base = process.env.MOONA365_API_URL;
  const host = hostOf(request);
  if (!base || !host)
    return NextResponse.json(
      { message: "Cart is unavailable." },
      { status: 503 },
    );
  if (mutation) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== host)
          return NextResponse.json(
            { message: "Invalid cart request." },
            { status: 403 },
          );
      } catch {
        return NextResponse.json(
          { message: "Invalid cart request." },
          { status: 403 },
        );
      }
    }
  }
  const rawCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  try {
    const response = await fetch(
      `${base.replace(/\/$/, "")}/public/storefront/v1/cart/${mutation ? "mutations" : "session"}`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...storefrontProxyHeaders(request),
        },
        body: JSON.stringify({
          host,
          cartToken: rawCookie ? decodeURIComponent(rawCookie) : undefined,
          ...(mutation ? { mutation } : {}),
        }),
      },
    );
    const value = await response
      .json()
      .catch(() => ({ message: "Cart is unavailable." }));
    const token = value?.cartToken;
    const result = NextResponse.json(
      value?.cart ? { cart: value.cart } : value,
      {
        status: response.status,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
    if (typeof token === "string" && token) {
      result.cookies.set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } else if (token === null && rawCookie) {
      result.cookies.delete(COOKIE);
    }
    return result;
  } catch {
    return NextResponse.json(
      { message: "Cart is unavailable." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  return proxy(request);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid cart request." },
      { status: 400 },
    );
  }
  return proxy(request, (body as { mutation?: unknown })?.mutation);
}
