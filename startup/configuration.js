const debug = require("debug")("vidly:config");
const config = require("config"); // for configuration management

module.exports = function(app) {
    // Configuration
    try {
        const env = app.get("env");
        debug("ENV:", env);
        debug("Mail Server:", config.get("mail.host"));
        debug("Mail Password:", config.get("mail.password"));
        debug("jwtPrivatekey: ", config.get("jwtPrivatekey"));
    } catch(e) {
        debug("FATAL", e.message);
        process.exit(1);
    }
}