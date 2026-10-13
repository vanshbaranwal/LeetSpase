import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { changePassword, deleteAccount, getProfile, updateProfile } from "../controllers/profile.controller.js";

const profileRoutes = express.Router();

profileRoutes.use(authMiddleware);

profileRoutes.get("/", getProfile);
profileRoutes.patch("/", updateProfile);
profileRoutes.patch("/password", changePassword);
profileRoutes.delete("/", deleteAccount);

export default profileRoutes;
