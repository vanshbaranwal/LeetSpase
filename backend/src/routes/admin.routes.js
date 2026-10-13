import express from "express";
import {
    getAdminOverview,
    getAdminSubmissions,
    getAdminUsers,
    getSystemStatus,
    updateUserRole,
    updateUserStatus,
} from "../controllers/admin.controller.js";
import { authMiddleware, checkAdmin } from "../middleware/auth.middleware.js";

const adminRoutes = express.Router();

adminRoutes.use(authMiddleware, checkAdmin);

adminRoutes.get("/overview", getAdminOverview);
adminRoutes.get("/users", getAdminUsers);
adminRoutes.patch("/users/:userId/role", updateUserRole);
adminRoutes.patch("/users/:userId/status", updateUserStatus);
adminRoutes.get("/submissions", getAdminSubmissions);
adminRoutes.get("/system-status", getSystemStatus);

export default adminRoutes;
