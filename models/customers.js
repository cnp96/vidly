// Users Model
const mongoose = require("mongoose");
const Joi = require("joi");

const customerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    activeSubscriptions: {
        type: Number,
        min: 0,
        max: 999999,
        default: 0
    },
    totalSubscriptions: {
        type: Number,
        min: 0,
        max: 999999,
        default: 0
    },
    rentalDue: {
        type: Number,
        min: 0,
        max: 999999,
        default: 0
    },
    rentalTotal: {
        type: Number,
        min: 0,
        max: 99999999,
        default: 0
    },
    isGold: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    updatedOn: {
        type: Date,
        default: Date.now
    }
});

const Customer = mongoose.model("Customers", customerSchema);

function validateCustomer(customer, updating) {
    let schema = {
        activeSubscriptions: Joi.number().integer().min(0),
        totalSubscriptions: Joi.number().integer().min(0),
        rentalDue: Joi.number().min(0),
        rentalTotal: Joi.number().min(0),
        isGold: Joi.boolean()
    };
    if(!updating)
        schema.userId = Joi.objectId().required();
        
    return Joi.validate(customer, schema);
}

function isACustomer(userId) {
    if( !mongoose.Types.ObjectId(userId) )
        return false;
    return Customer.findOne({userId: userId});
}

module.exports = { Customer, validateCustomer, isACustomer };