const _ = require("lodash");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Genre, validateGenre } = require("../models/genre");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.get("/", (req, res, next) => {
    Genre.find().sort("-updatedOn").select("name")
         .then(r => res.send(r) )
         .catch(e => next(e));
});

router.post("/", [auth, admin], (req, res, next) => {
    
    const { error } = validateGenre(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    const payload = _.pick(req.body, ["name"]);   
    new Genre(payload).save()
        .then(r => res.send(r))
        .catch( e => { 
            //if( e.code == 11000 ) e.message = "Genre already exists."; // Duplicate key error code
            next(e);
        });
});

router.put("/:id", auth, (req, res, next) => {

    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(400).send("No such genre.");
    
    const { error } = validateGenre(req.body, true);
    if(error) return res.status(400).send(error.details[0].message);

    const payload = _.pick(req.body, ["name"]);
    Genre.findByIdAndUpdate(req.params.id, { $set: payload, $currentDate: {updatedOn: true}}, {new: true, upsert: false})
         .then(r => {
             if(!r) return res.status(404).send("No such genre.");
             res.send(r);
         })
         .catch(e => {
            //if( e.code == 11000 ) return res.status(400).send("Genre already exists."); // Duplicate key error code
            next(e);
         });
});

router.delete("/:id", auth, (req, res, next) => {
    
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(404).send("No such genre.");
    
    Genre.findByIdAndRemove(req.params.id)
         .then(r => {
             if(!r) return res.status(404).send("No such genre.");
             res.send(r);
         })
         .catch( e => next(e));
});

router.delete("/", [auth,admin], (req, res, next) => {
   Genre.remove({})
        .then(r => res.send(r.n + " records deleted.") )
        .catch(e => next(e));
});

module.exports = router;