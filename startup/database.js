const debug = require("debug")("vidly:app");
const mongoose = require("mongoose");
const Fawn = require("fawn");
const winston = require("winston");

module.exports = function() {
    // Database configuration
    mongoose.connect("mongodb://test:test12@ds161520.mlab.com:61520/vidly-dev", {useNewUrlParser: true})
        .then(() => {
            winston.info("Connected to MongoDB");            
            debug("Connected to MongoDB...");

            Fawn.init(mongoose); // Init transaction control
            winston.info("Instantiated Fawn");
            debug("Initiated transaction control :: Fawn");
        });
}