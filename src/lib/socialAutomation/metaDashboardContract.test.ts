import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const exchangePath = path.join(
  process.cwd(),
  "src/app/api/admin/content-automation/meta/exchange/route.ts"
);
const selectPath = path.join(
  process.cwd(),
  "src/app/api/admin/content-automation/meta/select/route.ts"
);

function source(file: string) {
  assert.equal(existsSync(file), true, `Expected ${path.relative(process.cwd(), file)} to exist`);
  return readFileSync(file, "utf8");
}

function candidateMapper(exchange: string) {
  const match = exchange.match(/function candidate\(page: MetaManagedPage\) \{[\s\S]*?\n\}/);
  assert.ok(match, "Expected a dedicated safe Meta candidate mapper");
  return match[0];
}

test("Meta dashboard exchange route keeps the code exchange and pending token server-side", () => {
  const exchange = source(exchangePath);
  assert.match(exchange, /export async function POST/);
  assert.match(exchange, /hasContentAutomationAdminAccess/);
  assert.match(exchange, /isSameOriginMutation/);
  assert.match(exchange, /exchangeCode/);
  assert.match(exchange, /exchangeLongLivedUserToken/);
  assert.match(exchange, /listManagedPages/);
  assert.match(exchange, /createMetaPendingConnection/);
  assert.match(exchange, /META_PENDING_CONNECTION_COOKIE/);
  assert.match(exchange, /httpOnly:\s*true/);
  assert.match(exchange, /status:\s*"selection-required"/);
  assert.match(exchange, /candidates:\s*candidates\.map\(candidate\)/);

  const mapper = candidateMapper(exchange);
  assert.match(mapper, /facebookPageId/);
  assert.match(mapper, /facebookPageName/);
  assert.match(mapper, /instagramAccountId/);
  assert.match(mapper, /instagramAccountName/);
  assert.doesNotMatch(mapper, /userAccessToken|pageAccessToken|encryptedTokens/);
});

test("Meta dashboard selection route revalidates pending state before saving the selected Page", () => {
  const select = source(selectPath);
  assert.match(select, /export async function POST/);
  assert.match(select, /hasContentAutomationAdminAccess/);
  assert.match(select, /isSameOriginMutation/);
  assert.match(select, /readMetaPendingConnection/);
  assert.match(select, /listManagedPages/);
  assert.match(select, /facebookPageId/);
  assert.match(select, /encryptMetaTokens/);
  assert.match(select, /saveMetaConnection/);
  assert.match(select, /META_CONNECTED/);
  assert.match(select, /maxAge:\s*0/);
  assert.match(select, /NextResponse\.json\(\{ ok: true, status: "connected" \}\)/);
});
