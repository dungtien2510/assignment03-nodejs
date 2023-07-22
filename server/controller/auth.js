const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validation");

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
  }
};
