import type { HomepageCatalogue, WebsiteDesign, WebsiteNavigation } from "./contracts";
import { StorefrontBrand } from "./header";
import Link from "next/link";
import { resolveNavigation } from "./navigation";

export function StorefrontFooter({ design, preview = false, navigation, catalogue = { categories: [], collections: [], productsBySectionId: {} } }: { design: WebsiteDesign; preview?: boolean; navigation?: WebsiteNavigation; catalogue?: HomepageCatalogue }) {
  const { footer, brand } = design;
  const items = resolveNavigation("footer", navigation, catalogue);
  return (
    <footer className="sf-footer">
      <div className="sf-width sf-footer-content">
        {footer.showLogo && <StorefrontBrand design={design} preview={preview} />}
        <div className="sf-footer-details">
          {footer.showAddress && brand.organization.address && <p>{brand.organization.address}</p>}
          {footer.showContact && <p>{brand.organization.email}{brand.organization.email && brand.organization.phone && <br />}{brand.organization.phone}</p>}
        </div>
        {items.length > 0 && <nav className="sf-footer-navigation" aria-label="Footer navigation">{items.map((item) => <div key={item.id}><strong>{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</strong>{item.children.map((child) => child.href ? <Link key={child.id} href={child.href}>{child.label}</Link> : <span key={child.id}>{child.label}</span>)}</div>)}</nav>}
      </div>
      <div className="sf-width sf-copyright">
        <span>{footer.copyright.replaceAll("{year}", String(new Date().getFullYear()))}</span>
        <span>Powered by Moona365</span>
      </div>
    </footer>
  );
}
