const winston = require("winston");

module.exports = function() {

    // Initialize Logger
    winston.add(winston.transports.File, {filename: "vidly.log"});
    winston.handleExceptions( new winston.transports.File({filename: "uncaughtExceptions.log"}) );
    
    // Handle unhandled rejection through process
    process.on("unhandledRejection", ex => {throw ex;});
    
    // Handle uncaught exceptions through process
    // process.on("uncaughtException", ex => {
    //     debug("Uncaught Exception: ", ex.message);
    // });

    
}