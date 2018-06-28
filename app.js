const debug = require("debug")("vidly:startup");
const debugConfig = require("debug")("vidly:config");
const debugDb = require("debug")("vidly:db");
const debugWildRoute = require("debug")("vidly:wildRoute");

const express = require("express");
const helmet = require("helmet"); // secures HTTP headers
const morgan = require("morgan"); // logs requests
const config = require("config"); // for configuration management
const mongoose = require("mongoose");
const Fawn = require("fawn");

const app = express();

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


// Database configuration
mongoose.connect("mongodb://test:test12@ds161520.mlab.com:61520/vidly-dev")
        .then(() => {
            debugDb("Connected to MongoDB...");
            Fawn.init(mongoose); // Init transaction control
        })
        .catch((e) => debugDb("Error connecting to DB...", e));

// Configuration
/* try {
    const env = app.get("env");
    debugConfig("ENV:", env);
    debugConfig("Mail Server:", config.get(env+".mail.host"));
    debugConfig("Mail Password:", config.get(env+".mail.password"));
} catch(e) {
    debugConfig("FATAL", e);
    process.exit(1);
} */


// Route Config
const genreRoute = require("./routes/genre.js");
const videosRoute = require("./routes/videos.js");
const customersRoute = require("./routes/customers.js");
const usersRoute = require("./routes/users.js");
const rentalRoute = require("./routes/rental.js");

// Route Handles
app.all("/", (req, res) => res.send("Welcome to vidly."));
app.use("/api/genre", genreRoute);
app.use("/api/videos", videosRoute);
app.use("/api/customers", customersRoute);
app.use("/api/users", usersRoute);
app.use("/api/rentals", rentalRoute);

// 404 Routes
app.all("*", (req, res) => {
    debugWildRoute(req.url);
    res.status(404).send("Not a valid endpoint."); 
});

const port = process.env.PORT || 3000;
app.listen(port, () => debug("Server started at",port));