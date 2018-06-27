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

const Genre = mongoose.model("Genres", genreSchema);

function validateGenre(genre, updating) {
    let schema = { name: Joi.string().min(5).max(50) };
    if(!updating) {
        schema = {
            name: Joi.string().min(5).max(50).required()
        };
    }

    return Joi.validate(genre, schema);
}

function genreExists(genre) {
    if( mongoose.Types.ObjectId.isValid(genre) ) {
        return Genre.findById(genre);
    }
    return false;
}

module.exports = { Genre, validateGenre, genreExists }; 