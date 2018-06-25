const debugRoute = require("debug")("vidly:route-genre");
const debugDb = require("debug")("vidly:db-genre");
const debug = require("debug")("vidly:log");

const _ = require("lodash");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Genre, validateGenre } = require("../models/genre.js");

router.get("/", (req, res) => {

    Genre.find().sort("updatedOn").select("name _id")
         .then(r => {
            return res.send(r);
         })
         .catch(e => {
            debugRoute("Unable to find genres...", e.message);
            res.status(500).send("Internal server error. Please try after sometime.");
         });
});

router.post("/", (req, res) => {
    
    const { error } = validateGenre(req.body);
    
    if(error) return res.status(400).send(error.details[0].message);
     
    const payload = _.pick(req.body, ["name"]);   
    new Genre(payload).save()
        .then(r => {
            res.send(r);
        })
        .catch( e => { 
            debugDb("Unable to add genre...", e.message);

            if( e.code == 11000 ) return res.status(400).send("Genre already exists."); // Duplicate key error code
            res.status(500).send("Internal server error. Please try after sometime.");
        });
});

router.put("/:id", (req, res) => {

    
    const { error } = validateGenre(req.body, true);
    if(error) return res.status(400).send(error.details[0].message);

    const payload = _.pick(req.body, ["name"]);
    Genre.findByIdAndUpdate(req.params.id, { $set: payload, $currentDate: {updatedOn: true}}, {new: true, upsert: true})
         .then(r => {
             debug("Updating genre...", r);
             if(!r) return res.status(404).send("No such genre.");

             return res.send(r);
         })
         .catch(e => {
            debugDb("Error Updating Genre...", e.message);

            if( e.code == 11000 ) return res.status(400).send("Genre already exists."); // Duplicate key error code
            res.status(500).send("Unable to update genre. Please try after sometime.");
         });
});

router.delete("/:id", (req, res) => {
    
    try {
        let temp = mongoose.Types.ObjectId(req.params.id);
    } catch(e) {
        return res.status(400).send("Not a valid genre id.")
    };
    
    Genre.findByIdAndRemove(req.params.id)
         .then(r => {
             debug("Deleted Genre ::", r);
             if(!r) return res.status(404).send("No such genre.");
             return res.send(r);
         })
         .catch( e => { 
             debug("Error deleting genre...",e.message); 
             res.status(500).send("Unable to delete genre. Please try after sometime.");
         });
});

router.delete("/", (req, res) => {
   Genre.remove({})
        .then(r => {
            res.send(r.n + " records deleted.");
        })
        .catch(e => {
            debugDb("Error deleting genres...", e.message);
            res.status(500).send("Unable to delete genres. Please try after sometime."); 
        });
});

module.exports = router;