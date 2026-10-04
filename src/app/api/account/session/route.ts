import { NextResponse } from "next/server";
import { storefrontProxyHeaders } from "@/lib/storefront-proxy";

const COOKIE = "moona365_customer";
const apiBase = () => process.env.MOONA365_API_URL?.replace(/\/$/, "");
const hostOf = (request: Request) =>
  (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();
const cookie = (request: Request) =>
  request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);

export async function POST(request: Request) {
  const api = apiBase(),
    host = hostOf(request);
  if (!api || !host)
    return NextResponse.json(
      { message: "Login is unavailable." },
      { status: 503 },
    );
  const body = await request.json().catch(() => null);
  if (!body)
    return NextResponse.json(
      { message: "Invalid login details." },
      { status: 400 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/checkout/account-login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...storefrontProxyHeaders(request),
      },
      body: JSON.stringify({ ...body, host }),
      cache: "no-store",
    },
  );
  const value = await response
    .json()
    .catch(() => ({ message: "Login failed." }));
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

export async function GET(request: Request) {
  const api = apiBase(),
    host = hostOf(request),
    sessionToken = cookie(request);
  if (!api || !host || !sessionToken)
    return NextResponse.json(
      { message: "Sign in to continue." },
      { status: 401 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/checkout/account-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...storefrontProxyHeaders(request),
      },
      body: JSON.stringify({
        host,
        sessionToken: decodeURIComponent(sessionToken),
      }),
      cache: "no-store",
    },
  );
  return NextResponse.json(
    await response.json().catch(() => ({ message: "Session is unavailable." })),
    { status: response.status },
  );
}

export async function DELETE(request: Request) {
  const api = apiBase(),
    sessionToken = cookie(request);
  if (api && sessionToken)
    await fetch(`${api}/public/storefront/v1/checkout/account-logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: decodeURIComponent(sessionToken) }),
      cache: "no-store",
    }).catch(() => undefined);
  const result = NextResponse.json({ loggedOut: true });
  result.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return result;
}
