import type { HomepageCatalogue, WebsiteDesign, WebsiteNavigation } from "./contracts";
import { StorefrontBrand } from "./header";
import Link from "next/link";
import { resolveNavigation } from "./navigation";
import { NewsletterSignup } from "./newsletter-signup";
import { safeImageSource } from "./safe-values";
import type { CSSProperties } from "react";

/* Tenant-managed footer media is validated at the published snapshot boundary. */
/* eslint-disable @next/next/no-img-element */

export function StorefrontFooter({ design, preview = false, navigation, catalogue = { categories: [], collections: [], productsBySectionId: {} } }: { design: WebsiteDesign; preview?: boolean; navigation?: WebsiteNavigation; catalogue?: HomepageCatalogue }) {
  const { footer, brand } = design;
  const items = resolveNavigation("footer", navigation, catalogue);
  const blocks = footer.blocks ?? [];
  return (
    <footer className="sf-footer">
      <div className="sf-width sf-footer-content" style={{ "--sf-footer-columns": footer.columns } as CSSProperties}>
        {(footer.showLogo || footer.showAddress || footer.showContact) && <div className="sf-footer-details sf-footer-block">
          {footer.showLogo && <StorefrontBrand design={design} preview={preview} />}
          {footer.showAddress && brand.organization.address && <p>{brand.organization.address}</p>}
          {footer.showContact && <p>{brand.organization.email}{brand.organization.email && brand.organization.phone && <br />}{brand.organization.phone}</p>}
        </div>}
        {blocks.map((block) => <div key={block.id} className={`sf-footer-block sf-footer-block-${block.type}`} style={{ gridColumn: `span ${block.width}` }}>{block.type === "newsletter" && <NewsletterSignup {...block} />}{block.type === "media" && block.image && safeImageSource(block.image.src) && (block.href ? <Link href={block.href}><img src={block.image.src} alt={block.image.alt} /></Link> : <img src={block.image.src} alt={block.image.alt} />)}{block.type === "links" && <><strong>{block.heading}</strong>{block.links.map((link) => <Link key={link.id} href={link.href}>{link.label}</Link>)}</>}</div>)}
        {blocks.length === 0 && items.length > 0 && <nav className="sf-footer-navigation" aria-label="Footer navigation">{items.map((item) => <div key={item.id}><strong>{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</strong>{item.children.map((child) => child.href ? <Link key={child.id} href={child.href}>{child.label}</Link> : <span key={child.id}>{child.label}</span>)}</div>)}</nav>}
      </div>
      <div className="sf-width sf-copyright">
        <span>{footer.copyright.replaceAll("{year}", String(new Date().getFullYear()))}</span>
        <span>Powered by Moona365</span>
      </div>
    </footer>
  );
}
