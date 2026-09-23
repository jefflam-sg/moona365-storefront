/* eslint-disable @next/next/no-img-element -- URLs are tenant content validated by the backend contract. */
import Link from "next/link";
import type { CSSProperties } from "react";
import type { HomepageSection } from "../contracts";
import { StorefrontIcon } from "../icons";
import { safeDestination, safeImageSource } from "../safe-values";
import { SectionAction } from "./section-action";
import { NewsletterSignup } from "../newsletter-signup";

function SectionHeading({ section }: { section: HomepageSection }) {
  return (
    <header className="sf-section-heading">
      {section.eyebrow && <span className="sf-eyebrow">{section.eyebrow}</span>}
      <h2>{section.heading}</h2>
      {section.description && <p>{section.description}</p>}
    </header>
  );
}

export function StatsSection({ section, preview }: { section: HomepageSection; preview: boolean }) {
  const imageSource = section.image ? safeImageSource(section.image.src) : null;
  return (
    <section className="sf-section sf-width sf-stats" data-section-id={section.id}>
      {section.image && imageSource && <img src={imageSource} alt={section.image.alt} loading="lazy" />}
      <div className="sf-stats-copy">
        <SectionHeading section={section} />
        <SectionAction section={section} preview={preview} secondary />
      </div>
      <div className="sf-stat-grid">
        {section.items.map((item) => <div key={item.id}><StorefrontIcon name={item.icon} /><strong>{item.value}</strong><span>{item.title}</span></div>)}
      </div>
    </section>
  );
}

function ServiceItem({ item, preview }: { item: HomepageSection["items"][number]; preview: boolean }) {
  const destination = safeDestination(item.href);
  const content = <><StorefrontIcon name={item.icon} /><span><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</span></>;
  return destination && !preview
    ? <Link className="sf-service-card" href={destination}>{content}</Link>
    : <article className="sf-service-card">{content}</article>;
}

export function ServicesSection({ section, preview }: { section: HomepageSection; preview: boolean }) {
  return (
    <section className="sf-section sf-width" data-section-id={section.id}>
      <div className="sf-heading-with-action">
        <SectionHeading section={section} />
        <SectionAction section={section} preview={preview} secondary />
      </div>
      <div className="sf-service-grid">
        {section.items.map((item) => <ServiceItem key={item.id} item={item} preview={preview} />)}
      </div>
    </section>
  );
}

export function BrandValuesSection({ section }: { section: HomepageSection; preview: boolean }) {
  if (!section.items.length) return null;
  return <section className="sf-pdp-brand-values sf-width" data-section-id={section.id} aria-label={section.heading || "Our values"}>{section.items.map((item) => <article key={item.id}><StorefrontIcon name={item.icon} /><span><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</span></article>)}</section>;
}

export function NewsletterSection({ section, preview }: { section: HomepageSection; preview: boolean }) {
  const imageSource = section.image ? safeImageSource(section.image.src) : null;
  return <section className="sf-section sf-width sf-newsletter-section" data-section-id={section.id}>
    <div className="sf-newsletter-intro">{section.image && imageSource && <img src={imageSource} alt={section.image.alt} loading="lazy" />}<div><h2>{section.heading}</h2>{section.description && <p>{section.description}</p>}</div></div>
    <NewsletterSignup buttonLabel={section.cta.text || "Subscribe"} interests={section.items.map((item) => ({ id: item.id, label: item.title, icon: item.icon }))} preview={preview} />
  </section>;
}

export function GroupedServicesSection({ section, preview }: { section: HomepageSection; preview: boolean }) {
  const colors = section.colors;
  const style = colors ? {
    "--ssg-background": colors.background || "color-mix(in srgb,var(--retail-secondary) 45%,var(--retail-background))",
    "--ssg-panel": colors.panel || "color-mix(in srgb,var(--retail-surface) 96%,var(--retail-secondary))",
    "--ssg-card": colors.card || "var(--retail-surface)",
    "--ssg-accent": colors.accent || "var(--retail-primary)",
    "--ssg-text": colors.text || "var(--retail-text)",
    "--ssg-muted": colors.mutedText || "var(--retail-textMuted)",
  } as CSSProperties : undefined;
  return (
    <section className="sf-section sf-grouped-services" style={style} data-section-id={section.id}>
      <div className="sf-grouped-panel">
        <div className="sf-grouped-heading"><SectionHeading section={section} /></div>
        <div className="sf-service-groups">{section.groups?.map((group) => (
          <div className="sf-service-band" key={group.id}>
            <div className="sf-service-row">
            <div className="sf-service-group"><StorefrontIcon name={group.icon} /><h3>{group.title}</h3><p>{group.description}</p></div>
            <div className="sf-grouped-cards">
              {group.items.map((item) => <article className="sf-grouped-card" key={item.id}><span className="sf-grouped-icon"><StorefrontIcon name={item.icon} /></span><div><h4>{item.title}</h4><p>{item.description}</p></div></article>)}
            </div>
            </div>
          </div>
        ))}</div>
        <div className="sf-grouped-action"><SectionAction section={section} preview={preview} /></div>
      </div>
    </section>
  );
}
