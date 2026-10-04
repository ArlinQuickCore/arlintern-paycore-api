import express from "express";
import serverless from "serverless-http";
import paycorAuthController from "../controllers/paycorAuthController.js";

import employeeRoutes from "../routes/employees.js";
import departmentRoutes from "../routes/departments.js";
import positionRoutes from "../routes/positions.js";
import timeOffRoutes from "../routes/timeOff.js";
import timeEntryRoutes from "../routes/timeEntries.js";

const app = express();
app.use(express.json());

app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/time-off", timeOffRoutes);
app.use("/api/time-entries", timeEntryRoutes);

app.get("/oauth/login", paycorAuthController.login);
app.get("/oauth/callback", paycorAuthController.handleCallback);
app.get("/oauth/tokens", paycorAuthController.getStoredTokens);
app.get("/api/oauth/login", paycorAuthController.login);
app.get("/api/oauth/callback", paycorAuthController.handleCallback);
app.get("/api/oauth/tokens", paycorAuthController.getStoredTokens);

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Paycor OAuth API running" });
});

export const handler = serverless(app);
export default app;
