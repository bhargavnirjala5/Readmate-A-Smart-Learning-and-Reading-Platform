require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();
const db = require("../db");
const authMiddleware = require("../authMiddleware");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

// Generate Readmate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );
}

// ==================== SIGNUP API ====================
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        return res.status(201).json({
            message: "Account created successfully.",
            userId: result.insertId
        });

    } catch (error) {
        console.error("Signup Error:", error);

        return res.status(500).json({
            message: "Server error. Please try again."
        });
    }
});

// ==================== EMAIL/PASSWORD LOGIN API ====================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Authentication is not configured correctly."
            });
        }

        const [users] = await db.execute(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            [email.trim()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            message: "Server error. Please try again."
        });
    }
});

// ==================== GOOGLE LOGIN API ====================
router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                message: "Google credential is required."
            });
        }

        if (
            !process.env.GOOGLE_CLIENT_ID ||
            !process.env.JWT_SECRET
        ) {
            return res.status(500).json({
                message: "Google authentication is not configured."
            });
        }

        // Verify the Google credential on the backend
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            !payload.email_verified
        ) {
            return res.status(401).json({
                message: "Unable to verify your Google account."
            });
        }

        const email = payload.email.trim().toLowerCase();
        const name = payload.name || email.split("@")[0];

        // Find an existing Readmate account
        const [users] = await db.execute(
            "SELECT id, name, email FROM users WHERE email = ?",
            [email]
        );

        let user;

        if (users.length > 0) {
            // Sign in to the existing account
            user = users[0];
        } else {
            // Create a new account with a random, unusable password
            const randomPassword = require("crypto")
                .randomBytes(32)
                .toString("hex");

            const hashedPassword = await bcrypt.hash(
                randomPassword,
                10
            );

            const [result] = await db.execute(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword]
            );

            user = {
                id: result.insertId,
                name,
                email
            };
        }

        // Issue a Readmate JWT after Google verification
        const token = generateToken(user);

        return res.status(200).json({
            message: "Google login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(
            "Google Login Error:",
            error.message
        );

        return res.status(401).json({
            message: "Google login failed. Please try again."
        });
    }
});

// ==================== PROTECTED PROFILE API ====================
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [users] = await db.execute(
            "SELECT id, name, email FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "Profile retrieved successfully.",
            user: users[0]
        });

    } catch (error) {
        console.error("Profile Error:", error);

        return res.status(500).json({
            message: "Server error. Please try again."
        });
    }
});

module.exports = router;