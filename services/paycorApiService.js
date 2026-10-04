import axios from "axios";
import paycorTokenService from "./paycorTokenService.js";

const getApiBaseUrl = () => process.env.PAYCOR_API_BASE_URL || "https://apis.paycor.com";
const getSubscriptionKey = () => process.env.PAYCOR_SUBSCRIPTION_KEY;
const isLegalEntityId = (value) => /^\d+$/.test(String(value || ""));

// Time card endpoints (punches/hours) can take 30+ seconds on Paycor's side.
const paycorRequestConfig = { timeout: 60000 };

function buildHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Ocp-Apim-Subscription-Key": getSubscriptionKey()
  };
}

async function retryAfterRefresh(requestFn, label, emptyResponse) {
  for (let attempt = 0; attempt <= 3; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.response?.status === 429 && attempt < 3) {
        const retryAfter = Number(error.response.headers?.["retry-after"]) || 2;
        await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter, 10) * 1000));
        continue;
      }

      if (!error.response || error.response.status !== 401) {
        throw error;
      }

      try {
        await paycorTokenService.refreshAccessToken();
        return await requestFn();
      } catch (refreshError) {
        const failure = {
          status: "unauthorized",
          message: `Paycor rejected the stored token while ${label}. Re-run OAuth.`,
          details: refreshError.response?.data || refreshError.message
        };

        return emptyResponse ? { ...emptyResponse, ...failure } : failure;
      }
    }
  }

  throw new Error(`Paycor rate limit exceeded while ${label}. Try again later.`);
}

async function getResource(resourcePath, label, emptyKey) {
  const { access_token, legalEntityId } = paycorTokenService.getTokens();

  if (!access_token || !isLegalEntityId(legalEntityId)) {
    return {
      [emptyKey]: [],
      message: "A valid Paycor access token and numeric legal entity ID are required. Complete OAuth first at /oauth/login and return through /oauth/callback, then set PAYCOR_LEGAL_ENTITY_ID to the activated numeric legal entity ID."
    };
  }

  const requestFn = async () => {
    const currentTokens = paycorTokenService.getTokens();
    const url = `${getApiBaseUrl()}${resourcePath.replace(":legalEntityId", currentTokens.legalEntityId)}`;
    const response = await axios.get(url, {
      ...paycorRequestConfig,
      headers: buildHeaders(currentTokens.access_token)
    });

    return response.data;
  };

  return retryAfterRefresh(requestFn, label, { [emptyKey]: [] });
}

async function createResource(resourcePath, payload, label) {
  const { access_token, legalEntityId } = paycorTokenService.getTokens();

  if (!access_token || !isLegalEntityId(legalEntityId)) {
    throw new Error("No Paycor token or legal entity is stored yet. Complete OAuth first.");
  }

  const requestFn = async () => {
    const currentTokens = paycorTokenService.getTokens();
    const url = `${getApiBaseUrl()}${resourcePath.replace(":legalEntityId", currentTokens.legalEntityId)}`;
    const response = await axios.post(url, payload, {
      ...paycorRequestConfig,
      headers: {
        ...buildHeaders(currentTokens.access_token),
        "Content-Type": "application/json"
      }
    });

    return response.data;
  };

  return retryAfterRefresh(requestFn, label);
}

const paycorApiService = {
  getEmployees(params = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : "";
    return getResource(`/v1/legalentities/:legalEntityId/employees${suffix}`, "loading employees", "employees");
  },

  getEmployeeById(employeeId) {
    return getResource(`/v1/legalentities/:legalEntityId/employees/${employeeId}`, "loading employee", "employee");
  },

  getDepartments() {
    return getResource("/v1/legalentities/:legalEntityId/departments", "loading departments", "departments");
  },

  getPositions() {
    return getResource("/v1/legalentities/:legalEntityId/positions", "loading positions", "positions");
  },

  getTimeOffRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : "";
    return getResource(`/v1/legalentities/:legalEntityId/timeoffrequests${suffix}`, "loading time-off requests", "timeOffRequests");
  },

  getEarningsAndDeductions(employeeId) {
    return getResource(
      `/v1/legalentities/:legalEntityId/employees/${employeeId}/earningsanddeductions`,
      "loading earnings and deductions",
      "earningsAndDeductions"
    );
  },

  getTimeCardPunches(params = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : "";
    return getResource(`/v1/legalentities/:legalEntityId/punches${suffix}`, "loading time card punches", "punches");
  },

  getEmployeeTimeCardPunches(employeeId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : "";
    return getResource(`/v1/employees/${employeeId}/punches${suffix}`, "loading employee time card punches", "punches");
  },

  getEmployeePunches(employeeId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : "";
    return getResource(`/v1/employees/${employeeId}/employeePunches${suffix}`, "loading employee punches", "punches");
  },

  getEmployeeHours(employeeId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : "";
    return getResource(`/v1/employees/${employeeId}/employeeHours${suffix}`, "loading employee hours", "hours");
  },

  getMissedPunchRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : "";
    return getResource(`/v1/legalentities/:legalEntityId/missedPunchRequests${suffix}`, "loading missed punch requests", "missedPunchRequests");
  },

  createTimeOffRequest(payload) {
    return createResource("/v1/legalentities/:legalEntityId/timeoffrequests", payload, "creating time-off request");
  }
};

export default paycorApiService;
