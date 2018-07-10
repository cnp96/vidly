const router = require("express").Router();
const debugDb = require("debug")("vidly:rental");
const mongoose = require("mongoose");
const _ = require("lodash");
const Fawn = require("fawn");
const DateDiff = require("date-diff");

const { Rental, validateRental } = require("../models/rental.js");
const { Customer, isACustomer } = require("../models/customers.js");
const { Videos, isAVideo } = require("../models/videos.js");
const auth = require("../middleware/auth");
//const admin = require("../middleware/admin");

router.use(auth);

router.get("/", (req, res, next) => {
    Rental.find().sort("-dateOut")
        .populate("customerId", "firstName middleName lastName")
        .populate("videoId", "title")
        .then(r => res.send(r) )
        .catch(e => next(e));
});

router.get("/:id", (req, res, next) => {
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.redirect(302, "/api/rentals");
    
    Rental.findById(req.params.id)
          .populate("customerId", "firstName middleName lastName")
          .then(r => res.send(r) )
          .catch(e => next(e));
});

router.post("/", async (req, res, next) => {
    const { error } = validateRental(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    const customerExists = await isACustomer(req.body.customerId);
    if( !customerExists ) return res.status(400).send("No such user.");
    
    const videoExists = await isAVideo(req.body.videoId);
    if( !videoExists || ( videoExists.numberInStock == 0 )) return res.send("Video out of stock.");
    
    const payload = _.pick(req.body, ["customerId", "videoId"]);
    if( Object.keys(payload).length == 0 ) return res.status(400).send("Invalid payload");
    
    Fawn.Task()
        .save(Rental, payload)
        .update(Videos, {_id: videoExists._id}, {$inc: {"numberInStock": -1}})
        .update(Customer, {_id: customerExists._id}, {$inc: {"activeSubscriptions": 1, "totalSubscriptions": 1}})
        .run({useMongoose: true})
        .then(r => res.send(r[0]) )
        .catch(e => next(e));
});

router.put("/:id", async (req, res, next) => {
    
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(400).send("Invalid rental id.");
    
    let rental;
    try {
        rental = await Rental.findById(req.params.id);
    } catch(e) { return next(e); }
    
    if(rental) {
        if(rental.isActiveSubscription == false) return res.status(400).send("This rental is already completed.");
        
        let video, customer;
        try {
            video = await Videos.findById(rental.videoId);
            customer = await Customer.findOne({userId: rental.customerId});
        } catch(e) { return next(e); }
        
        // Create payloads
        const duration = new DateDiff(Date.now(), rental.dateOut);
        const rentalDue = duration.days() * video.dailyRentalRate;
        
        const videoPayload = {
            $inc: { numberInStock: 1 },
            $currentDate: { updatedOn: true }
        };
        const customerPayload = {
            $inc: { activeSubscriptions: -1, rentalTotal: rentalDue },
            $set: { rentalDue: rentalDue },
            $currentDate: { updatedOn: true }
        };
        const rentalPayload = {
            $set: { isActiveSubscription: false, totalRentalPrice: rentalDue },
            $currentDate: { dateIn: true, updatedOn: true }
        };
        
        // res.send({
        //     videoPayload,
        //     customerPayload,
        //     rentalPayload,
        //     duration: duration.days(),
        //     total: rentalDue
        // });
        
        // Clear the rental
        Fawn.Task()
            .update(Rental, {_id: rental._id}, rentalPayload)
            .update(Videos, {_id: video._id}, videoPayload)
            .update(Customer, {_id: customer._id}, customerPayload)
            .run({useMongoose: true})
            .then(r => res.send("Rental checked in successfully. Your number of days is " + duration.days() + " and rental amount is Rs " + rentalDue))
            .catch(e => next(e));
    }
    else return res.status(400).send("Invalid rental id.");
    
});

module.exports = router;