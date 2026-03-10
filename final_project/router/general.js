const express = require('express');
const axios = require('axios');             // Added for async-await API calls
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Register a new user
public_users.post("/register", (req,res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return res.status(409).json({ message: "Username already exists" });
    }

    users.push({ username: username, password: password });
    return res.status(201).json({ message: "User registered successfully" });
});

// Get the list of books using async-await with Axios
public_users.get('/books', async (req, res) => {
    try {
        // Example: fetching from a remote API (replace URL if needed)
        const response = await axios.get('https://alihassan073-5000.theianext-1-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai/booksdb');
        return res.send(JSON.stringify(response.data, null, 4));
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch books", error: error.message });
    }
});

// Get the book list available in the shop (local books object)
public_users.get('/', function (req, res) {
    return res.send(JSON.stringify(books, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
    const isbn = req.params.isbn;

    try {
        const getBookByISBN = (isbn) => {
            return new Promise((resolve, reject) => {
                const book = books[isbn];
                if (book) resolve(book);
                else reject("Book not found");
            });
        };

        const book = await getBookByISBN(isbn);
        res.status(200).send(JSON.stringify(book, null, 4));
    } catch (error) {
        res.status(404).json({ message: error });
    }
});
  
// Get book details based on author
public_users.get('/author/:author', async (req, res) => {
    const authorName = req.params.author;

    try {
        // Wrap the local books object in a Promise
        const getBooksByAuthor = (author) => {
            return new Promise((resolve, reject) => {
                const allBooks = Object.keys(books);
                const matchedBooks = [];

                allBooks.forEach((isbn) => {
                    if (books[isbn].author.toLowerCase() === author.toLowerCase()) {
                        matchedBooks.push({ [isbn]: books[isbn] });
                    }
                });

                if (matchedBooks.length > 0) resolve(matchedBooks);
                else reject("No books found by this author");
            });
        };

        const matchedBooks = await getBooksByAuthor(authorName);
        res.status(200).send(JSON.stringify(matchedBooks, null, 4));
    } catch (error) {
        res.status(404).json({ message: error });
    }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
    const titleName = req.params.title;
    const allBooks = Object.keys(books);
    const matchedBooks = [];

    allBooks.forEach((isbn) => {
        if (books[isbn].title.toLowerCase() === titleName.toLowerCase()) {
            matchedBooks.push({ [isbn]: books[isbn] });
        }
    });

    if (matchedBooks.length > 0) {
        return res.send(JSON.stringify(matchedBooks, null, 4));
    } else {
        return res.status(404).json({ message: "No books found with this title" });
    }
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (book) {
        return res.send(JSON.stringify(book.reviews, null, 4));
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

module.exports.general = public_users;