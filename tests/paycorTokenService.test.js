import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import axios from "axios";
import paycorApiService from "../services/paycorApiService.js";
import paycorTokenService from "../services/paycorTokenService.js";
import paycorTokenStore from "../services/paycorTokenStore.js";

test("getEmployees returns guidance to complete OAuth when tokens are missing", async () => {
  mock.method(paycorTokenService, "getTokens", () => ({
    access_token: null,
    refresh_token: null,
    legalEntityId: null
  }));

  const result = await paycorApiService.getEmployees();

  assert.match(result.message, /\/oauth\/login/i);
  assert.match(result.message, /oauth/i);
  assert.match(result.message, /callback/i);

  mock.reset();
});

test("refreshAccessToken throws when no refresh token is stored", async () => {
  mock.method(paycorTokenStore, "getTokens", () => ({
    access_token: null,
    refresh_token: null,
    legalEntityId: null
  }));

  await assert.rejects(
    () => paycorTokenService.refreshAccessToken(),
    /No refresh token available/
  );
});

test("refreshAccessToken persists rotated tokens", async () => {
  mock.method(paycorTokenStore, "getTokens", () => ({
    access_token: "old-access-token",
    refresh_token: "old-refresh-token",
    legalEntityId: "le-123"
  }));

  const saveTokensMock = mock.method(paycorTokenStore, "saveTokens", (tokens) => tokens);
  mock.method(axios, "post", async () => ({
    data: {
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      expires_in: 3600
    }
  }));

  const result = await paycorTokenService.refreshAccessToken();

  assert.equal(result.access_token, "new-access-token");
  assert.equal(result.refresh_token, "new-refresh-token");
  assert.equal(saveTokensMock.mock.calls.length, 1);

  mock.reset();
});
