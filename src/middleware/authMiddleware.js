const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    try {
        const bearerToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET || "secret");
        req.user = decoded; // Contains { id, role }
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};
