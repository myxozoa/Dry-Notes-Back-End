const express = require('express');
const bcrypt = require('bcrypt');
const { authUser, sendUserError } = require('../middleware');

const { STATUS_USER_ERROR, BCRYPT_COST } = require('../config.json');

const User = require('../models/users');

const router = express.Router();

router.get('/', authUser, (req, res) => {
    User.find()
        .select('username')
        .then(users => {
            res.status(200).send(users);
        })
        .catch(err => {
            sendUserError(err, res);
        });
});

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    const newUser = new User({ username, password });

    newUser.save()
        .then(result => {
            res.status(201).send(result);
        })
        .catch(err => {
            sendUserError(err, res);
        });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username })
        .then(user => {
            if(!user) {
                sendUserError('Username or password does not match', res);
            } else {
                bcrypt.compare(password, user.password, (err, result) => {
                    if(err) throw new Error(err);

                    if(result) {
                        req.session.loggedIn = user._id;
                        res.send({ success: true });
                    } else {
                        sendUserError('Username or password does not match', res);
                    }
                });
            }
        })
        .catch(err => {
            sendUserError(err, res);
        });
});

router.post('/logout', (req, res) => {
    const store = req.sessionStore;
    const sesh = store.db.collection('sessions');
    sesh.remove({ loggedIn: req.session.loggedIn }, (err) => {
        req.session.destroy((err) => {
            if(err) {
                sendUserError(err, res);
            } else {
                res.send({ success: true });
            }
        });
    });
});

module.exports = router;