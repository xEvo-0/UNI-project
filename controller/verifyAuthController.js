const jwt = require("jsonwebtoken");
const key = "this is secret key";

const verifyAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/");
  }

  try {
    const decoded = jwt.verify(token, key);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect("/");
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).send("Unauthorized access");
    }
    next();
  };
};

module.exports = verifyAuth;
module.exports.restrictTo = restrictTo;

