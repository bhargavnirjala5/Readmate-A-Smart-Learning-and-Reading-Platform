const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

async function testDatabaseConnection() {
    try {
        const connection = await db.getConnection();

        console.log("MySQL Database Connected Successfully!");

        connection.release();
    } catch (error) {
        console.error("MySQL Connection Failed:", error.message);
    }
}

testDatabaseConnection();

module.exports = db;