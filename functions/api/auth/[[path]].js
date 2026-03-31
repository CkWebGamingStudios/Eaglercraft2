'use strict';

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const User = require('../../models/User'); // Adjust the path as needed

const router = express.Router();

// Passport configuration
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({ googleId: profile.id }).then((existingUser) => {
        if (existingUser) {
            done(null, existingUser);
        } else {
            new User({
                googleId: profile.id,
                username: profile.displayName,
                thumbnail: profile._json.picture
            }).save().then((user) => done(null, user));
        }
    });
}));

passport.use(new GitHubStrategy({
    clientID: 'YOUR_GITHUB_CLIENT_ID',
    clientSecret: 'YOUR_GITHUB_CLIENT_SECRET',
    callbackURL: '/auth/github/callback'
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({ githubId: profile.id }).then((existingUser) => {
        if (existingUser) {
            done(null, existingUser);
        } else {
            new User({
                githubId: profile.id,
                username: profile.username,
                thumbnail: profile._json.avatar_url
            }).save().then((user) => done(null, user));
        }
    });
}));

// Session expiration middleware
const sessionExpireMiddleware = (req, res, next) => {
    if (req.isAuthenticated() && req.session) {
        const now = new Date();
        const sessionCreatedAt = req.session.createdAt;
        const sessionExpirationTime = 24 * 60 * 60 * 1000; // 24 hours
        if (now - sessionCreatedAt > sessionExpirationTime) {
            req.logout();
            return res.status(401).send('Session expired.');
        }
    }
    next();
};

router.use(sessionExpireMiddleware);

// Users endpoint
router.get('/users', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(req.user);
    } else {
        res.status(401).send('Unauthorized');
    }
});

module.exports = router;
