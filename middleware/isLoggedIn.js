const debug = require("debug")("vidly:isLoggedIn-m");
const config = require("config");
const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
    const token = req.header("x-auth-token");
    if(!token) return next();
    
    try {
        const decoded = jwt.verify(token, config.get("jwtPrivatekey"));
        res.send("OK");
    }
    catch(e) {
        delete req.user;
        next();
    }
    
}