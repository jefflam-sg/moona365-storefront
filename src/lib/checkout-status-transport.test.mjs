import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeUrl = new URL("../app/api/checkout/route.ts", import.meta.url);

test("checkout status keeps its bearer token out of the backend URL", async () => {
  const source = await readFile(routeUrl, "utf8");
  const statusCall = source.slice(source.indexOf("export async function GET"));

  assert.match(
    statusCall,
    /`\$\{base\}\/public\/storefront\/v1\/checkout\/status`/,
  );
  assert.match(statusCall, /method: "POST"/);
  assert.match(
    statusCall,
    /body: JSON\.stringify\(\{[\s\S]*host,[\s\S]*checkoutToken:/,
  );
  assert.doesNotMatch(statusCall, /checkoutToken=|\?host=/);
});

test("checkout restart sends opaque cookies in a POST body and clears the checkout cookie", async () => {
  const source = await readFile(routeUrl, "utf8");
  const cancelCall = source.slice(
    source.indexOf("export async function DELETE"),
  );

  assert.match(
    cancelCall,
    /`\$\{base\}\/public\/storefront\/v1\/checkout\/cancel`/,
  );
  assert.match(cancelCall, /method: "POST"/);
  assert.match(
    cancelCall,
    /body: JSON\.stringify\(\{[\s\S]*host,[\s\S]*checkoutToken:[\s\S]*cartToken:/,
  );
  assert.match(cancelCall, /result\.cookies\.delete\(CHECKOUT_COOKIE\)/);
  assert.doesNotMatch(cancelCall, /checkoutToken=|cartToken=|\?host=/);
});
