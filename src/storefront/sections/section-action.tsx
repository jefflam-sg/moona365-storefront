import Link from "next/link";
import type { HomepageSection } from "../contracts";
import { StorefrontIcon } from "../icons";
import { safeDestination } from "../safe-values";

export function SectionAction({ section, preview, secondary = false }: { section: HomepageSection; preview: boolean; secondary?: boolean }) {
  if (!section.cta.text) return null;
  const className = secondary ? "sf-secondary-button" : "sf-primary-button";
  const destination = safeDestination(section.cta.href);
  const content = <>{section.cta.text}<StorefrontIcon name="arrow" /></>;
  return !destination || preview
    ? <span className={className} aria-disabled="true">{content}</span>
    : <Link className={className} href={destination}>{content}</Link>;
}
