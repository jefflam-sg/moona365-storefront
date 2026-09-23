import type { ComponentType } from "react";
import type { HomepageCatalogue, HomepageSection, SectionType } from "../contracts";
import { HeroSection } from "./hero";
import { BrandValuesSection, GroupedServicesSection, NewsletterSection, ServicesSection, StatsSection } from "./content-sections";
import { FeaturedCollectionSection } from "./featured-collection";
import { CategoriesSection, ProductShowcaseSection } from "./catalogue-sections";

export type SectionRendererProps = { section: HomepageSection; preview: boolean; catalogue: HomepageCatalogue };
type VersionedRenderer = { version: 1; component: ComponentType<SectionRendererProps> };
const ProductPageOnlySection = () => null;

const sectionRegistry: Partial<Record<SectionType, VersionedRenderer>> = {
  hero: { version: 1, component: HeroSection },
  categories: { version: 1, component: CategoriesSection },
  "featured-collection": { version: 1, component: FeaturedCollectionSection },
  "product-showcase": { version: 1, component: ProductShowcaseSection },
  stats: { version: 1, component: StatsSection },
  services: { version: 1, component: ServicesSection },
  "brand-values": { version: 1, component: BrandValuesSection },
  newsletter: { version: 1, component: NewsletterSection },
  "product-page-brand-values": { version: 1, component: ProductPageOnlySection },
  "services-showcase-grouped": { version: 1, component: GroupedServicesSection },
};

export const implementedSectionTypes = Object.freeze(
  Object.keys(sectionRegistry) as SectionType[],
);

export function unsupportedVisibleSections(sections: HomepageSection[]) {
  return sections.filter((section) => {
    const registered = sectionRegistry[section.type];
    return section.visible && (!registered || registered.version !== section.version);
  });
}

export function renderHomepageSection(section: HomepageSection, preview: boolean, catalogue: HomepageCatalogue) {
  const registered = sectionRegistry[section.type];
  if (!registered || registered.version !== section.version) return null;
  const Component = registered.component;
  return <Component key={section.id} section={section} preview={preview} catalogue={catalogue} />;
}
