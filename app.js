const debug = require("debug")("vidly:app");

const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const express = require("express");

const app = express();

// Initialize Logger
require("./startup/logging")();

// Add routes and middlewares
require("./startup/routes")(app);

// Connect to db
require("./startup/database")();

// Load configurations
require("./startup/configuration")(app);

const port = process.env.PORT || 3000;
app.listen(port, () => debug("Server started at",port));