const debug = require("debug")("vidly:admin-m");

module.exports = function(req, res, next) {
    
    if(!req.user.isAdmin) {
        debug("Access Denied:", req.user._id);
        return res.status(403).send("Access Denied.");
    }
    
    next();
    
}