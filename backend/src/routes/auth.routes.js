import express from "express";
import { check, googleLogin, login, logout, register } from "../controllers/auth.controllers.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const authRoutes = express.Router();


authRoutes.post("/register", register);

authRoutes.post("/login", login);

authRoutes.post("/google", googleLogin);

authRoutes.post("/logout", authMiddleware, logout);

authRoutes.get("/check", authMiddleware, check);



export default authRoutes;
