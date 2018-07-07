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

router.get("/", (req, res) => {
    Rental.find().sort("-dateOut")
        .populate("customerId", "firstName middleName lastName")
        .populate("videoId", "title")
        .then(r => {
            res.send(r);
        })
        .catch(e => {
            debugDb("Error getting rentals...", e.message);
            res.status(500).send("Unable to get rentals. Please try after sometime.");
        });
});

router.get("/:id", (req, res) => {
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.redite(302, "/api/rentals");
    
    Rental.findById(req.params.id)
        .populate("customerId", "firstName middleName lastName")
        .then(r => {
            res.send(r);
        })
        .catch(e => {
            debugDb("Error getting rental details...", e.message);
            res.status(500).send("Unable to get rental details. Please try after sometime.");
        });
});

router.post("/", async (req, res) => {
    const { error } = validateRental(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    const customerExists = await isACustomer(req.body.customerId);
    if( !customerExists ) return res.status(400).send("No such user.");
    
    const videoExists = await isAVideo(req.body.videoId);
    if( !videoExists || ( videoExists.numberInStock == 0 )) return res.send("Video not in stock right now.");
    
    const payload = _.pick(req.body, ["customerId", "videoId"]);
    if( Object.keys(payload).length == 0 ) return res.status(400).send("Invalid payload");
    
    Fawn.Task()
        .save(Rental, payload)
        .update(Videos, {_id: videoExists._id}, {$inc: {"numberInStock": -1}})
        .update(Customer, {_id: customerExists._id}, {$inc: {"activeSubscriptions": 1, "totalSubscriptions": 1}})
        .run({useMongoose: true})
        .then(r => {
            return res.send(r[0]);
        })
        .catch(e => {
            debugDb("Error creating rental. Rolled back changes...", e.message); 
            res.status(500).send("Unable to create rental. Please try after sometime.");
        });
});

router.put("/:id", async (req, res) => {
    
    if( !mongoose.Types.ObjectId.isValid(req.params.id) ) return res.status(400).send("Invalid rental id.");
    
    const rental = await Rental.findById(req.params.id);
    if(rental) {
        if(rental.isActiveSubscription == false) return res.status(400).send("This rental is already completed.");

        const video = await Videos.findById(rental.videoId);
        const customer = await Customer.findOne({userId: rental.customerId});
        
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
            .then(r => {
                res.send("Rental checked in successfully. Your number of days is " + duration.days() + " and rental amount is Rs " + rentalDue);
            })
            .catch(e => {
                debugDb("Error processing return...", e);
                res.status(500).send("Unable to return video. Please try after sometime.");
            });
    }
    else return res.status(400).send("Invalid rental id.");
    
});

module.exports = router;