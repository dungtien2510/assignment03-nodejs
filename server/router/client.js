const express = require("express");
const router = express.Router();
const shopController = require("../controller/shop");

router.get("/cart", shopController.getCart);

module.exports = router;
