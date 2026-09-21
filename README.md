# Paycor OAuth Node

Node.js + Express integration with the Paycor API, built for feeding Power BI
reports. It goes further than a typical "hello world" OAuth guide (like
[Rollout's Paycor auth flow walkthrough](https://rollout.com/integration-guides/paycor/how-to-build-a-public-paycor-integration-building-the-auth-flow))
by adding:

- **CSRF-protected `state`** — a random, single-use state token is generated
  per login and verified on callback (the basic guide skips this).
- **Automatic token refresh with rotation** — 401 responses trigger a
  refresh-and-retry; invalid/expired refresh tokens clear stored state so the
  app fails safely instead of looping.
- **429 back-off** — rate-limited requests retry with the `Retry-After` value.
- **Subscription-key aware requests** — every API call sends the
  `Ocp-Apim-Subscription-Key` header Paycor's API gateway requires.
- **Power BI-ready REST endpoints** — `/api/employees`, `/api/departments`,
  `/api/positions`, `/api/time-off`, guarded by a shared-secret
  `powerBiAuth` middleware so Power BI's Web connector can pull data securely.
- **Serverless-ready** — `api/index.js` + `vercel.json` for a zero-config
  Vercel deployment, mirroring `server.js` for local/dev use.

## Setup

1. Register your app in the [Paycor Developer Portal](https://developers.paycor.com/)
   and note the client ID, client secret, subscription key, and redirect URI.
2. Copy `.env.example` to `.env` and fill in the values. Confirm the exact
   `PAYCOR_AUTH_BASE_URL` / `PAYCOR_API_BASE_URL` hosts for your app in the
   developer portal docs — sandbox and production hosts differ per tenant.
3. Install dependencies and run:

   ```powershell
   npm install
   npm run dev
   ```

4. Visit `http://localhost:3000/oauth/login` to start the OAuth flow. After
   consent, Paycor redirects to `/oauth/callback` with a `code` and `state`;
   tokens are exchanged and persisted to `data/paycor_tokens.json` (or
   `PAYCOR_*` environment variables when deployed on Vercel).
5. Set `PAYCOR_LEGAL_ENTITY_ID` once you know which legal entity to query, or
   pass `legalEntityId` on the OAuth callback URL.

## Power BI usage

In Power BI Desktop, use **Get Data → Web**, point it at e.g.
`https://your-host/api/employees`, and add an `Authorization: Bearer <POWERBI_API_KEY>`
header. Schedule a refresh in the Power BI service once published.

## Testing

```powershell
npm test
```
