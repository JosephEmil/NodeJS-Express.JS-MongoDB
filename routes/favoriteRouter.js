const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus = 200; })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.find({})
    .populate('postedByUser')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({'postedByUser': req.user._id})
    .then((favorite) => {    
        if(!favorite) {
            Favorites.create({'postedByUser': req.user._id, 'dishes': req.body})
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('postedByUser')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                });
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            for(var i = 0; i < req.body.length; i ++) {
                if(favorite.dishes.indexOf(req.body[i]._id) === -1) {
                    favorite.dishes.push(req.body[i]._id);
                }
            }
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('postedByUser')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                });
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favourites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.remove({'postedByUser': req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    },(err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus = 200; })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if(!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type','application/json');
            return res.json({"exists": false, "favorites": favorites});
        }
        else {
            if(favorites.dishes.indexOf(req.params.dishId) < 0 ) {
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({'postedByUser': req.user._id}, (err, favorite) => {
        if(err)
            return next(err);    
        if(!favorite) {
            Favorites.create({'postedByUser': req.user._id, 'dishes': req.params.dishId})
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('postedByUser')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                });
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            if(favorite.dishes.indexOf(req.params.dishId) === -1) {
                favorite.dishes.push(req.params.dishId);
                favorite.save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    .populate('postedByUser')
                    .populate('dishes')
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                }, (err) => next(err))
                .catch((err) => next(err));
            }
        }
    });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({'postedByUser': req.user._id}, (err, favorite) => {
        if(err)
            return next(err);
        if(favorite) {
            for(var i = (favorite.dishes.length - 1); i >= 0; i--) {
                if(favorite.dishes[i] == req.params.dishId) {
                    favorite.dishes.remove(req.params.dishId);
                }
            }
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('postedByUser')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                });
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Dish ' + req.params.id + 'is not in your favorites!');
        }
    });
});

module.exports = favoriteRouter;