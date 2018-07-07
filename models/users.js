const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const usersSchema = new mongoose.Schema({
    firstName: {
        type: String,
        trim: true,
        min: 3,
        max: 30,
        required: true
    },
    middleName: {
        type: String,
        trim: true,
        min: 0,
        max: 30,
        default: ""
    },
    lastName: {
        type: String,
        trim: true,
        min: 3,
        max: 30,
        required: true
    },
    email: {
        type: String,
        match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        unique: true
    },
    mobile: {
        type: String,
        match: /[6-9][0-9]{9}/,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        default: ""
    },
    signupToken: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: false
    },
    operations: {
        type: [String],
        default: []
    },
    isAdmin: {
        type: Boolean,
        deafult: false
    },
    totalEarnings: {
        type: Number,
        min: 0,
        max: 99999999,
        default: 0
    },
    totalUploads: {
        type: Number,
        min: 0,
        max: 999999,
        default: 0
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

usersSchema.methods.generateToken = function() {
    const token = jwt.sign({_id: this._id, isAdmin: this.isAdmin}, config.get("jwtPrivatekey"), {expiresIn: "3m"});
    return token;
}

const User = mongoose.model("Users", usersSchema);

function validateUser(user, updating) {
    let schema = {
        firstName: Joi.string().regex(/[a-zA-Z]{3,30}/),
        middleName: Joi.string().regex(/[a-zA-Z]{0,30}/),
        lastName: Joi.string().regex(/[a-zA-Z]{3,30}/),
        email: Joi.string().email(),
        mobile: Joi.string().regex(/[6-9][0-9]{9}/),
        password: Joi.string().min(3).max(30),
        operations: Joi.array().items(Joi.string()),
    };
    
    if(!updating) {
        schema = {
            firstName: Joi.string().regex(/[a-zA-z]{3,30}/).required(),
            middleName: Joi.string().regex(/[a-zA-Z]{0,30}/),
            lastName: Joi.string().regex(/[a-zA-Z]{3,30}/).required(),
            email: Joi.string().email(),
            mobile: Joi.string().regex(/[6-9][0-9]{9}/).required(),
            password: Joi.string().min(3).max(30).required(),
            operations: Joi.array().items(Joi.string()),
        };
    }
    
    return Joi.validate(user, schema);
}

function isAUser(id) {
    if( !mongoose.Types.ObjectId.isValid(id) )
        return false;
    return User.findById(id);
}

module.exports = {
    User, validateUser, isAUser
};