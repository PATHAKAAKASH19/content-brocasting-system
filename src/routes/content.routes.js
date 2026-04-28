import express from "express";
import {
  uploadContent,
  getTeacherContent,
  getAllContent,
  getContentById,
  deleteContent,
  approveContent,
  rejectContent, 
  getPendingContent, 
  getContentStats, 
} from "../controllers/content.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { restrictTo } from "../middlewares/role.middleware.js";
import {
  uploadSingle,
  handleUploadError,
  validateContentFields,
} from "../middlewares/upload.middleware.js";

const router = express.Router();


router.use(protect);

router.post(
  "/upload",
  restrictTo("teacher"),
  uploadSingle,
  handleUploadError,
  validateContentFields,
  uploadContent,
);
router.get("/teacher", restrictTo("teacher"), getTeacherContent);

router.get("/all", restrictTo("principal"), getAllContent);
router.get("/pending", restrictTo("principal"), getPendingContent);
router.get("/stats", restrictTo("principal"), getContentStats);
router.post("/:id/approve", restrictTo("principal"), approveContent);
router.post("/:id/reject", restrictTo("principal"), rejectContent);

router.get("/:id", getContentById);
router.delete("/:id", restrictTo("teacher"), deleteContent);

export default router;
