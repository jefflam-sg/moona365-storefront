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
      {name === "box" && <><path d="M3 4h18v5H3ZM5 9h14v12H5Z" /><path d="M9 13h6" /></>}
      {name === "gift" && <><path d="M3 8h18v5H3ZM5 13h14v8H5ZM12 8v13" /><path d="M12 8C3 8 5 1 9 3c2 1 3 5 3 5Zm0 0c9 0 7-7 3-5-2 1-3 5-3 5" /></>}
      {name === "truck" && <><path d="M2 5h12v12H2ZM14 9h4l4 5v3h-8Z" /><circle cx="5" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>}
      {name === "info" && <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>}
      {name === "globe" && <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>}
      {name === "nutrition" && <><path d="M5 20V11M10 20V7M15 20V4M20 20V9" /><path d="M3 20h19" /></>}
      {name === "storage" && <><path d="M5 7h14v14H5zM3 7h18M8 3h8l2 4H6z" /><path d="M9 12h6" /></>}
      {name === "package" && <><path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10" /></>}
      {name === "ruler" && <><path d="m5 21-3-3L18 2l4 4L6 22Z" /><path d="m14 6 4 4M11 9l2 2M8 12l4 4M5 15l2 2" /></>}
      {name === "shield" && <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Zm-3 10 2 2 4-5" />}
      {name === "heart-leaf" && <><path d="M12 20.5C4.5 15 2.2 10.8 4.3 7.1 6.1 4 9.5 4.7 12 7.4c2.5-2.7 5.9-3.4 7.7-.3 2.1 3.7-.2 7.9-7.7 13.4Z" /><path d="M13.5 12.8c2.1-2.5 4.5-2.8 6.4-2.4-.2 2.6-1.7 5.3-5.8 5.6M14.1 16c1-1.7 2.7-3.1 5.1-4.4" /></>}
      {name === "book-open" && <><path d="M3 5.2c3.7-.8 6.7 0 9 2.1v12c-2.3-2.1-5.3-2.9-9-2.1Z" /><path d="M21 5.2c-3.7-.8-6.7 0-9 2.1v12c2.3-2.1 5.3-2.9 9-2.1Z" /></>}
      {name === "ingredient-bowl" && <><path d="M4 11h16c-.5 5.2-3.2 8-8 8s-7.5-2.8-8-8Z" /><path d="M6 15h12M16.5 3 11 11M15.2 4.8l2.5 1.7" /></>}
      {name === "megaphone" && <><path d="M3 11v3l4 1 9 5V5L7 10H4a1 1 0 0 0-1 1Z" /><path d="m7 15 1 5h3l-1-4M19 8c2 2 2 6 0 8" /></>}
      {name === "tag" && <><path d="m3 12 9-9h7l2 2v7l-9 9-9-9Z" /><path d="M16 7h.01" /></>}
      {name === "mail" && <><path d="M3 6h18v13H3V6Z" /><path d="m3 7 9 7 9-7" /></>}
      {name === "whatsapp" && <><path d="M12 3a9 9 0 0 0-7.7 13.7L3 21l4.4-1.2A9 9 0 1 0 12 3Z" /><path d="M9 8c.4 4 3 6.3 7 7" /></>}
    </svg>
  );
}
