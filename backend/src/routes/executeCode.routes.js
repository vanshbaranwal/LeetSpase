import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { runCode, submitCode } from "../controllers/codeExecution.controller.js";


const executionRoute = express.Router();




executionRoute.post("/run", authMiddleware, runCode);
executionRoute.post("/submit", authMiddleware, submitCode);





export default executionRoute;
