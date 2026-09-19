# Moona365 Storefront

Public multi-tenant Next.js application. One deployment serves tenant subdomains and verified custom domains.

This application deliberately has no default tenant, Unpackt fallback, demo catalogue or commerce logic. Every public request resolves its Host through the backend public bootstrap contract. Unknown/unverified hosts fail closed. The protected preview transport removes its fragment credential before exchanging it through a same-origin, non-cacheable endpoint; preview commerce is always disabled.

The authoritative Retail Natural renderer currently covers global design tokens, the storefront header and footer, Hero v1, Impact/Statistics v1, Services v1 and the entitled grouped Services Showcase v1. Public requests fail closed when a published snapshot contains another visible block. Draft preview renders completed blocks and reports the number still awaiting migration. Do not deploy until the remaining required section renderers, published navigation and public catalogue contracts are complete.

The authenticated Website editor remains in `moona365-app`; business rules and public data authority remain in `moona365-backend`.
