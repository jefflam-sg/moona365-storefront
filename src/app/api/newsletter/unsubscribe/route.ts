import { NextResponse } from "next/server";

const apiBase = () => process.env.MOONA365_API_URL?.replace(/\/$/, "");

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const api = apiBase();
  if (!api)
    return NextResponse.json(
      { message: "Unsubscribe is unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/newsletter-unsubscribe/context?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  return NextResponse.json(
    await response
      .json()
      .catch(() => ({ message: "Unsubscribe link is invalid or expired." })),
    { status: response.status },
  );
}

export async function POST(request: Request) {
  const api = apiBase();
  if (!api)
    return NextResponse.json(
      { message: "Unsubscribe is unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/newsletter-unsubscribe`,
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
      .catch(() => ({ message: "Unsubscribe link is invalid or expired." })),
    { status: response.status },
  );
}
