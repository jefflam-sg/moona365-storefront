import type { CSSProperties } from "react";
import type { WebsiteDesign, WebsiteFont } from "./contracts";

const fontFamilies: Record<WebsiteFont, string> = {
  "system-sans": "Arial, Helvetica, sans-serif",
  "classic-serif": "Georgia, 'Times New Roman', serif",
  "humanist-sans": "'Trebuchet MS', Arial, sans-serif",
};

export function themeVariables(design: WebsiteDesign): CSSProperties {
  const colors = Object.fromEntries(
    Object.entries(design.colors).map(([key, value]) => [`--retail-${key}`, value]),
  );
  const buttons = Object.fromEntries(
    Object.entries(design.buttons)
      .filter(([key]) => !["shape", "weight"].includes(key))
      .map(([key, value]) => [`--retail-button-${key}`, value]),
  );
  return {
    ...colors,
    ...buttons,
    "--retail-heading-font": fontFamilies[design.typography.headingFont],
    "--retail-body-font": fontFamilies[design.typography.bodyFont],
    "--retail-text-scale": { compact: ".9", standard: "1", large: "1.12" }[
      design.typography.scale
    ],
    "--retail-button-radius": { square: "0px", soft: "8px", pill: "999px" }[
      design.buttons.shape
    ],
    "--retail-button-weight": { medium: "500", semibold: "600", bold: "700" }[
      design.buttons.weight
    ],
    "--retail-width": { compact: "960px", standard: "1160px", wide: "1360px" }[
      design.layout.contentWidth
    ],
    "--retail-spacing": { compact: "28px", comfortable: "48px", spacious: "72px" }[
      design.layout.sectionSpacing
    ],
    "--retail-radius": { square: "0px", soft: "10px", rounded: "22px" }[
      design.layout.cornerStyle
    ],
    "--retail-logo-height": { small: "32px", standard: "44px", large: "60px" }[
      design.header.logoSize ?? "standard"
    ],
    "--retail-logo-max-width": { small: "110px", standard: "150px", large: "210px" }[
      design.header.logoSize ?? "standard"
    ],
    "--retail-logo-mobile-height": { small: "28px", standard: "36px", large: "48px" }[
      design.header.logoSize ?? "standard"
    ],
    "--retail-logo-mobile-max-width": { small: "96px", standard: "120px", large: "168px" }[
      design.header.logoSize ?? "standard"
    ],
    "--retail-logo-wordmark-size": { small: "1.3em", standard: "1.65em", large: "2.05em" }[
      design.header.logoSize ?? "standard"
    ],
    "--retail-logo-mobile-wordmark-size": { small: "1.15em", standard: "1.4em", large: "1.75em" }[
      design.header.logoSize ?? "standard"
    ],
  } as CSSProperties;
}
