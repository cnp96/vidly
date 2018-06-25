const debug = require("debug")("vidly:db-videos");
const mongoose = require("mongoose");
const Joi = require("joi");

const videosSchema = new mongoose.Schema({
   name: {
       type: String,
       required: true,
       minlength: 5,
       maxlength: 255
   },
   genre: mongoose.schema.Types.ObjectId,
   stockLeft: {
       type: Number,
       required: true,
       min: 0,
       max: 10000
   },
   format: {
       type: String,
       minlength: 3,
       maxlength: 10
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

function validateVideo(video) {
    const schema = {
        name: Joi.string().min(5).max(255).required(),
        genre: Joi.string().regex(/^[a-f\d]{24}$/i),
        stockLeft: Joi.number().integer().min(0).max(10000).required(),
        format: Joi.string().min(3).max(10)
    };
    
    return Joi.validate(video, schema);
}

module.exports = { Videos, validateVideo }; 