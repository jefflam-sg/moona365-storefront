"use client";

/* Tenant-configured catalogue images are validated at the API boundary. */
/* eslint-disable @next/next/no-img-element */
import { useRef } from "react";
import Link from "next/link";
import type { PublicCategory } from "../contracts";
import { safeImageSource } from "../safe-values";

export function CategoryCarousel({ categories, preview }: { categories: PublicCategory[]; preview: boolean }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const move = (direction: -1 | 1) => trackRef.current?.scrollBy({ left: direction * Math.max(260, trackRef.current.clientWidth * 0.75), behavior: "smooth" });

  return <div className="sf-category-carousel-shell">
    <button type="button" className="sf-category-arrow sf-category-arrow-previous" aria-label="Previous categories" onClick={() => move(-1)}>&#8592;</button>
    <div className="sf-category-track" ref={trackRef}>
      {categories.map((category) => {
        const src = category.image ? safeImageSource(category.image.src) : null;
        return <Link className="sf-category-card sf-card-link" href={`/categories/${category.id}${category.hasChildren ? "?includeSubcategories=true" : ""}`} key={category.id} onClick={preview ? (event) => event.preventDefault() : undefined}>
          {category.image && src ? <img src={src} alt={category.image.alt} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}
          <div><h3>{category.name}</h3></div>
        </Link>;
      })}
    </div>
    <button type="button" className="sf-category-arrow sf-category-arrow-next" aria-label="Next categories" onClick={() => move(1)}>&#8594;</button>
  </div>;
}
