import { NextResponse } from "next/server";

const apiBase = () => process.env.MOONA365_API_URL?.replace(/\/$/, "");

export async function GET(request: Request) {
  const api = apiBase();
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!api)
    return NextResponse.json(
      { message: "Email preferences are unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/newsletter-preferences/context?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  return NextResponse.json(
    await response
      .json()
      .catch(() => ({ message: "Preference link is invalid or expired." })),
    { status: response.status },
  );
}

export async function POST(request: Request) {
  const api = apiBase();
  if (!api)
    return NextResponse.json(
      { message: "Email preferences are unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/newsletter-preferences`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await request.json()),
      cache: "no-store",
    },
  );
  return NextResponse.json(
    await response
      .json()
      .catch(() => ({ message: "Preferences could not be saved." })),
    { status: response.status },
  );
}
