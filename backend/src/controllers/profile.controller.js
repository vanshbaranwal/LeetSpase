import bcrypt from "bcryptjs";
import { db } from "../libs/db.js";

const PROFILE_LANGUAGES = ["PYTHON", "JAVA", "JAVASCRIPT"];

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);

const calculateStreaks = (dates) => {
    const uniqueDays = [...new Set(dates.map(dateKey))].sort();

    if(!uniqueDays.length){
        return { current: 0, longest: 0 };
    }

    let longest = 1;
    let running = 1;

    for(let index = 1; index < uniqueDays.length; index += 1){
        const previous = new Date(`${uniqueDays[index - 1]}T00:00:00.000Z`);
        const current = new Date(`${uniqueDays[index]}T00:00:00.000Z`);
        const difference = Math.round((current - previous) / 86_400_000);

        running = difference === 1 ? running + 1 : 1;
        longest = Math.max(longest, running);
    }

    const today = new Date();
    const todayKey = dateKey(today);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayKey = dateKey(yesterday);
    const mostRecent = uniqueDays.at(-1);

    if(mostRecent !== todayKey && mostRecent !== yesterdayKey){
        return { current: 0, longest };
    }

    let current = 1;
    for(let index = uniqueDays.length - 1; index > 0; index -= 1){
        const day = new Date(`${uniqueDays[index]}T00:00:00.000Z`);
        const previous = new Date(`${uniqueDays[index - 1]}T00:00:00.000Z`);

        if(Math.round((day - previous) / 86_400_000) !== 1) break;
        current += 1;
    }

    return { current, longest };
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const activityStart = new Date();
        activityStart.setUTCDate(activityStart.getUTCDate() - 364);
        activityStart.setUTCHours(0, 0, 0, 0);

        const [user, problemTotals, solvedRecords, totalSubmissions, acceptedSubmissions, recentSubmissions, activitySubmissions, playlists] = await Promise.all([
            db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    bio: true,
                    preferredLanguage: true,
                    email: true,
                    image: true,
                    role: true,
                    status: true,
                    isVerified: true,
                    googleId: true,
                    password: true,
                    createdAt: true,
                },
            }),
            db.problem.groupBy({
                by: ["difficulty"],
                _count: { _all: true },
            }),
            db.problemSolved.findMany({
                where: { userId },
                select: {
                    problemId: true,
                    createdAt: true,
                    problem: {
                        select: {
                            difficulty: true,
                            tags: true,
                        },
                    },
                },
            }),
            db.submission.count({ where: { userId } }),
            db.submission.count({
                where: {
                    userId,
                    status: { equals: "accepted", mode: "insensitive" },
                },
            }),
            db.submission.findMany({
                where: { userId },
                select: {
                    id: true,
                    problemId: true,
                    language: true,
                    status: true,
                    time: true,
                    memory: true,
                    createdAt: true,
                    problem: {
                        select: {
                            id: true,
                            title: true,
                            difficulty: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 12,
            }),
            db.submission.findMany({
                where: {
                    userId,
                    createdAt: { gte: activityStart },
                },
                select: { createdAt: true },
                orderBy: { createdAt: "asc" },
            }),
            db.playlist.findMany({
                where: { userId },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    createdAt: true,
                    problems: {
                        select: {
                            problemId: true,
                            problem: {
                                select: {
                                    id: true,
                                    title: true,
                                    difficulty: true,
                                    tags: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { updatedAt: "desc" },
            }),
        ]);

        if(!user){
            return res.status(404).json({
                success: false,
                error: "user profile not found",
            });
        }

        const totalByDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 };
        problemTotals.forEach((item) => {
            totalByDifficulty[item.difficulty] = item._count._all;
        });

        const solvedByDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 };
        const tagCounts = new Map();
        const solvedProblemIds = new Set();

        solvedRecords.forEach((record) => {
            solvedProblemIds.add(record.problemId);
            solvedByDifficulty[record.problem.difficulty] += 1;
            record.problem.tags.forEach((tag) => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });

        const topTags = [...tagCounts.entries()]
            .sort((first, second) => second[1] - first[1])
            .slice(0, 8)
            .map(([name, count]) => ({ name, count }));

        const activityMap = new Map();
        activitySubmissions.forEach(({ createdAt }) => {
            const day = dateKey(createdAt);
            activityMap.set(day, (activityMap.get(day) || 0) + 1);
        });

        const activity = [...activityMap.entries()].map(([date, count]) => ({ date, count }));
        const streaks = calculateStreaks(activitySubmissions.map(({ createdAt }) => createdAt));

        const profilePlaylists = playlists.map(({ problems, ...playlist }) => ({
            ...playlist,
            problemCount: problems.length,
            solvedCount: problems.filter(({ problemId }) => solvedProblemIds.has(problemId)).length,
            problems: problems.map(({ problem }) => ({
                ...problem,
                isSolved: solvedProblemIds.has(problem.id),
            })),
        }));

        const { googleId, password, ...safeUser } = user;

        return res.status(200).json({
            success: true,
            profile: {
                ...safeUser,
                provider: googleId ? "GOOGLE" : "PASSWORD",
                canChangePassword: Boolean(password),
            },
            stats: {
                totalSolved: solvedRecords.length,
                totalSubmissions,
                acceptedSubmissions,
                acceptanceRate: totalSubmissions ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
                currentStreak: streaks.current,
                longestStreak: streaks.longest,
            },
            progress: {
                solved: solvedByDifficulty,
                total: totalByDifficulty,
            },
            topTags,
            recentSubmissions,
            activity,
            playlists: profilePlaylists,
        });
    } catch (error) {
        console.error("error fetching user profile: ", error);
        return res.status(500).json({
            success: false,
            error: "failed to fetch user profile",
        });
    }
};

export const updateProfile = async (req, res) => {
    const { name, username, bio, preferredLanguage, image } = req.body;

    if(typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50){
        return res.status(400).json({ success: false, error: "name must be between 2 and 50 characters" });
    }

    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    if(!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)){
        return res.status(400).json({ success: false, error: "username must be 3-24 characters using letters, numbers, or underscores" });
    }

    if(bio !== undefined && (typeof bio !== "string" || bio.trim().length > 160)){
        return res.status(400).json({ success: false, error: "bio must be 160 characters or fewer" });
    }

    if(preferredLanguage && !PROFILE_LANGUAGES.includes(preferredLanguage)){
        return res.status(400).json({ success: false, error: "preferred language is not supported" });
    }

    if(image && (typeof image !== "string" || image.length > 500 || !/^https?:\/\//i.test(image))){
        return res.status(400).json({ success: false, error: "profile image must be a valid URL" });
    }

    try {
        const user = await db.user.update({
            where: { id: req.user.id },
            data: {
                name: name.trim(),
                username: normalizedUsername,
                bio: bio?.trim() || null,
                preferredLanguage: preferredLanguage || null,
                image: image?.trim() || null,
            },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                preferredLanguage: true,
                email: true,
                image: true,
                role: true,
                status: true,
                isVerified: true,
                createdAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "profile updated successfully",
            user,
        });
    } catch (error) {
        console.error("error updating user profile: ", error);

        if(error.code === "P2002"){
            return res.status(409).json({
                success: false,
                error: "this username is already taken",
            });
        }

        return res.status(500).json({
            success: false,
            error: "failed to update profile",
        });
    }
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if(typeof newPassword !== "string" || newPassword.length < 6){
        return res.status(400).json({ success: false, error: "new password must be at least 6 characters" });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: { password: true },
        });

        if(!user?.password){
            return res.status(400).json({ success: false, error: "this account uses Google sign-in" });
        }

        const passwordMatches = await bcrypt.compare(currentPassword || "", user.password);
        if(!passwordMatches){
            return res.status(401).json({ success: false, error: "current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword },
        });

        return res.status(200).json({
            success: true,
            message: "password changed successfully",
        });
    } catch (error) {
        console.error("error changing password: ", error);
        return res.status(500).json({ success: false, error: "failed to change password" });
    }
};

export const deleteAccount = async (req, res) => {
    const { confirmation, password } = req.body;

    if(confirmation !== "DELETE"){
        return res.status(400).json({ success: false, error: "type DELETE to confirm account deletion" });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: {
                password: true,
                role: true,
            },
        });

        if(user?.role === "ADMIN"){
            return res.status(403).json({
                success: false,
                error: "admin accounts cannot be deleted from profile settings",
            });
        }

        if(user?.password){
            const passwordMatches = await bcrypt.compare(password || "", user.password);
            if(!passwordMatches){
                return res.status(401).json({ success: false, error: "password is incorrect" });
            }
        }

        await db.user.delete({ where: { id: req.user.id } });
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        return res.status(200).json({
            success: true,
            message: "account deleted successfully",
        });
    } catch (error) {
        console.error("error deleting account: ", error);
        return res.status(500).json({ success: false, error: "failed to delete account" });
    }
};
