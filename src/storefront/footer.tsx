import type { WebsiteDesign } from "./contracts";
import { StorefrontBrand } from "./header";

export function StorefrontFooter({ design, preview = false }: { design: WebsiteDesign; preview?: boolean }) {
  const { footer, brand } = design;
  return (
    <footer className="sf-footer">
      <div className="sf-width sf-footer-content">
        {footer.showLogo && <StorefrontBrand design={design} preview={preview} />}
        <div className="sf-footer-details">
          {footer.showAddress && brand.organization.address && <p>{brand.organization.address}</p>}
          {footer.showContact && <p>{brand.organization.email}{brand.organization.email && brand.organization.phone && <br />}{brand.organization.phone}</p>}
        </div>
      </div>
      <div className="sf-width sf-copyright">
        <span>{footer.copyright.replaceAll("{year}", String(new Date().getFullYear()))}</span>
        <span>Powered by Moona365</span>
      </div>
    </footer>
  );
}
