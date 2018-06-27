const debugDb = require("debug")("vidly:db-videos");
const debug = require("debug")("vidly:log");

const _ = require("lodash");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Videos, validateVideo } = require("../models/videos.js");
const { genreExists } = require("../models/genre.js");

// Retrieve all
router.get("/", (req, res) => {

    Videos.find().populate("genre", "name")
                 .populate("creator", "name")
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
    
    const isValidGenre = await genreExists(req.body.genre);
    if( !isValidGenre ) return res.status(400).send("Not a valid genre.");
    
    const payload = _.pick(req.body, ["title", "creator", "genre", "numberInStock", "dailyRentalRate", "format"]);
    new Videos(payload).save()
        .then(r => {
           return res.send(r); 
        })
        .catch(e => {
            debugDb("Unable to add video...", e.message);
            res.status(500).send("Unable to add video. Please try after sometime.");
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
router.delete("/:id", (req, res) => {
    
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(400).send("No such video.");
    
    Videos.findByIdAndDelete(req.params.id)
          .then(r => {
              if(!r) return res.status(404).send("No such video.");
              return res.send(r);
          })
          .catch(e => {
              debug("Unable to delete video...", e.message);
              res.status(500).send("Unable to delete video. Please try after sometime."); 
          });
});

// Delete all videos
router.delete("/", (req, res) => {
    Videos.remove({})
         .then(r => {
            return res.send(r.n + " records deleted.");
        })
        .catch(e => {
            debugDb("Error deleting videos...", e.message);
            res.status(500).send("Unable to delete videos. Please try after sometime."); 
        });
});


module.exports = router;