const express = require("express");
const router = express.Router();
const shopController = require("../controller/shop");

//router get list cart
router.get("/cart", shopController.getCart);
//router post add products card
router.post("/addProduct", shopController.postAddProducts);

module.exports = router;
