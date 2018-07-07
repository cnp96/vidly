const mongoose = require("mongoose");
const Joi = require("joi");

const videosSchema = new mongoose.Schema({
   title: {
       type: String,
       required: true,
       trim: true,
       minlength: 5,
       maxlength: 255
   },
   genreId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Genres"
   },
   numberInStock: {
       type: Number,
       required: true,
       min: 0,
       max: 10000
   },
   dailyRentalRate: {
       type: Number,
       required: true,
       min: 0,
       max: 300
   },
   format: {
       type: String,
       default: "NA",
       minlength: 2,
       maxlength: 10
   },
   creatorId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Users"
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

const Videos = mongoose.model("Videos", videosSchema);

function validateVideo(video, updating) {
    
    let schema = {
            title: Joi.string().min(5).max(255).required(),
            creatorId: Joi.objectId().required(),
            genreId: Joi.objectId().required(),
            numberInStock: Joi.number().integer().min(0).max(10000).required(),
            dailyRentalRate: Joi.number().min(0).max(300).required(),
            format: Joi.string().min(3).max(10)
    };
    if( updating ) {
        schema = {
            title: Joi.string().min(5).max(255),
            genreId: Joi.objectId(),
            numberInStock: Joi.number().integer().min(0).max(10000),
            dailyRentalRate: Joi.number().min(0).max(300),
            format: Joi.string().min(3).max(10)
        };
    }
    
    return Joi.validate(video, schema);
}

function isAVideo(videoId) {
    if( !mongoose.Types.ObjectId.isValid(videoId) )
        return false;
    return Videos.findById(videoId);
}

module.exports = { Videos, validateVideo, isAVideo }; 