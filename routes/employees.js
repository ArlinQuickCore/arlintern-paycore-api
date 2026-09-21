import express from "express";
import paycorEmployeeController from "../controllers/paycorEmployeeController.js";
import powerBiAuth from "../middleware/powerBiAuth.js";

const router = express.Router();

router.use(powerBiAuth);
router.get("/", paycorEmployeeController.list);
router.get("/:id", paycorEmployeeController.getById);
router.get("/:id/earnings-and-deductions", paycorEmployeeController.earningsAndDeductions);

export default router;
