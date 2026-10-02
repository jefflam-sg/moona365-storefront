import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const api = process.env.MOONA365_API_URL?.replace(/\/$/, "");
  if (!host || !api)
    return NextResponse.json(
      { message: "Confirmation is unavailable." },
      { status: 503 },
    );
  const body = (await request.json().catch(() => ({}))) as object;
  const response = await fetch(
    `${api}/public/storefront/v1/newsletter-confirmation/resend`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, host }),
      cache: "no-store",
    },
  );
  return NextResponse.json(
    await response
      .json()
      .catch(() => ({
        message: "Check your email for a new confirmation link.",
      })),
    { status: response.status },
  );
}
