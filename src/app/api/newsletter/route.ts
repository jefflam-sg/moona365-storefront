import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const baseUrl = process.env.MOONA365_API_URL;
  if (!host || !baseUrl) return NextResponse.json({ message: "Newsletter signup is unavailable." }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid subscription." }, { status: 400 }); }
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/public/storefront/v1/newsletter-subscriptions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(body as object), host }), cache: "no-store" });
    const result = await response.json().catch(() => ({ message: "Could not subscribe just now." }));
    return NextResponse.json(result, { status: response.status, headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ message: "Could not subscribe just now." }, { status: 503 }); }
}
