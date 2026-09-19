export function safeImageSource(value: string): string | null {
  if (value.length > 750_000) return null;
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  try {
    return ["https:", "http:"].includes(new URL(value).protocol) ? value : null;
  } catch {
    return null;
  }
}

export function safeDestination(value: string): string | null {
  if (
    value.length > 500 ||
    /\s/.test(value) ||
    value.includes("\\") ||
    [...value].some((character) => character.charCodeAt(0) < 32)
  ) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}
