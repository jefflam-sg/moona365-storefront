export type BrandAsset = { src: string; alt: string };
export type WebsiteFont = "system-sans" | "open-sans" | "rubik" | "classic-serif" | "humanist-sans";

export type WebsiteDesign = {
  schemaVersion: 1;
  themeId: "retail-natural";
  brand: {
    name: string;
    logoSource: "organization" | "website" | "text";
    logo: BrandAsset | null;
    favicon: BrandAsset | null;
    organization: {
      name: string;
      logo: BrandAsset | null;
      address: string;
      email: string;
      phone: string;
    };
  };
  colors: {
    primary: string;
    onPrimary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  typography: {
    headingFont: WebsiteFont;
    bodyFont: WebsiteFont;
    scale: "compact" | "standard" | "large";
  };
  buttons: {
    shape: "square" | "soft" | "pill";
    weight: "medium" | "semibold" | "bold";
    primaryBackground: string;
    primaryText: string;
    primaryBorder: string;
    primaryHoverBackground: string;
    primaryHoverText: string;
    secondaryBackground: string;
    secondaryText: string;
    secondaryBorder: string;
    secondaryHoverBackground: string;
    secondaryHoverText: string;
  };
  layout: {
    contentWidth: "compact" | "standard" | "wide";
    sectionSpacing: "compact" | "comfortable" | "spacious";
    productCards: "compact" | "standard" | "large";
    cornerStyle: "square" | "soft" | "rounded";
  };
  header: {
    logoPosition: "left" | "center";
    logoSize?: "small" | "standard" | "large";
    style: "standard" | "compact";
    sticky: boolean;
    showSearch: boolean;
    showAccount: true;
    showCart: true;
    showAnnouncement: boolean;
    announcement: string;
    navigation: "main";
  };
  footer: {
    showLogo: boolean;
    showAddress: boolean;
    showContact: boolean;
    columns: 2 | 3 | 4;
    copyright: string;
    navigation: "policies";
    showNewsletter: false;
  };
};

export type SectionType =
  | "hero"
  | "categories"
  | "featured-collection"
  | "product-showcase"
  | "stats"
  | "services"
  | "articles"
  | "newsletter"
  | "category-cards"
  | "services-showcase-grouped";

export type StorefrontIconName =
  | "leaf"
  | "people"
  | "tree"
  | "heart"
  | "box"
  | "gift"
  | "truck";

export type SectionItem = {
  id: string;
  title: string;
  description: string;
  value: string;
  icon: StorefrontIconName;
  href: string;
};

export type ServiceGroup = {
  id: string;
  title: string;
  description: string;
  icon: StorefrontIconName;
  items: Array<{
    id: string;
    icon: StorefrontIconName;
    title: string;
    description: string;
  }>;
};

export type HomepageSection = {
  id: string;
  type: SectionType;
  version: 1;
  visible: boolean;
  layout: "standard" | "split" | "compact";
  eyebrow: string;
  heading: string;
  description: string;
  image: BrandAsset | null;
  cta: { text: string; href: string };
  source: {
    kind: "newest" | "collection" | "manual" | "promotions" | "articles";
    collectionId: string;
    productIds: string[];
    articleIds: string[];
  };
  limit: number;
  tabs: Array<{ id: string; label: string; collectionId: string }>;
  items: SectionItem[];
  groups?: ServiceGroup[];
  colors?: { background: string; panel: string; card: string; accent: string; text: string; mutedText: string };
};

export type StorefrontSnapshot = {
  contractVersion: 1;
  theme: { code: "retail-natural"; version: 1 };
  design: WebsiteDesign;
  homepage: { schemaVersion: 1; sections: HomepageSection[] };
  navigation?: WebsiteNavigation;
};

export type NavigationDestination =
  | { type: "MENU_GROUP" }
  | { type: "SHOP_ALL" }
  | { type: "PRODUCT_CATEGORY"; categoryId: string; includeSubcategories: boolean }
  | { type: "WEBSITE_COLLECTION"; collectionId: string }
  | { type: "PRODUCT"; productId: string }
  | { type: "SYSTEM_PAGE"; page: "HOME" | "SHOP" | "CATEGORIES" | "COLLECTIONS" }
  | { type: "CUSTOM_URL"; url: string };
export type NavigationNode = { id: string; parentId: string | null; position: number; visible: boolean; labelOverride: string | null; destination: NavigationDestination; presentation: "LINK" | "DROPDOWN" | "MEGA_MENU"; automaticChildren: null | { scope: "CHILDREN_OF_CATEGORY" | "ALL_TOP_LEVEL"; maxDepth: 1 | 2 }; megaMenu: null | { columns: 3 | 4 | 5; promo: null | { heading: string; text: string; image: BrandAsset | null; destination: NavigationDestination } } };
export type WebsiteNavigation = { schemaVersion: 1; menus: { main: { id: "main"; nodes: NavigationNode[] }; footer: { id: "footer"; nodes: NavigationNode[] } } };

export type PublicCollection = {
  id: string;
  name: string;
  slug: string;
  path: string;
  description: string;
  image: BrandAsset | null;
};
export type PublicCategory = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  image: BrandAsset | null;
  hasChildren: boolean;
};

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  specifications?: Array<{
    code: string;
    label: string;
    displayValue: string;
    values: string[];
    table: {
      caption: string;
      rows: Array<{ label: string; value: string; unit: string }>;
    } | null;
  }>;
  variantOptionName?: string | null;
  isNew?: boolean;
  primaryImage: BrandAsset | null;
  collectionIds: string[];
  variants: Array<{
    id: string;
    label: string;
    primaryImage?: (BrandAsset & { mediaAssetId: string }) | null;
    price: { amount: string; currency: string };
    compareAtPrice?: { amount: string; currency: string } | null;
    availability: "AVAILABLE" | "SOLD_OUT" | "UNAVAILABLE";
    purchasable: boolean;
  }>;
};
export type PublicProductListing = {
  apiVersion: 1;
  resolvedHost: string;
  siteId: string;
  calculatedAt: string;
  products: PublicProduct[];
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
  facets: Array<{ key: string; values: Array<{ value: string; label: string; count: number }> }>;
};
export type PublicFilterConfiguration = {
  apiVersion: 1;
  resolvedHost: string;
  siteId: string;
  filterSet: {
    id: string;
    name: string;
    scopeType: "DEFAULT" | "CATEGORY" | "COLLECTION";
    scopeId: string | null;
    inherited?: boolean;
    requestedScopeType?: "DEFAULT" | "CATEGORY" | "COLLECTION";
    requestedScopeId?: string | null;
    items: Array<{
      key: string;
      sourceType: "CATEGORY" | "ATTRIBUTE" | "SPECIFICATION" | "BRAND" | "PRICE" | "IN_STOCK";
      customerLabel: string;
      presentation: "CHECKBOX" | "CHIP" | "IMAGE" | "COLOR_SWATCH" | "PRICE_RANGE" | "BINARY_TOGGLE";
      multipleSelection: boolean;
      showProductCount: boolean;
      maxInitiallyVisible: number;
      valueSort: "ALPHABETICAL" | "PRODUCT_COUNT" | "MANUAL";
    }>;
  };
};

export type HomepageCatalogue = {
  categories: PublicCategory[];
  collections: PublicCollection[];
  productsBySectionId: Record<string, PublicProduct[]>;
};
