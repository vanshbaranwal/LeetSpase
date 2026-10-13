import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import { db } from "../libs/db.js";
import { UserRole } from "../generated/prisma/index.js";

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authCookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
};

const setAuthCookie = (res, userId) => {
    const token = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("jwt", token, authCookieOptions);
};

const createUniqueUsername = async (name, email) => {
    const rawValue = name?.trim() || email.split("@")[0] || "coder";
    const base = rawValue
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 24) || "coder";

    let username = base;
    let suffix = 1;

    while (await db.user.findUnique({ where: { username } })) {
        username = `${base}${suffix}`;
        suffix += 1;
    }

    return username;
};

const toSafeUser = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
    username: user.username,
    isVerified: user.isVerified,
    status: user.status,
});


export const register = async(req, res) => {
    const { email, password, name } = req.body;

    try {
        const existingUser = await db.user.findUnique({
            where : {
                email
            }
        });

        if(existingUser){
            return res.status(400).json({
                error: "user already exists",
            });
        };

        const hashedPassword = await bcrypt.hash(password, 10);
        const username = await createUniqueUsername(name, email);

        const newUser = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                username,
                role: UserRole.USER,
            }
        });

        setAuthCookie(res, newUser.id);

        res.status(201).json({
            success: true,
            message: "user created successfully",
            user: toSafeUser(newUser),
        });

    } catch (error) {
        console.error("error creating user : ", error);
        res.status(500).json({
            error: "error creating user",
        });
    }

};

export const login = async(req, res) => {
    const { email, password } = req.body;

    try {
        
        const user = await db.user.findUnique({
            where: {
                email,
            }
        });

        if(!user || !user.password){
            return res.status(401).json({
                error: "invalid credentials",
            });
        };

        if(user.status === "SUSPENDED"){
            return res.status(403).json({
                error: "your account has been suspended",
            });
        };

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(401).json({
                error: "invalid credentials",
            });
        };

        const activeUser = await db.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() },
        });

        setAuthCookie(res, activeUser.id);

        res.status(200).json({
            success: true,
            message: "user loggedIn successfully",
            user: toSafeUser(activeUser),
        });

    } catch (error) {
        console.error("error loggingIn user : ", error);
        res.status(500).json({
            error: "error loggingIn user",
        });
    }
}; 

export const googleLogin = async(req, res) => {
    const { credential } = req.body;

    if(!process.env.GOOGLE_CLIENT_ID){
        return res.status(503).json({
            error: "Google login is not configured",
        });
    }

    if(!credential){
        return res.status(400).json({
            error: "Google credential is required",
        });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if(!payload?.sub || !payload?.email || !payload.email_verified){
            return res.status(401).json({
                error: "Google account could not be verified",
            });
        }

        const googleId = payload.sub;
        const email = payload.email.toLowerCase();

        let user = await db.user.findUnique({
            where: {
                googleId,
            },
        });

        if(!user){
            const existingEmailUser = await db.user.findFirst({
                where: {
                    email: {
                        equals: email,
                        mode: "insensitive",
                    },
                },
            });

            if(existingEmailUser?.googleId && existingEmailUser.googleId !== googleId){
                return res.status(409).json({
                    error: "This email is already linked to another Google account",
                });
            }

            if(existingEmailUser){
                user = await db.user.update({
                    where: {
                        id: existingEmailUser.id,
                    },
                    data: {
                        googleId,
                        name: existingEmailUser.name || payload.name,
                        image: existingEmailUser.image || payload.picture,
                        isVerified: true,
                        lastActiveAt: new Date(),
                    },
                });
            } else {
                const username = await createUniqueUsername(payload.name, email);

                user = await db.user.create({
                    data: {
                        googleId,
                        email,
                        name: payload.name,
                        username,
                        image: payload.picture,
                        role: UserRole.USER,
                        isVerified: true,
                    },
                });
            }
        } else {
            user = await db.user.update({
                where: { id: user.id },
                data: {
                    isVerified: true,
                    lastActiveAt: new Date(),
                    image: user.image || payload.picture,
                },
            });
        }

        if(user.status === "SUSPENDED"){
            return res.status(403).json({
                error: "your account has been suspended",
            });
        }

        setAuthCookie(res, user.id);

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            user: toSafeUser(user),
        });
    } catch (error) {
        console.error("error logging in with Google: ", error);

        return res.status(401).json({
            error: "Google authentication failed",
        });
    }
};

export const logout = async(req, res) => {
    try {
        
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({
            success: true,
            message: "user logged Out successfully",
        });

    } catch (error) {
        console.error("error logging Out user : ", error);
        res.status(500).json({
            error: "error logging out user",
        });
    }
};

export const check = async(req, res) => {
    try {
        
        res.status(200).json({
            success: true,
            message: "user authenticated successfully",
            user: req.user,
        });

    } catch (error) {
        console.error("error checking user: ", error); // typo fixed
        res.status(500).json({
            error: "error checking user",
        });
    }
};
