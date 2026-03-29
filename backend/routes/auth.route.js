import express from "express";
import * as authController from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
const router = express.Router();

//public routes
router.post("/signup", authController.register);
router.post("/login", authController.login);
router.post("/reset-password", authController.requestPasswordReset);

//protected routes
router.get("/me", authMiddleware, authController.getCurrentUser);

export default router;
