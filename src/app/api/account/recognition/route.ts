import { NextResponse } from "next/server";
import { storefrontProxyHeaders } from "@/lib/storefront-proxy";

const hostOf = (request: Request) =>
  (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();

export async function POST(request: Request) {
  const api = process.env.MOONA365_API_URL?.replace(/\/$/, "");
  const host = hostOf(request);
  if (!api || !host)
    return NextResponse.json({ prompt: false }, { status: 503 });
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email : "";
  } catch {
    return NextResponse.json({ prompt: false }, { status: 400 });
  }
  try {
    const response = await fetch(
      `${api}/public/storefront/v1/checkout/account-recognition`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...storefrontProxyHeaders(request),
        },
        body: JSON.stringify({ host, email }),
      },
    );
    return NextResponse.json(await response.json(), {
      status: response.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ prompt: false }, { status: 503 });
  }
}
