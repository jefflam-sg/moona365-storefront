"use client";
/* eslint-disable @next/next/no-img-element -- URLs are tenant content validated by the backend contract. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { HomepageCatalogue, WebsiteDesign, WebsiteNavigation } from "./contracts";
import { StorefrontIcon } from "./icons";
import { resolveNavigation, type ResolvedNavigationNode } from "./navigation";
import { safeImageSource } from "./safe-values";

export function StorefrontBrand({ design, preview = false }: { design: WebsiteDesign; preview?: boolean }) {
  const { brand } = design;
  const logo = brand.logoSource === "text" ? null : brand.logoSource === "organization" ? brand.organization.logo : brand.logo;
  const logoSource = logo ? safeImageSource(logo.src) : null;
  const content = logoSource
    ? <img className="sf-logo" src={logoSource} alt={logo?.alt || brand.name} />
    : <strong className="sf-wordmark">{brand.name}<span aria-hidden="true">•</span></strong>;
  return <Link className="sf-brand-home" href="/" aria-label={`${brand.name} homepage`} onClick={preview ? (event) => event.preventDefault() : undefined}>{content}</Link>;
}

function NavLink({ item, preview }: { item: ResolvedNavigationNode; preview: boolean }) {
  return item.href ? <Link href={item.href} onClick={preview ? (event) => event.preventDefault() : undefined}>{item.label}</Link> : <span>{item.label}</span>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4 4.5-4" /></svg>;
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

export function StorefrontHeader({ design, preview, navigation, catalogue = { categories: [], collections: [], productsBySectionId: {} } }: { design: WebsiteDesign; preview: boolean; navigation?: WebsiteNavigation; catalogue?: HomepageCatalogue }) {
  const { header } = design;
  const items = resolveNavigation("main", navigation, catalogue);
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(null); setMobile(false); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);

  const nested = (children: ResolvedNavigationNode[]) => <ul>{children.map((child) => <li key={child.id}><NavLink item={child} preview={preview} />{child.children.length > 0 && nested(child.children)}</li>)}</ul>;

  return <header ref={root} className="sf-header" data-sticky={header.sticky} data-position={header.logoPosition} data-style={header.style}>
    {header.showAnnouncement && <div className="sf-announcement">{header.announcement}</div>}
    <div className="sf-header-main sf-width">
      <div className="sf-brand"><StorefrontBrand design={design} preview={preview} /></div>
      <button type="button" className="sf-mobile-menu-button" aria-expanded={mobile} aria-label={mobile ? "Close navigation" : "Open navigation"} onClick={() => setMobile((value) => !value)}><MenuIcon /></button>
      <nav className="sf-navigation" data-mobile-open={mobile} aria-label="Main navigation"><ul>{items.map((item) => {
        const expandable = item.children.length > 0 || Boolean(item.promo);
        const isOpen = open === item.id;
        const isCurrent = Boolean(item.href && (pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))));
        return <li key={item.id} className={item.presentation === "MEGA_MENU" ? "sf-navigation-item--mega" : undefined} data-open={isOpen} data-current={isCurrent} onMouseEnter={() => expandable && setOpen(item.id)} onMouseLeave={() => setOpen(null)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null); }}>
          <div className="sf-navigation-trigger"><NavLink item={item} preview={preview} />{expandable && <button type="button" aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} ${item.label} menu`} onClick={() => setOpen(isOpen ? null : item.id)}><ChevronIcon /></button>}</div>
          {expandable && <div className={`sf-navigation-panel ${item.presentation === "MEGA_MENU" ? "sf-mega-menu" : "sf-dropdown"}`} data-open={isOpen} data-promo={Boolean(item.promo)} style={item.presentation === "MEGA_MENU" ? { "--sf-mega-columns": item.columns } as React.CSSProperties : undefined}>
            {nested(item.children)}
            {item.promo && <a className="sf-mega-promo" href={item.promo.href ?? undefined} onClick={preview ? (event) => event.preventDefault() : undefined}>{item.promo.image && safeImageSource(item.promo.image.src) && <img src={safeImageSource(item.promo.image.src)!} alt={item.promo.image.alt} />}<strong>{item.promo.heading}</strong>{item.promo.text && <span>{item.promo.text}</span>}</a>}
          </div>}
        </li>;
      })}</ul></nav>
      <div className="sf-tools" aria-label="Store tools">
        {header.showSearch && <button type="button" disabled={preview} aria-label="Search"><StorefrontIcon name="search" /></button>}
        <button type="button" disabled={preview} aria-label="Account"><StorefrontIcon name="account" /></button>
        <button type="button" disabled={preview} aria-label="Cart"><StorefrontIcon name="cart" /><sup>0</sup></button>
      </div>
    </div>
  </header>;
}
