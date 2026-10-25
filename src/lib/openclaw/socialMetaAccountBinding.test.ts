import assert from "node:assert/strict";
import test from "node:test";
import { META_ACCOUNT_BINDINGS, selectManagedMetaAccount } from "./socialMetaAccountBinding";

const both = [
 { facebookPageId: META_ACCOUNT_BINDINGS.webgrowth.page,
   instagramAccountId: META_ACCOUNT_BINDINGS.webgrowth.instagram,
   pageAccessToken: "webgrowth-fixture-token-for-test" },
 { facebookPageId: META_ACCOUNT_BINDINGS.nouncompass.page,
   instagramAccountId: META_ACCOUNT_BINDINGS.nouncompass.instagram,
   pageAccessToken: "nouncompass-fixture-token-for-test" },
];
test("select NOUNCompass Page only from its paired token", () => {
 const got=selectManagedMetaAccount("nouncompass","meta.page.profile",
   META_ACCOUNT_BINDINGS.nouncompass.page,both);
 assert.equal(got?.graphId,META_ACCOUNT_BINDINGS.nouncompass.page);
 assert.equal(got?.pageToken,"nouncompass-fixture-token-for-test");
});
test("select NOUNCompass Instagram only from its paired token", () => {
 const got=selectManagedMetaAccount("nouncompass","meta.instagram.publish",
   META_ACCOUNT_BINDINGS.nouncompass.instagram,both);
 assert.equal(got?.pageToken,"nouncompass-fixture-token-for-test");
});
test("selected Web Growth Page never supplies NOUNCompass credentials", () => {
 const onlyWebGrowth=[both[0]];
 assert.equal(selectManagedMetaAccount("nouncompass","meta.page.post",
   META_ACCOUNT_BINDINGS.nouncompass.page,onlyWebGrowth),null);
});
test("reject mismatched Facebook and Instagram linkage", () => {
 const mismatch=[{...both[1],instagramAccountId:META_ACCOUNT_BINDINGS.webgrowth.instagram}];
 assert.equal(selectManagedMetaAccount("nouncompass","meta.instagram.publish",
   META_ACCOUNT_BINDINGS.nouncompass.instagram,mismatch),null);
});
test("reject a different tenant target", () => {
 assert.equal(selectManagedMetaAccount("nouncompass","meta.page.post",
   META_ACCOUNT_BINDINGS.webgrowth.page,both),null);
});
test("never allow WhatsApp via Meta account selector", () => {
 assert.equal(selectManagedMetaAccount("nouncompass","whatsapp.reply",
   META_ACCOUNT_BINDINGS.nouncompass.page,both),null);
});
test("do not accept missing provider token", () => {
 const noToken=[{...both[1],pageAccessToken:""}];
 assert.equal(selectManagedMetaAccount("nouncompass","meta.page.profile",
   META_ACCOUNT_BINDINGS.nouncompass.page,noToken),null);
});
test("independent Web Growth pairing stays intact", () => {
 assert.equal(selectManagedMetaAccount("webgrowth","meta.instagram.profile",
   META_ACCOUNT_BINDINGS.webgrowth.instagram,both)?.pageToken,
 "webgrowth-fixture-token-for-test");
});
