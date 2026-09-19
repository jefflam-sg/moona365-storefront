import type { ComponentType } from "react";
import type { HomepageSection, SectionType } from "../contracts";
import { HeroSection } from "./hero";
import { GroupedServicesSection, ServicesSection, StatsSection } from "./content-sections";

export type SectionRendererProps = { section: HomepageSection; preview: boolean };
type VersionedRenderer = { version: 1; component: ComponentType<SectionRendererProps> };

const sectionRegistry: Partial<Record<SectionType, VersionedRenderer>> = {
  hero: { version: 1, component: HeroSection },
  stats: { version: 1, component: StatsSection },
  services: { version: 1, component: ServicesSection },
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

export function renderHomepageSection(section: HomepageSection, preview: boolean) {
  const registered = sectionRegistry[section.type];
  if (!registered || registered.version !== section.version) return null;
  const Component = registered.component;
  return <Component key={section.id} section={section} preview={preview} />;
}
