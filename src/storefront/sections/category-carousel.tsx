"use client";

/* Tenant-configured catalogue images are validated at the API boundary. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicCategory } from "../contracts";
import { safeImageSource } from "../safe-values";
import { categoryHref } from "../category-url";

function useCategoryCarouselNavigation(categoryCount: number) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canMoveBack, setCanMoveBack] = useState(false);
  const [canMoveForward, setCanMoveForward] = useState(false);
  const updateNavigation = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanMoveBack(track.scrollLeft > 2);
    setCanMoveForward(track.scrollLeft < maximum - 2);
  }, []);
  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * Math.max(260, track.clientWidth * 0.72), behavior: reducedMotion ? "auto" : "smooth" });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const frame = window.requestAnimationFrame(updateNavigation);
    const observer = new ResizeObserver(updateNavigation);
    observer.observe(track);
    track.addEventListener("scroll", updateNavigation, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("scroll", updateNavigation);
    };
  }, [categoryCount, updateNavigation]);

  return { trackRef, canMoveBack, canMoveForward, move };
}

function Arrow({ direction, disabled, onClick }: { direction: "previous" | "next"; disabled: boolean; onClick: () => void }) {
  const previous = direction === "previous";
  return <button type="button" className={`sf-category-arrow sf-category-arrow-${direction}`} aria-label={`${previous ? "Previous" : "Next"} categories`} disabled={disabled} onClick={onClick}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={previous ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} /></svg></button>;
}

export function CategoryCarousel({ categories, preview }: { categories: PublicCategory[]; preview: boolean }) {
  const { trackRef, canMoveBack, canMoveForward, move } = useCategoryCarouselNavigation(categories.length);

  return <div className="sf-category-carousel-shell">
    <Arrow direction="previous" disabled={!canMoveBack} onClick={() => move(-1)} />
    <div className="sf-category-track" ref={trackRef}>
      {categories.map((category) => {
        const src = category.image ? safeImageSource(category.image.src) : null;
        return <Link className="sf-category-card sf-card-link" href={categoryHref(category)} key={category.id} onClick={preview ? (event) => event.preventDefault() : undefined}>
          {category.image && src ? <img src={src} alt={category.image.alt} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}
          <div><h3>{category.name}</h3></div>
        </Link>;
      })}
    </div>
    <Arrow direction="next" disabled={!canMoveForward} onClick={() => move(1)} />
  </div>;
}

export function ChildCategoryCarousel({ categories, label }: { categories: PublicCategory[]; label: string }) {
  const { trackRef, canMoveBack, canMoveForward, move } = useCategoryCarouselNavigation(categories.length);
  return <div className="sf-child-category-carousel-shell">
    <Arrow direction="previous" disabled={!canMoveBack} onClick={() => move(-1)} />
    <div className="sf-child-categories" role="navigation" aria-label={label} ref={trackRef}>
      {categories.map((category) => {
        const src = category.image ? safeImageSource(category.image.src) : null;
        return <Link key={category.id} href={categoryHref(category)}>{src ? <img src={src} alt="" /> : <span aria-hidden="true" />}{category.name}</Link>;
      })}
    </div>
    <Arrow direction="next" disabled={!canMoveForward} onClick={() => move(1)} />
  </div>;
}
