/* eslint-disable @next/next/no-img-element -- URLs are tenant content validated by the backend contract. */
import type { WebsiteDesign } from "./contracts";
import { StorefrontIcon } from "./icons";
import { safeImageSource } from "./safe-values";

export function StorefrontBrand({ design }: { design: WebsiteDesign }) {
  const { brand } = design;
  const logo =
    brand.logoSource === "text"
      ? null
      : brand.logoSource === "organization"
        ? brand.organization.logo
        : brand.logo;
  const logoSource = logo ? safeImageSource(logo.src) : null;
  return logoSource ? (
    <img className="sf-logo" src={logoSource} alt={logo?.alt || brand.name} />
  ) : (
    <strong className="sf-wordmark">{brand.name}<span>•</span></strong>
  );
}

export function StorefrontHeader({ design, preview }: { design: WebsiteDesign; preview: boolean }) {
  const { header } = design;
  return (
    <header className="sf-header" data-sticky={header.sticky} data-position={header.logoPosition} data-style={header.style}>
      {header.showAnnouncement && <div className="sf-announcement">{header.announcement}</div>}
      <div className="sf-header-main sf-width">
        <div className="sf-brand"><StorefrontBrand design={design} /></div>
        <div className="sf-tools" aria-label="Store tools">
          {header.showSearch && <button type="button" disabled={preview} aria-label="Search"><StorefrontIcon name="search" /></button>}
          <button type="button" disabled={preview} aria-label="Account"><StorefrontIcon name="account" /></button>
          <button type="button" disabled={preview} aria-label="Cart"><StorefrontIcon name="cart" /><sup>0</sup></button>
        </div>
      </div>
    </header>
  );
}
