const debug = require("debug")("vidly:auth-m");
const config = require("config");
const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
    const token = req.header("x-auth-token");
    if(!token) return res.status(401).send("Access denied. No token provided");
    
    try {
        const decoded = jwt.verify(token, config.get("jwtPrivatekey"));
        req.user = decoded;
        debug("User verified: " + decoded._id);
        next();
    }
    catch(e) {
        debug("Error authenticating user:", e.message);
        res.status(400).send("Invalid token.");
    }
    
}