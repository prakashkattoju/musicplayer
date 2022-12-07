const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    try {
        let accessToken = req.header('x-token');
        if (!accessToken) return res.status(400).send('Token not found');
        let decode = jwt.verify(accessToken, 'Project4');
        req.user = decode.user
        next();
    }
    catch (err) {
        res.status(500).send(err);
    }
}