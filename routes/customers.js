const _ = require("lodash");
const router = require("express").Router();
const mongoose = require("mongoose");
const { Customer, validateCustomer, isACustomer } = require("../models/customers.js");
const { isAUser } = require("../models/users.js");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const asyncHandler = require("../middleware/asyncHandler");

router.use(auth);

router.get("/", admin, (req, res, next) => {
   Customer.find().populate("userId", "firstName middleName lastName").select("activeSubscriptions totalSubscriptions rentalDue rentalTotal isGold")
           .then(r => res.send(r))
           .catch(e => next(e));
});

router.post("/", admin, asyncHandler(async (req, res, next) => {
    const { error } = validateCustomer(req.body);
    if( error ) return res.status(400).send(error.details[0].message);
    
    // Check if user exists
    const userExists = await isAUser(req.body.userId);
    if(!userExists) return res.status(404).send("No such user.");
        
    // Check if customer exists
    const customerExists = await isACustomer(req.body.userId);
    if(customerExists) res.status(400).send("Customer already exists.");
    
    const payload = _.pick(req.body, ["userId"]);
    new Customer(payload).save()
                .then(r => res.send(r))
                .catch(e => next(e));
}));

router.put("/me", (req, res, next) => {
    const { error } = validateCustomer(req.body, true);
    if(error) return res.status(400).send(error.details[0].message);
    
    const payload = _.pick(req.body, ["name", "activeSubscriptions", "totalSubscriptions", "rentalDue", "rentalTotal", "isGold"]);
    if( Object.keys(payload).length == 0 ) return res.status(400).send("Invalid payload.");
    
    Customer.findByIdAndUpdate(req.params._id, { $set: payload, $currentDate: {updatedOn: true} }, { upsert: false, new: true })
            .then(r => {
                if(!r) return res.status(404).send("No such customer.");
                res.send(r);
            })
            .catch(e => next(e) );
});

router.delete("/me", (req, res, next) => {
    if( !mongoose.Types.ObjectId.isValid(req.user._id) ) return res.status(404).send("No such customer.");
    
    Customer.findByIdAndDelete(req.user._id)
            .then(r => {
                if(!r) return res.status(404).send("No such user.");
                res.send(r);
            })
            .catch(e => next(e));
});

router.delete("/", admin, (req, res, next) => {
    Customer.remove({})
            .then(r => res.send(r.n + " records deleted.") )
            .catch(e => next(e));
});

module.exports = router;