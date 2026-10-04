import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import paycorAuthController from "./controllers/paycorAuthController.js";
import employeeRoutes from "./routes/employees.js";
import departmentRoutes from "./routes/departments.js";
import positionRoutes from "./routes/positions.js";
import timeOffRoutes from "./routes/timeOff.js";
import timeEntryRoutes from "./routes/timeEntries.js";

dotenv.config();

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
  res.json({
    status: "OK",
    message: "Paycor OAuth API running"
  });
});

const port = process.env.PORT || 3000;
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (!process.env.VERCEL && isDirectRun) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;
