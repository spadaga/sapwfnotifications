// This file NO LONGER loads dotenv. It just reads from process.env.
// The loading is now handled exclusively at the start of src/api/server.js.

// Sanitize NODE_ENV to prevent issues with trailing spaces
const nodeEnv = (process.env.NODE_ENV || 'development').trim();

export const isProduction = nodeEnv === 'production';
export const port = process.env.PORT || 3000;
export const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;
export const sapApiUrl = 'https://c6674ca9trial.authentication.ap21.hana.ondemand.com';
export const sapClientId = process.env.SAP_CLIENT_ID;
export const sapClientSecret = process.env.SAP_CLIENT_SECRET;
export const appUrl = process.env.APP_URL;
export const inboxUrl = process.env.INBOX_URL;