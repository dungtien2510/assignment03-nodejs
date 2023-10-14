const express = require("express");
const router = express.Router();
const shopController = require("../controller/shop");

//router get list cart
router.get("/cart", shopController.getCart);

//router post add products card
router.post("/addProduct", shopController.postAddProducts);

//router post remove products in cart
router.post("/removeProduct", shopController.postRemoveProduct);

// router post clear cart
router.post("/clearCart", shopController.postClearCart);

//router post order
router.post("/order", shopController.orderValid, shopController.postOrder);

//router get orders
router.get("/orders", shopController.getOrdered);

//router get order id
router.get("/detail/:orderId", shopController.getOrderedId);

/////chat
router.post(
  "/sendMess",
  shopController.sendMessValid,
  shopController.postMessageChat
);

router.get("/chat", shopController.getMessage);

router.post("/endChat", shopController.postEndChat);

module.exports = router;
