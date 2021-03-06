var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var UserModel    = require('../app/models/user');
var session = require('client-sessions');
var utils = require('../utilities.js');

// initial entry point for all requests
router.use(function(req, res, next) {
    console.log(req.method + " /login");
    console.log(req.body);
    next();
});

router.post('/', function(req, res, next) {
    // check if user is already logged in, if so do nothing
    if (typeof(req.body.username) == 'string')
        req.body.username = req.body.username.toLowerCase();
    if (req.session.user == req.body.username) {
        res.json({message: "Already logged in", user: req.session.user, name: req.session.name});
        return;
    } else {
        req.session.user = undefined;
    }

    // check for username and password
    var username = req.body.username;
    var pass = req.body.password;

    if (!username || !pass) {
        res.status(422);
        res.json({message: "missing parameters"});
        return;
    }

    // search for user
    UserModel.findOne({'username': username, 'password': pass}, function(err, user) {
        if (!user) {
            res.status(401)
            res.json({message: "Incorrect username or password"});
            return;
        }
        req.session.user = user.username;
        req.session.name = user.name;
        res.json({message: "logged in", user: user.username, name: user.name});
    });
});

module.exports = router;