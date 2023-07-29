const express = require("express");
const router = express.Router();
const shopController = require("../controller/shop");

router.get("/products", shopController.getProducts);

//router get product id
router.get("/detail/:idProduct", shopController.getIdProduct);

//router get product category
router.get("/category/:category", shopController.getCategory);

//router get search
router.get("/search", shopController.getSearchProd);

module.exports = router;
