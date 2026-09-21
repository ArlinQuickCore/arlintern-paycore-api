import crypto from "node:crypto";
import paycorTokenService from "../services/paycorTokenService.js";

const getClientId = () => process.env.PAYCOR_CLIENT_ID;
const getRedirectUri = () => process.env.PAYCOR_REDIRECT_URI;
const getAuthBaseUrl = () => process.env.PAYCOR_AUTH_BASE_URL || "https://hcm.paycor.com/appactivation";
const getScopes = () => process.env.PAYCOR_SCOPES || process.env.PAYCOR_SCOPE_NAME || "";

// Short-lived CSRF state cache; entries expire after 10 minutes.
const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

const pruneExpiredStates = () => {
  const now = Date.now();
  for (const [state, pendingState] of pendingStates) {
    if (pendingState.expiresAt <= now) {
      pendingStates.delete(state);
    }
  }
};

const buildAuthorizationUrl = () => {
  const authUrl = new URL(`${getAuthBaseUrl()}/authorize`);
  const state = crypto.randomBytes(16).toString("hex");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

  pruneExpiredStates();
  pendingStates.set(state, { expiresAt: Date.now() + STATE_TTL_MS, verifier });

  authUrl.searchParams.set("client_id", getClientId());
  authUrl.searchParams.set("redirect_uri", getRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", `${getScopes()} offline_access`.trim());
  authUrl.searchParams.set("subscription-key", process.env.PAYCOR_SUBSCRIPTION_KEY || "");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);

  return authUrl.toString();
};

const paycorAuthController = {
  buildAuthorizationUrl,

  async login(req, res) {
    if (!getClientId() || !getRedirectUri()) {
      return res.status(500).json({
        error: "Paycor OAuth is not configured. Set PAYCOR_CLIENT_ID and PAYCOR_REDIRECT_URI in the environment."
      });
    }

    return res.redirect(buildAuthorizationUrl());
  },

  async handleCallback(req, res) {
    try {
      const { code, state, legalEntityId } = req.query;

      if (!code) {
        return res.status(400).send("Missing authorization code");
      }

      pruneExpiredStates();
      if (!state || !pendingStates.has(state)) {
        return res.status(400).send("Missing or expired state parameter");
      }
      const pendingState = pendingStates.get(state);
      pendingStates.delete(state);

      const tokenResponse = await paycorTokenService.exchangeCodeForTokens(
        code,
        legalEntityId,
        pendingState.verifier
      );

      return res.json({
        message: "Tokens generated successfully",
        tokens: tokenResponse
      });
    } catch (error) {
      console.error("Callback Error:", error.response?.data || error.message);
      res.status(500).send("Error generating tokens");
    }
  },

  async getStoredTokens(req, res) {
    try {
      const tokens = paycorTokenService.getTokens();

      return res.status(200).json({
        message: "Stored tokens retrieved successfully",
        tokens
      });
    } catch (error) {
      console.error("Get Stored Tokens Error:", error.message);
      return res.status(500).send("Error retrieving stored tokens");
    }
  }
};

export default paycorAuthController;
