import type { HomepageCatalogue, StorefrontSnapshot } from "./contracts";
import { StorefrontHeader } from "./header";
import { StorefrontFooter } from "./footer";
import { renderHomepageSection, unsupportedVisibleSections } from "./sections/registry";
import { themeVariables } from "./theme";

export function StorefrontRenderer({ snapshot, preview = false, catalogue = { categories: [], collections: [], productsBySectionId: {} } }: { snapshot: StorefrontSnapshot; preview?: boolean; catalogue?: HomepageCatalogue }) {
  const unsupported = unsupportedVisibleSections(snapshot.homepage.sections);
  return (
    <div className="sf-site" data-preview={preview} style={themeVariables(snapshot.design)}>
      {preview && <div className="sf-preview-banner" role="status">
        Draft preview · commerce disabled
        {unsupported.length > 0 && ` · ${unsupported.length} section${unsupported.length === 1 ? "" : "s"} awaiting renderer migration`}
      </div>}
      <StorefrontHeader design={snapshot.design} preview={preview} />
      <main>
        {snapshot.homepage.sections
          .filter((section) => section.visible)
          .map((section) => renderHomepageSection(section, preview, catalogue))}
      </main>
      <StorefrontFooter design={snapshot.design} />
    </div>
  );
}

export function supportsPublishedSnapshot(snapshot: StorefrontSnapshot) {
  return unsupportedVisibleSections(snapshot.homepage.sections).length === 0;
}
