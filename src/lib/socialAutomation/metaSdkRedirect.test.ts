import test from "node:test";
import assert from "node:assert/strict";

import {
  extractMetaSdkRedirectUriFromDialogUrl,
  validateMetaSdkRedirectUri,
} from "./metaSdkRedirect";

const sdkRedirectUri =
  "https://staticxx.facebook.com/x/connect/xd_arbiter/?version=46#cb=fe4f20d9371c665db&domain=webgrowth.info&is_canvas=false&origin=https%3A%2F%2Fwebgrowth.info%2Ff7a1224d07ad60f82&relation=opener&frame=fdd607972ee009604";

test("extracts the exact Meta SDK redirect URI from the dialog URL", () => {
  const dialog = new URL("https://www.facebook.com/v26.0/dialog/oauth");
  dialog.searchParams.set("client_id", "app-1");
  dialog.searchParams.set("redirect_uri", sdkRedirectUri);
  dialog.searchParams.set("response_type", "code");

  assert.equal(extractMetaSdkRedirectUriFromDialogUrl(dialog.toString()), sdkRedirectUri);
});

test("validates only the Facebook SDK xd_arbiter redirect URI for this site origin", () => {
  assert.equal(
    validateMetaSdkRedirectUri(sdkRedirectUri, "https://webgrowth.info"),
    sdkRedirectUri
  );
  assert.equal(
    validateMetaSdkRedirectUri(
      sdkRedirectUri.replace("domain=webgrowth.info", "domain=evil.example"),
      "https://webgrowth.info"
    ),
    null
  );
  assert.equal(
    validateMetaSdkRedirectUri(
      sdkRedirectUri.replace("staticxx.facebook.com", "evil.example"),
      "https://webgrowth.info"
    ),
    null
  );
});
