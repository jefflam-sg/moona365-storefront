/* eslint-disable @next/next/no-img-element -- URLs are tenant content validated by the backend contract. */
import type { HomepageSection } from "../contracts";
import { safeImageSource } from "../safe-values";
import { SectionAction } from "./section-action";

export function FeaturedCollectionSection({
  section,
  preview,
}: {
  section: HomepageSection;
  preview: boolean;
}) {
  const imageSource = section.image ? safeImageSource(section.image.src) : null;
  return (
    <section
      className="sf-section sf-width sf-featured-collection"
      data-layout={section.layout}
      data-section-id={section.id}
    >
      <div className="sf-featured-copy">
        {section.eyebrow && <span className="sf-eyebrow">{section.eyebrow}</span>}
        <h2>{section.heading}</h2>
        {section.description && <p>{section.description}</p>}
        <SectionAction section={section} preview={preview} />
      </div>
      {section.image && imageSource && (
        <img src={imageSource} alt={section.image.alt} loading="lazy" />
      )}
    </section>
  );
}
