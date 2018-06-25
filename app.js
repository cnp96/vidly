const debug = require("debug")("vidly:startup");
const debugConfig = require("debug")("vidly:config");
const debugDb = require("debug")("vidly:db");
const debugWildRoute = require("debug")("vidly:wildRoute");

const express = require("express");
const helmet = require("helmet"); // secures HTTP headers
const morgan = require("morgan"); // logs requests
const config = require("config"); // for configuration management
const mongoose = require("mongoose");

const app = express();

// Middlewares
app.use(helmet());
app.use(express.json()); // parse incoming requests with JSON
app.use(express.urlencoded({extended: true})); // parse incoming requests with urlencoded payloads
app.use("/", express.static("public")); // serve all content with / requests from /public directory :: alt app.use(express.static("public"));

if(app.get("env") == "development") {
    app.use(morgan('[:date] :remote-addr ":method :url HTTP/:http-version" :status'));
    debug("Morgan started in development server...");
}


// Database configuration
mongoose.connect("mongodb://test:test12@ds161520.mlab.com:61520/vidly-dev")
        .then(() => debugDb("Connected to MongoDB..."))
        .catch((e) => debugDb("Error connecting to DB...", e));

// Configuration
// try {
//     const env = app.get("env");
//     debugConfig("ENV:", env);
//     debugConfig("Mail Server:", config.get(env+".mail.host"));
//     debugConfig("Mail Password:", config.get(env+".mail.password"));
// } catch(e) {
//     debugConfig("FATAL", e);
//     process.exit(1);
// }


// Route Config
const genreRoute = require("./routes/genre.js");
const videosRoute = require("./routes/videos.js");

// Route Handles
app.all("/", (req, res) => res.send("Welcome to vidly."));
app.use("/api/genre", genreRoute);
app.use("/api/videos", videosRoute);

// 404 Routes
app.all("*", (req, res) => {
    debugWildRoute(req.url);
    res.status(404).send("Not a valid endpoint."); 
});

const port = process.env.PORT || 3000;
app.listen(port, () => debug("Server started at",port));