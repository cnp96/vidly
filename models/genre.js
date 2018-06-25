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

function validateGenre(genre, updating) {
    let schema;
    if(!updating) {
        schema = {
            name: Joi.string().min(5).max(50).required()
        };
    }
    else {
        schema = {
            name: Joi.string().min(5).max(50)
        };
    }
    
    return Joi.validate(genre, schema);
}

function genreExists(genre) {
    try {
        let temp = mongoose.Types.ObjectId(genre);
        return Genre.findById(genre);
    } catch(e) {
        return false;
    }
}

module.exports = { Genre, validateGenre, genreExists }; 