import express from "express";
import paycorPositionController from "../controllers/paycorPositionController.js";
import powerBiAuth from "../middleware/powerBiAuth.js";

const router = express.Router();

router.use(powerBiAuth);
router.get("/", paycorPositionController.list);

export default router;
