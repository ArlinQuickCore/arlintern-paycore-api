import test from "node:test";
import assert from "node:assert/strict";
import paycorAuthController from "../controllers/paycorAuthController.js";

process.env.PAYCOR_CLIENT_ID = "test-client-id";
process.env.PAYCOR_REDIRECT_URI = "https://example.com/oauth/callback";
process.env.PAYCOR_AUTH_BASE_URL = "https://hcm-demo.paycor.com/appactivation";
process.env.PAYCOR_SCOPES = "test-scope";
process.env.PAYCOR_SUBSCRIPTION_KEY = "test-subscription-key";

test("buildAuthorizationUrl includes required OAuth parameters", () => {
  const url = new URL(paycorAuthController.buildAuthorizationUrl());

  assert.equal(url.origin, "https://hcm-demo.paycor.com");
  assert.equal(url.pathname, "/appactivation/authorize");
  assert.equal(url.searchParams.get("client_id"), "test-client-id");
  assert.equal(url.searchParams.get("redirect_uri"), "https://example.com/oauth/callback");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "test-scope offline_access");
  assert.equal(url.searchParams.get("subscription-key"), "test-subscription-key");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("code_challenge"));
  assert.ok(url.searchParams.get("state"));
});

test("handleCallback rejects requests without a matching state", async () => {
  const req = { query: { code: "abc123", state: "unknown-state" } };
  let statusCode;
  let sentBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    send(body) {
      sentBody = body;
      return this;
    }
  };

  await paycorAuthController.handleCallback(req, res);

  assert.equal(statusCode, 400);
  assert.match(sentBody, /state/i);
});
