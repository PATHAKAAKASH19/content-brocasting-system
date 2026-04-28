 import express from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { restrictTo } from "../middlewares/role.middleware.js";

const router = express.Router();


router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);


router.get("/admin-only", protect, restrictTo("principal"), (req, res) => {
  res.json({
    success: true,
    message: "Welcome principal! This is admin area.",
    user: req.user,
  });
});

router.get("/teacher-only", protect, restrictTo("teacher"), (req, res) => {
  res.json({
    success: true,
    message: "Welcome teacher! This is teacher area.",
    user: req.user,
  });
});

export default router;
