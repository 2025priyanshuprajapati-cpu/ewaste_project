
const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DATABASE() AS db"
        );

        res.json({
            success: true,
            message: "MySQL connected successfully",
            database: rows[0].db
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(
        `Server running at http://localhost:${process.env.PORT || 3000}`
    );
});
