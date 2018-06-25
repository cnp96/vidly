const debug = require("debug")("vidly:db-genre");
const mongoose = require("mongoose");
const Joi = require("joi");

const genreSchema = new mongoose.Schema({
   name: {
       type: String,
       required: true,
       minlength: 5,
       maxlength: 50,
       unique: true
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

const Genre = mongoose.model("Genre", genreSchema);

function validateGenre(genre) {
    const schema = {
        name: Joi.string().min(5).max(50).required()
    };
    
    return Joi.validate(genre, schema);
}

module.exports = { Genre, validateGenre }; 