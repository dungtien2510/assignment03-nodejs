const express = require("express");
const router = express.Router();
const shopController = require("../controller/shop");

//router get list cart
router.get("/cart", shopController.getCart);

//router post add products card
router.post("/addProduct", shopController.postAddProducts);

router.post("/removeProduct", shopController.postRemoveProduct);

// router post clear cart
router.post("/clearCart", shopController.postClearCart);

module.exports = router;
