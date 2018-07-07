const debug = require("debug")("vidly:log");
const debugDb = require("debug")("vidly:users");

const bcrypt = require("bcrypt");
const Fawn = require("fawn");
const _ = require("lodash");
const router = require("express").Router();
const mongoose = require("mongoose");
const { User, validateUser } = require("../models/users.js");

router.get("/", (req, res) => {
    User.find()
        .then(r => { res.send(r); })
        .catch(e => { 
            debugDb("Error getting users...", e.message);
            res.status(500).send("Unable to get users. Please try after sometime.");
        });
});

router.get("/:id", (req, res) => {
   if(!mongoose.Types.ObjectId(req.params.id)) return res.redirect(302, "/api/users");
   
   User.findById(req.params.id)
       .then(r => {
          if(!r) return res.redirect(302, "/api/users");
          return res.send(r);
       })
       .catch(e => {
          debugDb("Error getting user data...", e.message);
          res.status(500).send("Unable to get user data. Please try after sometime.");
       });
});

router.post("/", async (req, res) => {
    const {error} = validateUser(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    const payload = _.pick(req.body, ["firstName", "middleName", "lastName", "mobile", "email", "password"]);
    if( payload.length == 0 ) return res.status(400).send("Invalid payload.");
    
    const salt = await bcrypt.genSalt(10);
    payload.password = await bcrypt.hash(payload.password, salt);
    
    // Perform transaction to save the user and also create a customer profile
    Fawn.Task()
        .save("users", payload)
        // Use 0.ops.0._id in case {useMongoose: false} set in run()
        .save("customers", {userId: {$ojFuture: "0._id"}}) // Create customer profile with id from parent
        .run({useMongoose: true})
        .then(r => {
            return res.send(r[0]);
        })
        .catch(e => {
            debugDb("Rolled back changes. Unable to create user...", e.message);
            if( e.code == 11000 ) return res.status(400).send("User already exists.");
            res.status(500).send("Unable to create user. Please try after sometime.");
        });
});

router.put("/:id", (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send("No such user.");
    
    const {error} = validateUser(req.body, true);
    if(error) return res.status(400).send(error.details[0].message);
    
    const payload = _.pick(req.body, ["firstName", "middleName", "lastName", "email", "mobile", "password", "operations"]);
    if( Object.keys(payload).length == 0 ) return res.status(400).send("Invalid payload.");

    User.findByIdAndUpdate(req.params.id, {$set: payload, $currentDate: {updatedOn: true}}, {upsert: false, new: true})
        .then(r => {
            if(!r) return res.status(404).send("No such user.");
            return res.send(r);
        })
        .catch(e => {
            debugDb("Error updating user...", e.message);
            if(e.code == 11000)
                res.status(400).send("User with few credentials already exists.");
            else
                res.status(500).send("Unable to update user. Please try after sometime.");
        });
});

router.delete("/:id", (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send("No such user.");
    
    User.findByIdAndDelete(req.params.id)
        .then(r => {
            if(!r) return res.status(404).send("No such user.");
            return res.send(r);
        })
        .catch(e => {
            debugDb("Error deleting user...", e.message);
            res.status(500).send("Unable to delete user. Please try after sometime.");
        });
});

router.delete("/", (req, res) => {
    User.remove({})
        .then(r => {
            return res.send(r.n + " records deleted.");
        })
        .catch(e => {
            debugDb("Error deleting users...", e.message);
            res.status(500).send("Unable to delete users. Please try after sometime.");
        });
});

module.exports = router;
