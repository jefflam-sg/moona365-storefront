import { NextResponse } from "next/server";
import { loadStorefrontListing } from "@/lib/catalogue";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2) return NextResponse.json({ suggestions: [] }, { headers: responseHeaders });
  if (query.length > 100) return NextResponse.json({ suggestions: [] }, { status: 400, headers: responseHeaders });

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return NextResponse.json({ suggestions: [] }, { headers: responseHeaders });
  try {
    const listing = await loadStorefrontListing(host, {
      source: "search",
      search: query,
      limit: 6,
      page: 1,
      sort: "name-asc",
    });
    return NextResponse.json({
      suggestions: (listing?.products ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        image: product.primaryImage,
      })),
    }, { headers: responseHeaders });
  } catch {
    return NextResponse.json({ suggestions: [] }, { headers: responseHeaders });
  }
}
