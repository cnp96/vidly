const mongoose = require("mongoose");
const Joi = require("joi");

const rentalSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos",
        required: true
    },
    dateIn: {
        type: Date
    },
    dateOut: {
        type: Date,
        default: Date.now
    },
    totalRentalPrice: {
        type: Number,
        min: 0
    },
    isActiveSubscription: {
        type: Boolean,
        default: true
    },
    updatedOn:  {
        type: Date,
        default: Date.now
    }
});

const Rental = mongoose.model("Rentals", rentalSchema);

function validateRental(rental, updating) {
    let schema = {
        customerId: Joi.objectId().required(),
        videoId: Joi.objectId().required()
    };
    return Joi.validate(rental, schema);
}

module.exports = {
    Rental, validateRental
};