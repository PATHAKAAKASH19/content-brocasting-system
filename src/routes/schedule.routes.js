import express from "express";
import {
  getActiveContent,
  getSchedulePreview,
  getAllActiveContent,
  getRotationStatus,
  getFullSubjectSchedule,
} from "../controllers/schedule.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { restrictTo } from "../middlewares/role.middleware.js";

const router = express.Router();


router.use(protect);


router.get("/active/:subject", getActiveContent);
router.get("/preview/:subject", getSchedulePreview);
router.get("/all-active", getAllActiveContent);
router.get("/full/:subject", getFullSubjectSchedule);
router.get("/status", restrictTo("principal"), getRotationStatus);

export default router;
