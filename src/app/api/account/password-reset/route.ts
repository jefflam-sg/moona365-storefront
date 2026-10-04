import { NextResponse } from "next/server";
import { storefrontProxyHeaders } from "@/lib/storefront-proxy";

const COOKIE = "moona365_customer";
const base = () => process.env.MOONA365_API_URL?.replace(/\/$/, "");
const host = (request: Request) =>
  (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();

export async function PUT(request: Request) {
  const api = base(),
    storefrontHost = host(request);
  if (!api || !storefrontHost)
    return NextResponse.json(
      { message: "Password reset is unavailable." },
      { status: 503 },
    );
  const body = await request.json();
  const response = await fetch(
    `${api}/public/storefront/v1/checkout/account-password-reset/request`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...storefrontProxyHeaders(request),
      },
      body: JSON.stringify({ ...body, host: storefrontHost }),
      cache: "no-store",
    },
  );
  return NextResponse.json(await response.json(), { status: response.status });
}

export async function POST(request: Request) {
  const api = base();
  if (!api)
    return NextResponse.json(
      { message: "Password reset is unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/checkout/account-password-reset`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await request.json()),
      cache: "no-store",
    },
  );
  const value = await response.json();
  const result = NextResponse.json(
    value && typeof value === "object"
      ? { ...value, sessionToken: undefined }
      : value,
    { status: response.status },
  );
  if (response.ok && value?.sessionToken)
    result.cookies.set(COOKIE, value.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  return result;
}
