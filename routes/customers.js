// Users Routes
const debug = require("debug")("vidly:log");
const debugDb = require("debug")("vidly:customer");

const _ = require("lodash");
const router = require("express").Router();
const mongoose = require("mongoose");
const { Customer, validateCustomer, isACustomer } = require("../models/customers.js");
const { isAUser } = require("../models/users.js");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.use(auth);

router.get("/", admin, (req, res) => {
   Customer.find().populate("userId", "firstName middleName lastName").select("activeSubscriptions totalSubscriptions rentalDue rentalTotal isGold")
           .then(r => {
               return res.send(r);
           })
           .catch(e => {
              debugDb("Error getting customers...", e.message);
              res.status(500).send("Unable to get customers. Please try after sometime.");
           });
});

router.post("/", admin, async (req, res) => {
    const { error } = validateCustomer(req.body);
    if( error ) return res.status(400).send(error.details[0].message);
    
    // Check if user exists
    const userExists = await isAUser(req.body.userId);
    if(!userExists) return res.status(404).send("No such user.");
        
    // Check if customer exists
    const customerExists = await isACustomer(req.body.userId);
    if(customerExists) return res.status(400).send("Customer already exists.");
    
    const payload = _.pick(req.body, ["userId"]);
    new Customer(payload).save()
                .then(r => {
                    return res.send(r);
                })
                .catch(e => {
                   debugDb("Error creating customer...", e.message);
                   res.status(500).send("Unable to create customer. Please try after sometime.");
                });
});

router.put("/me", (req, res) => {
    const { error } = validateCustomer(req.body, true);
    if(error) return res.status(400).send(error.details[0].message);
    
    const payload = _.pick(req.body, ["name", "activeSubscriptions", "totalSubscriptions", "rentalDue", "rentalTotal", "isGold"]);
    if( Object.keys(payload).length == 0 ) return res.status(400).send("Invalid payload.");
    
    Customer.findByIdAndUpdate(req.params._id, {
        $set: payload, 
        $currentDate: {updatedOn: true}
        
    }, {
        upsert: false, 
        new: true
    })
    .then(r => {
        if(!r) return res.status(404).send("No such customer.");
        return res.send(r);
    })
    .catch(e => {
        debugDb("Error udpating customer...", e.message);
        res.status(500).send("Unable to update customer data. Please try after sometime.");
    });
});

router.delete("/me", (req, res) => {
    if( !mongoose.Types.ObjectId.isValid(req.user._id) ) return res.status(404).send("No such customer.");
    
    Customer.findByIdAndDelete(req.user._id)
            .then(r => {
                if(!r) return res.status(404).send("No such user.");
                return res.send(r);
            })
            .catch(e => {
               debugDb("Unable to delete customer...", e.message);
               res.status(500).send("Unable to delete customer. Please try after sometime.");
            });
});

router.delete("/", admin, (req, res) => {
    Customer.remove({})
            .then(r => {
                return res.send(r.n + " records deleted.");
            })
            .catch(e => {
                debugDb("Unable to delete customers...", e.message);
                return res.status(500).send("Unable to delete customers. Please try after somteime.");
            });
});

module.exports = router;