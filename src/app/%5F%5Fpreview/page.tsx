import type { Metadata } from "next";
import { PreviewClient } from "./preview-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Website draft preview",
  robots: { index: false, follow: false, nocache: true },
};

export default function PreviewPage() {
  return <PreviewClient />;
}
