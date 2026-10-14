import axios from "axios";
import { db } from "../libs/db.js";

const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

const getActiveSince = () => new Date(Date.now() - ACTIVE_WINDOW_MS);

export const getAdminOverview = async (req, res) => {
    try {
        const activeSince = getActiveSince();

        const [users, problems, submissions, activeUsers, acceptedSubmissions] = await Promise.all([
            db.user.count(),
            db.problem.count(),
            db.submission.count(),
            db.user.count({
                where: {
                    status: "ACTIVE",
                    lastActiveAt: { gte: activeSince },
                },
            }),
            db.submission.count({
                where: {
                    status: { equals: "Accepted", mode: "insensitive" },
                },
            }),
        ]);

        return res.status(200).json({
            success: true,
            overview: {
                users,
                problems,
                submissions,
                activeUsers,
                acceptedSubmissions,
            },
        });
    } catch (error) {
        console.error("error fetching admin overview: ", error);
        return res.status(500).json({
            success: false,
            error: "failed to fetch admin overview",
        });
    }
};

export const getAdminUsers = async (req, res) => {
    try {
        const users = await db.user.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
                role: true,
                status: true,
                isVerified: true,
                lastActiveAt: true,
                createdAt: true,
                _count: {
                    select: {
                        problemSolved: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            users: users.map(({ _count, ...user }) => ({
                ...user,
                solvedProblems: _count.problemSolved,
                isOnline: user.status === "ACTIVE" && user.lastActiveAt >= getActiveSince(),
            })),
        });
    } catch (error) {
        console.error("error fetching admin users: ", error);
        return res.status(500).json({
            success: false,
            error: "failed to fetch users",
        });
    }
};

export const updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if(!["ADMIN", "USER"].includes(role)){
        return res.status(400).json({
            success: false,
            error: "role must be ADMIN or USER",
        });
    }

    if(userId === req.user.id && role !== "ADMIN"){
        return res.status(400).json({
            success: false,
            error: "you cannot remove your own admin access",
        });
    }

    try {
        const existingUser = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
            },
        });

        if(!existingUser){
            return res.status(404).json({
                success: false,
                error: "user not found",
            });
        }

        if(existingUser.role === "ADMIN" && role === "USER"){
            const adminCount = await db.user.count({
                where: { role: "ADMIN" },
            });

            if(adminCount <= 1){
                return res.status(400).json({
                    success: false,
                    error: "the last admin cannot be removed",
                });
            }
        }

        const user = await db.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                role: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "user role updated successfully",
            user,
        });
    } catch (error) {
        console.error("error updating user role: ", error);
        return res.status(500).json({
            success: false,
            error: "failed to update user role",
        });
    }
};

export const updateUserStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if(!["ACTIVE", "SUSPENDED"].includes(status)){
        return res.status(400).json({
            success: false,
            error: "status must be ACTIVE or SUSPENDED",
        });
    }

    if(userId === req.user.id && status === "SUSPENDED"){
        return res.status(400).json({
            success: false,
            error: "you cannot suspend your own account",
        });
    }

    try {
        const user = await db.user.update({
            where: { id: userId },
            data: { status },
            select: {
                id: true,
                status: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "user status updated successfully",
            user,
        });
    } catch (error) {
        console.error("error updating user status: ", error);
        return res.status(500).json({
            success: false,
            error: "failed to update user status",
        });
    }
};

export const getAdminSubmissions = async (req, res) => {
    try {
        const submissions = await db.submission.findMany({
            select: {
                id: true,
                language: true,
                status: true,
                time: true,
                memory: true,
                createdAt: true,
                sourceCode: true,
                stderr: true,
                compileOutput: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        image: true,
                    },
                },
                problem: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 250,
        });

        return res.status(200).json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("error fetching admin submissions: ", error);
        return res.status(500).json({
            success: false,
            error: "failed to fetch submissions",
        });
    }
};

export const getSystemStatus = async (req, res) => {
    const startedAt = Date.now();
    let database = {
        status: "offline",
        responseTime: null,
    };
    let codebox = {
        status: "offline",
        responseTime: null,
    };

    try {
        const databaseStartedAt = Date.now();
        await db.$queryRaw`SELECT 1`;
        database = {
            status: "operational",
            responseTime: Date.now() - databaseStartedAt,
        };
    } catch (error) {
        console.error("database health check failed: ", error.message);
    }

    if(process.env.JUDGE0_API_URL){
        try {
            const codeboxStartedAt = Date.now();
            const response = await axios.get(`${process.env.JUDGE0_API_URL}/health`, {
                headers: {
                    "X-Auth-Token": process.env.JUDGE0_API_KEY,
                },
                timeout: 4000,
            });

            codebox = {
                status: response.data?.status === "healthy" ? "operational" : "degraded",
                responseTime: Date.now() - codeboxStartedAt,
            };
        } catch (error) {
            console.error("CodeBox health check failed: ", error.message);
        }
    }

    try {
        const activeUsers = await db.user.count({
            where: {
                status: "ACTIVE",
                lastActiveAt: { gte: getActiveSince() },
            },
        });
        const memoryUsage = process.memoryUsage();

        return res.status(200).json({
            success: true,
            system: {
                server: {
                    status: "operational",
                    uptime: Math.floor(process.uptime()),
                    responseTime: Date.now() - startedAt,
                    nodeVersion: process.version,
                    memoryUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    memoryTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                },
                database,
                codebox,
                activeUsers,
                activeWindowMinutes: ACTIVE_WINDOW_MS / 60_000,
                checkedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("error fetching system status: ", error);
        return res.status(500).json({
            success: false,
            error: "failed to fetch system status",
        });
    }
};
