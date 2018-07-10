const debugDb = require("debug")("vidly:users");

const bcrypt = require("bcrypt");
const Fawn = require("fawn");
const _ = require("lodash");
const router = require("express").Router();
const mongoose = require("mongoose");
const { User, validateUser } = require("../models/users");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.use(auth);

router.get("/", admin, (req, res, next) => {
    User.find()
        .then(r => res.send(r))
        .catch(e => next(e));
});

router.get("/me", (req, res, next) => {
    User.findById(req.user._id).select("-password")
        .then(r => res.send(r))
        .catch(e => next(e));
});

router.post("/", async (req, res, next) => {
    const {error} = validateUser(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    const payload = _.pick(req.body, ["firstName", "middleName", "lastName", "mobile", "email", "password"]);
    if( payload.length == 0 ) return res.status(400).send("Invalid payload.");
    
    let salt;
    try {
        salt = await bcrypt.genSalt(10);
        payload.password = await bcrypt.hash(payload.password, salt);
    } catch(e) { return next(e); }    
    
    // Perform transaction to save the user and also create a customer profile
    Fawn.Task()
        .save("users", payload)
        // Use 0.ops.0._id in case {useMongoose: false} set in run()
        .save("customers", {userId: {$ojFuture: "0._id"}}) // Create customer profile with id from parent
        .run({useMongoose: true})
        .then(r => res.send(r[0]) )
        .catch(e => {
            //if( e.code == 11000 ) return res.status(400).send("User already exists.");
            next(e);
        });
});

router.put("/me", (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.user._id)) return res.status(404).send("No such user.");
    
    const {error} = validateUser(req.body, true);
    if(error) return res.status(400).send(error.details[0].message);
    
    const payload = _.pick(req.body, ["firstName", "middleName", "lastName", "email", "mobile", "password", "operations"]);
    if( Object.keys(payload).length == 0 ) return res.status(400).send("Invalid payload.");

    User.findByIdAndUpdate(req.user.id, {$set: payload, $currentDate: {updatedOn: true}}, {upsert: false, new: true})
        .then(r => {
            if(!r) return res.status(404).send("No such user.");
            res.send(r);
        })
        .catch(e => {
            //if(e.code == 11000) return res.status(400).send("User with few credentials already exists.");
            next(e);
        });
});

router.delete("/me", (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.user._id)) return res.status(404).send("No such user.");
    
    User.findByIdAndDelete(req.user._id)
        .then(r => {
            if(!r) return res.status(404).send("No such user.");
            res.send(r);
        })
        .catch(e => next(e));
});

router.delete("/", admin, (req, res, next) => {
    User.remove({})
        .then(r => res.send(r.n + " records deleted.") )
        .catch(e => next(e));
});

module.exports = router;
