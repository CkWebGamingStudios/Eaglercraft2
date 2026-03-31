const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const ADMIN_PASS = 'your_password_here'; // Set your admin password

// Middleware for password authentication
function authenticate(req, res, next) {
    const password = req.headers['x-admin-password'];
    if (password === ADMIN_PASS) {
        next();
    } else {
        res.status(403).send('Forbidden: Invalid Admin Password');
    }
}

// User termination endpoint
app.delete('/admin/users/:userId', authenticate, (req, res) => {
    const userId = req.params.userId;
    // Logic to terminate the user
    res.send(`User ${userId} terminated`);
});

// Post deletion endpoint
app.delete('/admin/posts/:postId', authenticate, (req, res) => {
    const postId = req.params.postId;
    // Logic to delete the post
    res.send(`Post ${postId} deleted`);
});

// Mod management endpoints
app.post('/admin/mods', authenticate, (req, res) => {
    const modData = req.body;
    // Logic to add or manage mod
    res.send(`Mod added: ${JSON.stringify(modData)}`);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Admin API running on port ${PORT}`);
});
