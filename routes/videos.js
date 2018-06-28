const debugDb = require("debug")("vidly:db-videos");
const debug = require("debug")("vidly:log");

const _ = require("lodash");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Fawn = require("fawn");
const { Videos, validateVideo } = require("../models/videos.js");
const { genreExists } = require("../models/genre.js");
const { User } = require("../models/users.js");

// Retrieve all
router.get("/", (req, res) => {

    Videos.find()
    .populate("genreId", "name")
    .populate("creatorId", "firstName middleName lastName")
    .select("title numberInStock dailyRentalRate format")
    .then(r => {
        return res.send(r);
    })
    .catch(e => {
        debugDb("Unable to get videos...", e.message);
        res.status(500).send("Unable to get videos. Please try after sometime.");
    });
});

// Retrieve one
router.get("/:id", (req, res) => {
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.redirect(302, "/api/videos");

    Videos.findById(req.params.id).populate("genre", "name")
             .populate("creator", "name")
             .select("title numberInStock dailyRentalRate format")
             .then(r => {
                if(!r) return res.redirect(302, "/api/videos");
                return res.send(r);
             })
             .catch(e => {
                debugDb("Unable to get videos...", e.message);
                res.status(500).send("Unable to get videos. Please try after sometime.");
             });
});

// Create video
router.post("/", async (req, res) => {
    
    const { error } = validateVideo(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    const isValidGenre = await genreExists(req.body.genreId);
    if( !isValidGenre ) return res.status(400).send("Not a valid genre.");
    
    const payload = _.pick(req.body, ["title", "creatorId", "genreId", "numberInStock", "dailyRentalRate", "format"]);
    
    Fawn.Task()
        .save(Videos, payload)
        .update(User, {_id: payload.creatorId}, {$inc: {totalUploads: 1}})
        .run({useMongoose: true})
        .then(r => {
            return res.send(r[0]);
        })
        .catch(e => {
            debugDb("Error saving video...", e.message);            
            res.status(500).send("Unable to save video. Please try after sometime.");
        });
});

// Update video
router.put("/:id", async (req, res) => {
    
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(400).send("No such video.");

    const { error } = validateVideo(req.body, true);
    if(error) return res.status(400).send(error.details[0].message);
    
    if( req.body.genre ) {
        const isValidGenre = await genreExists(req.body.genre);
        if( !isValidGenre ) return res.status(400).send("No such genre.");
    }
    
    const payload = _.pick(req.body, ["title", "genre", "numberInStock", "dailyRentalRate", "format"]);
    Videos.findByIdAndUpdate(req.params.id, {$set: payload, $currentDate: {updatedOn: true}}, {upsert: false, new: true})
          .then(r => {
             if(!r) return res.status(404).send("No such video.");
             return  res.send(r);
          })
          .catch(e => {
              debugDb("Unable to update video...", e.message);
              res.status(500).send("Unable to update video. Please try after sometime.");
          });
});

// Delete one video
router.delete("/:id", async (req, res) => {
    
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(400).send("No such video.");
    
    let user = await Videos.findById(req.params.id);
    if(!user) return res.status(400).send("No such video.");
    
    Fawn.Task()
        .update(User, {_id: user.creatorId}, {$inc: {totalUploads: -1}})
        .remove(Videos, {_id: req.params.id})
        .run({useMongoose: true})
        .then(r => {
            return res.send(r[1].n + " video deleted.");
        })
        .catch(e => {
            debugDb("Error deleting video...", e.message);
            res.status(500).send("Unable to delete video. Please try after sometime.");
        });
});

// Delete all videos
router.delete("/", async (req, res) => {
    let videos = await Videos.find();
    let customerIds = [];
    videos.forEach(v => customerIds.push(v.creatorId));
    
    Fawn.Task()
        .update(User, {_id: {$in: customerIds}}, {$inc: {totalUploads: -1}})
        .remove(Videos, {})
        .run()
        .then(r => {
            res.send(r[1].n + " videos deleted.");
        })
        .catch(e => {
            debugDb("Error deleting videos...", e.message);
            res.status(500).send("Unable to delete videos.");
        });
        
    // Videos.remove({})
    //      .then(r => {
    //         return res.send(r.n + " videos deleted.");
    //     })
    //     .catch(e => {
    //         debugDb("Error deleting videos...", e.message);
    //         res.status(500).send("Unable to delete videos. Please try after sometime."); 
    //     });
});

module.exports = router;