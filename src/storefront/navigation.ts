import type { HomepageCatalogue, NavigationDestination, NavigationNode, PublicCategory, WebsiteNavigation } from "./contracts";
import { categoryPathSlug } from "./category-url";

export type ResolvedNavigationNode = { id: string; label: string; href: string | null; presentation: NavigationNode["presentation"]; columns: 3 | 4 | 5; promo: null | { heading: string; text: string; image: null | { src: string; alt: string }; href: string | null }; children: ResolvedNavigationNode[] };
const defaults = (): WebsiteNavigation => ({ schemaVersion: 1, menus: { main: { id: "main", nodes: [
  { id: "shop", parentId: null, position: 0, visible: true, labelOverride: "Shop", destination: { type: "SHOP_ALL" }, presentation: "LINK", automaticChildren: null, megaMenu: null },
  { id: "categories", parentId: null, position: 1, visible: true, labelOverride: "Categories", destination: { type: "SYSTEM_PAGE", page: "CATEGORIES" }, presentation: "LINK", automaticChildren: null, megaMenu: null },
  { id: "collections", parentId: null, position: 2, visible: true, labelOverride: "Collections", destination: { type: "SYSTEM_PAGE", page: "COLLECTIONS" }, presentation: "LINK", automaticChildren: null, megaMenu: null },
] }, footer: { id: "footer", nodes: [] } } });

function safeCustom(value: string) { if (!value || /[\s\\]/.test(value) || value.startsWith("//")) return null; if (value.startsWith("/")) return value; try { const p = new URL(value); return ["https:", "mailto:", "tel:"].includes(p.protocol) ? value : null; } catch { return null; } }
function destination(destination: NavigationDestination, catalogue: HomepageCatalogue): { href: string | null; label: string | null; category?: PublicCategory } | null {
  if (destination.type === "MENU_GROUP") return { href: null, label: null };
  if (destination.type === "SHOP_ALL") return { href: "/shop", label: "Shop" };
  if (destination.type === "SYSTEM_PAGE") return { href: { HOME: "/", SHOP: "/shop", CATEGORIES: "/categories", COLLECTIONS: "/collections" }[destination.page], label: destination.page[0] + destination.page.slice(1).toLowerCase() };
  if (destination.type === "CUSTOM_URL") { const href = safeCustom(destination.url); return href ? { href, label: destination.url } : null; }
  if (destination.type === "PRODUCT_CATEGORY") { const category = catalogue.categories.find((item) => item.id === destination.categoryId); return category ? { href: `/categories/${categoryPathSlug(category.path)}${destination.includeSubcategories ? "?includeSubcategories=true" : ""}`, label: category.name, category } : null; }
  if (destination.type === "PRODUCT") { const product = Object.values(catalogue.productsBySectionId).flat().find((item) => item.id === destination.productId); return product ? { href: `/products/${product.slug}`, label: product.name } : null; }
  const collection = catalogue.collections.find((item) => item.id === destination.collectionId); return collection ? { href: `/collections/${collection.slug}`, label: collection.name } : null;
}
export function resolveNavigation(kind: "main" | "footer", navigation: WebsiteNavigation | undefined, catalogue: HomepageCatalogue): ResolvedNavigationNode[] {
  const configured = (navigation ?? defaults()).menus[kind].nodes.filter((item) => item.visible);
  const byParent = (parentId: string | null) => configured.filter((item) => item.parentId === parentId).sort((a, b) => a.position - b.position);
  const makeAuto = (node: NavigationNode, category: PublicCategory): ResolvedNavigationNode[] => {
    if (!node.automaticChildren) return [];
    const roots = node.automaticChildren.scope === "ALL_TOP_LEVEL" ? catalogue.categories.filter((item) => item.parentId === null) : catalogue.categories.filter((item) => item.parentId === category.id);
    const walk = (item: PublicCategory, depth: number): ResolvedNavigationNode => ({ id: `auto:${node.id}:${item.id}`, label: item.name, href: `/categories/${categoryPathSlug(item.path)}${item.hasChildren ? "?includeSubcategories=true" : ""}`, presentation: "LINK", columns: 4, promo: null, children: depth < node.automaticChildren!.maxDepth ? catalogue.categories.filter((child) => child.parentId === item.id).map((child) => walk(child, depth + 1)) : [] });
    return roots.map((item) => walk(item, 1));
  };
  const walk = (node: NavigationNode): ResolvedNavigationNode | null => {
    const target = destination(node.destination, catalogue);
    const manual = byParent(node.id).map(walk).filter((item): item is ResolvedNavigationNode => !!item);
    const automatic = target?.category ? makeAuto(node, target.category) : [];
    const children = [...manual, ...automatic];
    if (!target && !children.length) return null;
    if (node.destination.type === "MENU_GROUP" && !children.length) return null;
    const promoTarget = node.megaMenu?.promo ? destination(node.megaMenu.promo.destination, catalogue) : null;
    const promo = node.megaMenu?.promo && promoTarget ? { heading: node.megaMenu.promo.heading, text: node.megaMenu.promo.text, image: node.megaMenu.promo.image, href: promoTarget.href } : null;
    return { id: node.id, label: node.labelOverride?.trim() || target?.label || "Menu", href: target?.href ?? null, presentation: children.length || promo ? node.presentation : "LINK", columns: node.megaMenu?.columns ?? 4, promo, children };
  };
  return byParent(null).map(walk).filter((item): item is ResolvedNavigationNode => !!item);
}
