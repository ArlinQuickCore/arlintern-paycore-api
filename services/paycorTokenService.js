import axios from "axios";
import qs from "qs";
import paycorTokenStore from "./paycorTokenStore.js";

const getClientId = () => process.env.PAYCOR_CLIENT_ID;
const getClientSecret = () => process.env.PAYCOR_CLIENT_SECRET;
const getRedirectUri = () => process.env.PAYCOR_REDIRECT_URI;
const getSubscriptionKey = () => process.env.PAYCOR_SUBSCRIPTION_KEY;
const getApiBaseUrl = () => process.env.PAYCOR_API_BASE_URL || "https://apis.paycor.com";

const getTokenUrl = () => `${getApiBaseUrl()}/sts/v1/common/token`;

const withExpiry = (tokenResponseData) => ({
  ...tokenResponseData,
  expires_at: Date.now() + (Number(tokenResponseData.expires_in) || 0) * 1000
});

const paycorTokenService = {
  getTokens() {
    return paycorTokenStore.getTokens();
  },

  clearTokens() {
    return paycorTokenStore.clearTokens();
  },

  async exchangeCodeForTokens(code, legalEntityId, codeVerifier) {
    const payload = qs.stringify({
      grant_type: "authorization_code",
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier
    });

    const response = await axios.post(`${getTokenUrl()}?subscription-key=${encodeURIComponent(getSubscriptionKey())}`, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Ocp-Apim-Subscription-Key": getSubscriptionKey()
      }
    });

    const nextTokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      id_token: response.data.id_token,
      legalEntityId: legalEntityId || paycorTokenStore.getTokens().legalEntityId,
      ...withExpiry(response.data)
    };

    return paycorTokenStore.saveTokens(nextTokens);
  },

  async refreshAccessToken() {
    const currentTokens = paycorTokenStore.getTokens();

    if (!currentTokens.refresh_token) {
      throw new Error("No refresh token available. Re-authorize the app.");
    }

    const payload = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: currentTokens.refresh_token,
      client_id: getClientId(),
      client_secret: getClientSecret()
    });

    try {
      const response = await axios.post(`${getTokenUrl()}?subscription-key=${encodeURIComponent(getSubscriptionKey())}`, payload, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Ocp-Apim-Subscription-Key": getSubscriptionKey()
        }
      });

      const refreshedTokens = {
        ...currentTokens,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || currentTokens.refresh_token,
        id_token: response.data.id_token || currentTokens.id_token,
        ...withExpiry(response.data)
      };

      return paycorTokenStore.saveTokens(refreshedTokens);
    } catch (error) {
      const errorData = error.response?.data || {};
      const isInvalidRefreshToken =
        errorData.error === "invalid_grant" ||
        /invalid.*refresh token/i.test(errorData.error_description || error.message || "");

      if (isInvalidRefreshToken) {
        paycorTokenStore.clearTokens();
        throw new Error("Paycor refresh token is invalid. Re-authorize the app.");
      }

      throw error;
    }
  }
};

export default paycorTokenService;
