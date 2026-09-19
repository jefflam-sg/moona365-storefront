import { NextResponse } from "next/server";
import { exchangePreviewToken } from "@/lib/bootstrap";

const previewHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};

const notFound = () =>
  NextResponse.json(
    { message: "Preview not found" },
    { status: 404, headers: previewHeaders },
  );

export async function POST(request: Request) {
  let token: unknown;
  try {
    token = ((await request.json()) as { token?: unknown }).token;
  } catch {
    return notFound();
  }
  if (typeof token !== "string") return notFound();
  try {
    const preview = await exchangePreviewToken(token);
    return preview
      ? NextResponse.json(preview, { headers: previewHeaders })
      : notFound();
  } catch {
    return notFound();
  }
}
