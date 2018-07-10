const _ = require("lodash");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Fawn = require("fawn");
const { Videos, validateVideo } = require("../models/videos.js");
const { genreExists } = require("../models/genre.js");
const { User } = require("../models/users.js");
const asyncHandler = require("../middleware/asyncHandler");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Retrieve all
router.get("/", (req, res, next) => {

    Videos.find()
    .populate("genreId", "name")
    .populate("creatorId", "firstName middleName lastName")
    .select("title numberInStock dailyRentalRate format")
    .then(r => res.send(r) )
    .catch(e => next(e));
});

// Retrieve one
router.get("/:id", (req, res, next) => {
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.redirect(302, "/api/videos");

    Videos.findById(req.params.id).populate("genre", "name")
          .populate("creator", "name")
          .select("title numberInStock dailyRentalRate format")
          .then(r => {
              if(!r) return res.redirect(302, "/api/videos");
              res.send(r);
          })
          .catch(e => next(e));
});

// Create video
router.post("/", auth, async (req, res, next) => {
    
    const { error } = validateVideo(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    let isValidGenre;
    try {
        isValidGenre = await genreExists(req.body.genreId);
        if( !isValidGenre ) return res.status(400).send("Not a valid genre.");
    } catch(e) { return next(e); }
    
    const payload = _.pick(req.body, ["title", "creatorId", "genreId", "numberInStock", "dailyRentalRate", "format"]);
    
    Fawn.Task()
        .save(Videos, payload)
        .update(User, {_id: payload.creatorId}, {$inc: {totalUploads: 1}})
        .run({useMongoose: true})
        .then(r => res.send(r[0]))
        .catch(e => next(e));
});

// Update video
router.put("/:id", auth, async (req, res, next) => {
    
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(400).send("No such video.");

    const { error } = validateVideo(req.body, true);
    if(error) return res.status(400).send(error.details[0].message);
    
    if( req.body.genre ) {
        try {
            const isValidGenre = await genreExists(req.body.genre);
            if( !isValidGenre ) return res.status(400).send("No such genre.");
        } catch(e) { return next(e); }
    }
    
    const payload = _.pick(req.body, ["title", "genre", "numberInStock", "dailyRentalRate", "format"]);
    Videos.findByIdAndUpdate(req.params.id, {$set: payload, $currentDate: {updatedOn: true}}, {upsert: false, new: true})
          .then(r => {
             if(!r) return res.status(404).send("No such video.");
             res.send(r);
          })
          .catch(e => next(e));
});

// Delete one video
router.delete("/:id", auth, async (req, res, next) => {
    
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(400).send("No such video.");
    
    let user = await Videos.findById(req.params.id);
    if(!user) return res.status(400).send("No such video.");
    
    Fawn.Task()
        .update(User, {_id: user.creatorId}, {$inc: {totalUploads: -1}})
        .remove(Videos, {_id: req.params.id})
        .run({useMongoose: true})
        .then(r => res.send(r[1].n + " video deleted.") )
        .catch(e => next(e));
});

// Delete all videos
router.delete("/", [auth, admin], asyncHandler(async (req, res, next) => {
    const videos = await Videos.find();

    let customerIds = [];
    videos.forEach(v => customerIds.push(v.creatorId));
    
    Fawn.Task()
        .update(User, {_id: {$in: customerIds}}, {$inc: {totalUploads: -1}})
        .remove(Videos, {})
        .run()
        .then(r => res.send(r[1].n + " videos deleted.") )
        .catch(e => next(e));
        
    // Videos.remove({})
    //      .then(r => {
    //         return res.send(r.n + " videos deleted.");
    //     })
    //     .catch(e => {
    //         debugDb("Error deleting videos...", e.message);
    //         res.status(500).send("Unable to delete videos. Please try after sometime."); 
    //     });
}));

module.exports = router;