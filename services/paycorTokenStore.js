import fs from "fs";
import path from "path";

const TOKEN_STORAGE_PATH = path.resolve(process.cwd(), "data", "paycor_tokens.json");

const defaultTokens = {
  access_token: null,
  refresh_token: null,
  id_token: null,
  legalEntityId: null,
  expires_at: null
};

const getEnvironmentToken = (name, fallback) => process.env[name] || fallback;

const ensureTokenStorage = () => {
  const tokenDir = path.dirname(TOKEN_STORAGE_PATH);

  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }

  if (!fs.existsSync(TOKEN_STORAGE_PATH)) {
    fs.writeFileSync(TOKEN_STORAGE_PATH, JSON.stringify(defaultTokens, null, 2));
  }
};

let storedTokens = (() => {
  try {
    ensureTokenStorage();
    const raw = fs.readFileSync(TOKEN_STORAGE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return {
      ...defaultTokens,
      ...parsed
    };
  } catch (error) {
    console.warn("Could not load persisted Paycor tokens:", error.message);
    return { ...defaultTokens };
  }
})();

// Set when tokens are exchanged or refreshed during this instance's lifetime.
// On Vercel (read-only FS), freshly refreshed in-memory tokens must take
// precedence over the (possibly stale) PAYCOR_ACCESS_TOKEN env var.
let hasFreshTokens = false;

const paycorTokenStore = {
  loadTokens() {
    if (process.env.VERCEL) {
      if (hasFreshTokens) {
        return {
          ...storedTokens,
          legalEntityId: getEnvironmentToken("PAYCOR_LEGAL_ENTITY_ID", storedTokens.legalEntityId)
        };
      }

      return {
        ...storedTokens,
        access_token: getEnvironmentToken("PAYCOR_ACCESS_TOKEN", storedTokens.access_token),
        refresh_token: getEnvironmentToken("PAYCOR_REFRESH_TOKEN", storedTokens.refresh_token),
        legalEntityId: getEnvironmentToken("PAYCOR_LEGAL_ENTITY_ID", storedTokens.legalEntityId)
      };
    }

    try {
      ensureTokenStorage();
      const raw = fs.readFileSync(TOKEN_STORAGE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      storedTokens = {
        ...defaultTokens,
        ...parsed,
        legalEntityId: getEnvironmentToken("PAYCOR_LEGAL_ENTITY_ID", parsed.legalEntityId)
      };
      return storedTokens;
    } catch (error) {
      console.warn("Unable to read stored Paycor tokens:", error.message);
      storedTokens = { ...defaultTokens };
      return storedTokens;
    }
  },

  saveTokens(nextTokens) {
    storedTokens = {
      ...defaultTokens,
      ...nextTokens
    };
    hasFreshTokens = true;

    if (!process.env.VERCEL) {
      ensureTokenStorage();
      fs.writeFileSync(TOKEN_STORAGE_PATH, JSON.stringify(storedTokens, null, 2));
    }

    return storedTokens;
  },

  clearTokens() {
    return this.saveTokens({ ...defaultTokens });
  },

  getTokens() {
    return this.loadTokens();
  }
};

export default paycorTokenStore;
