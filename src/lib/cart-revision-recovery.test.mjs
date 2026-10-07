import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const commerceUrl = new URL("../storefront/commerce-local.ts", import.meta.url);

test("cart mutations serialize and retry a refreshed revision once", async () => {
  const source = await readFile(commerceUrl, "utf8");

  assert.match(source, /mutationTail:Promise<void>=Promise\.resolve\(\)/);
  assert.match(
    source,
    /const operation=mutationTail\.then\(\(\)=>applyMutation\(change,open\)\)/,
  );
  assert.match(source, /for\(let attempt=0;attempt<2;attempt\+\+\)/);
  assert.match(source, /error\.reason!=="CART_REVISION_CONFLICT"/);
  assert.match(source, /current=value\.details\.cart;announce\(\)/);
});

test("cart revision conflicts never expose the internal stale message", async () => {
  const source = await readFile(commerceUrl, "utf8");

  assert.match(source, /Your cart changed while you were updating it/);
  assert.doesNotMatch(source, /Cart revision is stale/);
});
