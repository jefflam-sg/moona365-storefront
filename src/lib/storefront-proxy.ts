export function storefrontProxyHeaders(request: Request) {
  const secret = process.env.STOREFRONT_PROXY_SECRET?.trim() ?? "";
  if (secret.length < 32)
    throw new Error("Storefront proxy authentication is not configured.");
  const forwarded =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  const clientIp =
    request.headers.get("x-real-ip")?.trim() || forwarded.at(-1) || "unknown";
  return {
    "x-moona-storefront-proxy": secret,
    "x-moona-client-ip": clientIp,
  };
}
