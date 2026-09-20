export type BrandAsset = { src: string; alt: string };
export type WebsiteFont = "system-sans" | "classic-serif" | "humanist-sans";

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
};

export type StorefrontSnapshot = {
  contractVersion: 1;
  theme: { code: "retail-natural"; version: 1 };
  design: WebsiteDesign;
  homepage: { schemaVersion: 1; sections: HomepageSection[] };
};

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
  primaryImage: BrandAsset | null;
  collectionIds: string[];
  variants: Array<{
    id: string;
    label: string;
    price: { amount: string; currency: string };
    availability: "AVAILABLE" | "SOLD_OUT" | "UNAVAILABLE";
    purchasable: boolean;
  }>;
};

export type HomepageCatalogue = {
  categories: PublicCategory[];
  collections: PublicCollection[];
  productsBySectionId: Record<string, PublicProduct[]>;
};
