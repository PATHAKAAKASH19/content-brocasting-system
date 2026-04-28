import express from "express";
import {
  getLiveContent,
  getLiveContentBySubject,
  getAllTeachers,
  getTeacherSubjects,
} from "../controllers/broadcast.controller.js";

const router = express.Router();

router.get("/live/:teacherId", getLiveContent);
router.get("/subject/:subject", getLiveContentBySubject);
router.get("/teachers", getAllTeachers);
router.get("/teacher/:teacherId/subjects", getTeacherSubjects);

export default router;
