/* eslint-disable @next/next/no-img-element -- URLs are tenant content validated by the backend contract. */
import type { HomepageSection } from "../contracts";
import { safeImageSource } from "../safe-values";
import { SectionAction } from "./section-action";

export function HeroSection({ section, preview }: { section: HomepageSection; preview: boolean }) {
  const imageSource = section.image ? safeImageSource(section.image.src) : null;
  return (
    <section className="sf-hero" data-layout={section.layout} data-section-id={section.id}>
      {section.image && imageSource && <img className="sf-hero-image" src={imageSource} alt={section.image.alt} fetchPriority="high" />}
      <div className="sf-hero-copy sf-width">
        {section.eyebrow && <span className="sf-eyebrow">{section.eyebrow}</span>}
        <h1>{section.heading}</h1>
        {section.description && <p>{section.description}</p>}
        <SectionAction section={section} preview={preview} />
      </div>
    </section>
  );
}
