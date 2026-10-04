import { NextResponse } from "next/server";
import { storefrontProxyHeaders } from "@/lib/storefront-proxy";

const base = () => process.env.MOONA365_API_URL?.replace(/\/$/, "");
const host = (request: Request) =>
  (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();

export async function POST(request: Request) {
  const api = base(),
    storefrontHost = host(request);
  if (!api || !storefrontHost)
    return NextResponse.json(
      { message: "Account registration is unavailable." },
      { status: 503 },
    );
  const response = await fetch(
    `${api}/public/storefront/v1/checkout/account-register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...storefrontProxyHeaders(request),
      },
      body: JSON.stringify({ ...(await request.json()), host: storefrontHost }),
      cache: "no-store",
    },
  );
  return NextResponse.json(
    await response
      .json()
      .catch(() => ({ message: "Registration could not be completed." })),
    { status: response.status },
  );
}
