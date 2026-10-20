const express = require("express");

const app = express();

const PORT = 5000;

// Connect to MySQL database
require("./db");

// Middleware
app.use(express.json());

// Allow frontend to communicate with backend
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// Import book routes
const bookRoutes = require("./routes/bookRoutes");

// Import authentication routes
const authRoutes = require("./routes/authRoutes");

// Home route
app.get("/", (req, res) => {
    res.send("ReadMate Backend is running!");
});

// Book API routes
app.use("/api/books", bookRoutes);

// Authentication API routes
app.use("/api/auth", authRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`ReadMate Backend running on http://localhost:${PORT}`);
});