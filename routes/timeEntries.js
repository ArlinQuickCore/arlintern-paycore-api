import express from "express";
import paycorTimeEntryController from "../controllers/paycorTimeEntryController.js";
import powerBiAuth from "../middleware/powerBiAuth.js";

const router = express.Router();

router.use(powerBiAuth);
router.get("/punches", paycorTimeEntryController.punches);
router.get("/missed-punches", paycorTimeEntryController.missedPunches);
router.get("/employees/:id/punches", paycorTimeEntryController.employeePunches);
router.get("/employees/:id/employee-punches", paycorTimeEntryController.employeeRawPunches);
router.get("/employees/:id/hours", paycorTimeEntryController.employeeHours);

export default router;
