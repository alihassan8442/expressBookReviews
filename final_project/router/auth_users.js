const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ 
     return users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{ 
    return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
   const { username, password } = req.body;

    // Check if username & password provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if user exists and password matches
    if (authenticatedUser(username, password)) {
        // Create JWT token
        const accessToken = jwt.sign({ username: username }, "access", { expiresIn: "1h" });

        // Save token in session
        if (!req.session) req.session = {};
        req.session.authorization = {
            accessToken
        };

        return res.status(200).json({ message: "User logged in successfully", accessToken });
    } else {
        return res.status(401).json({ message: "Invalid username or password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
 const isbn = req.params.isbn;           // Get ISBN from URL
    const review = req.query.review;        // Get review text from query

    if (!review) {
        return res.status(400).json({ message: "Please provide a review as a query parameter" });
    }

    if (!req.session || !req.session.authorization) {
        return res.status(403).json({ message: "User not logged in" });
    }

    let username;
    try {
        const token = req.session.authorization.accessToken;
        const decoded = jwt.verify(token, "access");
        username = decoded.username;
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!books[isbn].reviews) books[isbn].reviews = {};

    books[isbn].reviews[username] = review;

    return res.status(200).json({
        message: `Review for ISBN ${isbn} by user ${username} added/updated successfully.`,
        reviews: books[isbn].reviews
    });
});
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;

    // Check if user is logged in
    if (!req.session || !req.session.authorization) {
        return res.status(403).json({ message: "User not logged in" });
    }

    // Get username from JWT token
    let username;
    try {
        const token = req.session.authorization.accessToken;
        const decoded = jwt.verify(token, "access");
        username = decoded.username;
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }

    // Check if book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Check if the user has a review to delete
    if (!books[isbn].reviews || !books[isbn].reviews[username]) {
        return res.status(404).json({ message: "No review by this user to delete" });
    }

    // Delete the review
    delete books[isbn].reviews[username];

    return res.status(200).json({
        message: `Review for ISBN ${isbn} by user ${username} deleted successfully.`,
        reviews: books[isbn].reviews
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
