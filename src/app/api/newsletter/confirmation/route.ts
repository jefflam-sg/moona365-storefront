import { NextResponse } from "next/server";
const base = () => process.env.MOONA365_API_URL?.replace(/\/$/, "");
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "",
    api = base();
  if (!api)
    return NextResponse.json(
      { message: "Confirmation is unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/newsletter-confirmation/context?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  return NextResponse.json(
    await response
      .json()
      .catch(() => ({ message: "Confirmation link is invalid or expired." })),
    { status: response.status },
  );
}
export async function POST(request: Request) {
  const api = base();
  if (!api)
    return NextResponse.json(
      { message: "Confirmation is unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/newsletter-confirmation`,
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
      .catch(() => ({ message: "Confirmation link is invalid or expired." })),
    { status: response.status },
  );
}
