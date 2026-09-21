import express from "express";
import paycorDepartmentController from "../controllers/paycorDepartmentController.js";
import powerBiAuth from "../middleware/powerBiAuth.js";

const router = express.Router();

router.use(powerBiAuth);
router.get("/", paycorDepartmentController.list);

export default router;
