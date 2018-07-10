const debug = require("debug")("vidly:err");
const winston = require("winston");

module.exports = function (err, req, res, next) {
    // Log error to file
    winston.error(err.message, err);
    // error, warn, info, verbose. debug, silly
    
    // Log to console
    debug("Error Ocurred:", err.message);
    
    if(err.code == 11000) return res.status(400).send("Duplicate entry");
    
    res.status(500).send("Something went wrong. Please try after sometime.");
}