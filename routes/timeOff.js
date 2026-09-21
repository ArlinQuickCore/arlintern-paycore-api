import express from "express";
import paycorTimeOffController from "../controllers/paycorTimeOffController.js";
import powerBiAuth from "../middleware/powerBiAuth.js";

const router = express.Router();

router.use(powerBiAuth);
router.get("/", paycorTimeOffController.list);
router.post("/", paycorTimeOffController.create);

export default router;
