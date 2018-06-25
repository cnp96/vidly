const debugRoute = require("debug")("vidly:route-genre");
const debugDb = require("debug")("vidly:db-genre");
const debug = require("debug")("vidly:log");

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Genre, validateGenre } = require("../models/genre.js");

router.get("/", (req, res) => {
    Genre.find().sort("name")
         .then(r => {
            res.send(r);
         })
         .catch(e => {
            res.status(500).send("Internal server error. Please try after sometime.");
            debugRoute("Unable to find genres...", e.message);
         });
});

router.post("/", (req, res) => {
    
    const { error } = validateGenre(req.body);
    
    if(error) return res.status(400).send(error.details[0].message);
        
    new Genre({ name: req.body.name }).save()
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
    if( !mongoose.Types.ObjectId(req.params.id) ) return res.status(400).send("Not a valid Id.");
    
    const { error } = validateGenre(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    Genre.findByIdAndUpdate(req.params.id, {name: req.body.name}, {new: true})
         .then(r => {
             debug("Updating genre...", r);
             if(!r) return res.status(400).send("No such genre.");
             return res.send(r);
         })
         .catch(e => {
            debug("Error Updating Genre...", e.message); 
            res.status(500).send("Unable to update genre. Please try after sometime.");
         });
});

router.delete("/:id", (req, res) => {
    if( !mongoose.Types.ObjectId(req.params.id) ) return res.status(400).send("Not a valid Id.");
    
    Genre.findByIdAndRemove(req.params.id)
         .then(r => {
             debug("Deleted Genre ::",r);
             if(!r) return res.status(400).send("No such genre.");
             return res.send(r);
         })
         .catch( e => { 
             debug("Error deleting genre...",e.message); 
             res.status(500).send("Unable to delete genre. Please try after sometime.");
         });
    
});

module.exports = router;