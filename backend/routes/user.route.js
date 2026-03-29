import express from "express";
import * as userController from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.put("/preferences", userController.updatePreferences);
router.put("/change-password", userController.changePassword);
router.delete("delete-account", userController.deleteAccount);

export default router;
