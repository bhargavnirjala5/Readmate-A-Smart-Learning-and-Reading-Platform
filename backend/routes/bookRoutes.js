const express = require("express");

const router = express.Router();

// Import books data
const books = require("../data/books");

// GET all books
router.get("/", (req, res) => {
    res.json(books);
});

module.exports = router;