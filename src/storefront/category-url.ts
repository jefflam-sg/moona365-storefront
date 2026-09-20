import type { PublicCategory } from "./contracts";

export function categoryPathSlug(path: string): string {
  return path
    .split(" > ")
    .map((part) =>
      part
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("/");
}

export function categoryHref(category: PublicCategory): string {
  return `/categories/${categoryPathSlug(category.path)}${category.hasChildren ? "?includeSubcategories=true" : ""}`;
}

export function categoryForRoute(
  segments: readonly string[],
  categories: readonly PublicCategory[],
): PublicCategory | undefined {
  const reference = segments.join("/");
  return categories.find(
    (category) =>
      categoryPathSlug(category.path) === reference ||
      (segments.length === 1 && category.id === reference),
  );
}
