import { NextResponse } from "next/server";

const apiBase = () => process.env.MOONA365_API_URL?.replace(/\/$/, "");

export async function GET(request: Request) {
  const api = apiBase();
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!api)
    return NextResponse.json(
      { message: "Account activation is unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/checkout/account-activation/context?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  return NextResponse.json(
    await response
      .json()
      .catch(() => ({ message: "Activation link is invalid or expired." })),
    { status: response.status },
  );
}

export async function POST(request: Request) {
  const api = apiBase();
  if (!api)
    return NextResponse.json(
      { message: "Account activation is unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/checkout/account-activation`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await request.json()),
      cache: "no-store",
    },
  );
  const value = await response
    .json()
    .catch(() => ({ message: "Account activation could not be completed." }));
  const result = NextResponse.json(
    value && typeof value === "object"
      ? { ...value, sessionToken: undefined }
      : value,
    { status: response.status },
  );
  if (response.ok && value?.sessionToken)
    result.cookies.set("moona365_customer", value.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  return result;
}
