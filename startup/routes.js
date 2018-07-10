// Route Config
const genreRoute = require("../routes/genre");
const videosRoute = require("../routes/videos");
const customersRoute = require("../routes/customers");
const usersRoute = require("../routes/users");
const rentalRoute = require("../routes/rental");
const authRoute = require("../routes/auth");

const errorHandler = require("../middleware/errors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const debug = require("debug")("vidly:app");

module.exports = function(app) {
    
    // Middlewares
    app.use(helmet()); // protect http routes
    app.use(express.json()); // parse incoming requests with JSON
    
    // Handling JSON parse error in req.body
    app.use((err, req, res, next) => {
        if( err instanceof SyntaxError && err.type == "entity.parse.failed") {
            return res.status(400).send("Invalid payload.");
        }
        next();
    });
    
    app.use(express.urlencoded({extended: true})); // parse incoming requests with urlencoded payloads
    app.use("/", express.static("public")); // serve all content with / requests from /public directory :: alt app.use(express.static("public"));
    
    if(app.get("env") == "development") {
        app.use(morgan('[:date] :remote-addr ":method :url HTTP/:http-version" :status'));
        debug("Morgan started in development server...");
    }
    
    // Route Handles
    app.all("/", (req, res) => res.send("Welcome to vidly."));
    app.use("/api/genre", genreRoute);
    app.use("/api/videos", videosRoute);
    app.use("/api/customers", customersRoute);
    app.use("/api/users", usersRoute);
    app.use("/api/rentals", rentalRoute);
    app.use("/api/auth", authRoute);
    
    // 404 Routes
    app.all("*", (req, res) => {
        res.status(404).send("Not a valid endpoint."); 
    });
    
    // Global error handler middleware
    app.use(errorHandler);
    
}