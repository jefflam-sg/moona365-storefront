import type { StorefrontIconName } from "./contracts";

export function StorefrontIcon({ name }: { name: StorefrontIconName | "search" | "account" | "cart" | "arrow" }) {
  return (
    <svg aria-hidden="true" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {name === "search" && <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>}
      {name === "account" && <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>}
      {name === "cart" && <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>}
      {name === "arrow" && <path d="M4 12h16m-6-6 6 6-6 6" />}
      {name === "leaf" && <path d="M20 3C6 3 3 7 5 14c2 6 13 8 15-11ZM4 21 16 8" />}
      {name === "people" && <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-4" /></>}
      {name === "tree" && <path d="M12 2 5 9h3l-5 7h7v6h4v-6h7l-5-7h3Z" />}
      {name === "heart" && <path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 0 9 8 16 8-7 12-12 8-16Z" />}
      {name === "box" && <><path d="M3 4h18v5H3M5 9h14v12H5" /><path d="M9 13h6" /></>}
      {name === "gift" && <><path d="M3 8h18v5H3M5 13h14v8H5M12 8v13" /><path d="M12 8C3 8 5 1 9 3c2 1 3 5 3 5Zm0 0c9 0 7-7 3-5-2 1-3 5-3 5" /></>}
      {name === "truck" && <><path d="M2 5h12v12H2M14 9h4l4 5v3h-8" /><circle cx="5" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>}
    </svg>
  );
}
