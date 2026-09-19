import { loadHomepageCatalogue as load } from "./catalogue-core.mjs";
import type { HomepageCatalogue, StorefrontSnapshot } from "@/storefront/contracts";

export async function loadHomepageCatalogue(host: string, snapshot: StorefrontSnapshot): Promise<HomepageCatalogue | null> {
  return (await load(host, snapshot)) as HomepageCatalogue | null;
}
