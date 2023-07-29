const Product = require("../models/product");
const { check, body, validationResult } = require("express-validator");
const Order = require("../models/order");

// get products
exports.getProducts = async (req, res, next) => {
  try {
    const skip = req.query.skip;
    const limit = req.query.limit;
    const totalProducts = await Product.countDocuments();
    const products = await Product.find({}).skip(skip).limit(limit).exec();
    res.status(200).json({ products: products, totalProducts: totalProducts });
  } catch (error) {
    console.log(error);
  }
};

exports.getIdProduct = async (req, res, next) => {
  try {
    const idProduct = req.params.idProduct;
    const product = await Product.findById(idProduct);
    res.status(200).json(product);
  } catch (error) {
    console.log(error);
  }
};

//get category
exports.getCategory = async (req, res, next) => {
  try {
    const skip = req.query.skip || 0;
    const limit = req.query.limit || 5;
    const category = req.params.category;
    const totalProducts = await Product.count({ category: category });
    const products = await Product.find({ category: category })
      .skip(skip)
      .limit(limit);
    res.status(200).json({ products: products, totalProducts: totalProducts });
  } catch (error) {
    console.log(error);
  }
};

//get Cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = req.user.cart;
    return res.status(200).json(cart);
  } catch {
    (err) => console.log(err);
  }
};

//add products to cart
exports.postAddProducts = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const quantityProduct = req.body.quantityProduct;
    const product = await Product.findById(prodId);

    const result = await req.user.addToCart(product, quantityProduct);

    return res.json({ message: "success", result: result });
  } catch (err) {
    console.log(err);
  }
};

//remove Product
exports.postRemoveProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;

    const result = await req.user.removeFromCart(prodId);

    return res.json({ message: "removed product successfully" });
  } catch (err) {
    console.log(err);
  }
};

//clear cart
exports.postClearCart = async (req, res, next) => {
  try {
    const result = await req.user.clearCart();
    return res.json({ message: "cleared cart successfully" });
  } catch (err) {
    console.log(err);
  }
};

//hàm validation post order
exports.orderValid = [
  //kiểm tra có phải lài email không
  check("email").isEmail().withMessage("Please enter a valid email."),

  // //kiểm tra có product không
  // body("products", "There are no products in the cart").isArray({ min: 1 }),

  //kiểm tra fullName có được nhập đúng định dạng chữ hoa bắng đầu mỗi từ và có ít nhất 2 từ không
  body("fullName")
    .matches(/^[A-Z][a-z]*(?:\s[A-Z][a-z]*)+$/g)
    .withMessage(
      "Please Enter your full name, the first letter must be capitalized"
    ),

  //kiêm tra phone Number có nhập đúng định dạng bắt đầu bằng số 0 không
  body("phoneNumber")
    .matches(/^0\d+$/g)
    .withMessage("Phone number dose not match format"),

  //kiêm tra address có nhập đúng định dạng ít nhất 2 từ không
  body("address").notEmpty().withMessage("Please Enter your address"),
];

// middleware post order
exports.postOrder = async (req, res, next) => {
  try {
    const fullName = req.body.fullName;
    const email = req.body.email;
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber;
    const products = req.user.cart.items;
    const dateBook = new Date();
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({
        errorMessage: error.array()[0].msg,
        oldInput: { email, phoneNumber, dateBook, address, fullName },
        validationErrors: error.array(),
      });
    }
    const order = new Order({
      products: products,
      status: "unconfimred",
      dateBook: dateBook,
      user: {
        email: email,
        fullName: fullName,
        phoneNumber: phoneNumber,
        address: address,
        userId: req.user._id,
      },
    });
    const result = await order.save();
    await req.user.clearCart();
    return res
      .status(200)
      .json({ message: "order saved successfully", result: result });
  } catch (err) {
    console.log(err);
  }
};

exports.getOrdered = async function (req, res, next) {
  try {
    const userId = req.user._id;
    const orders = await Order.find({
      "user.userId": userId.toString(),
    })
      .select("-products -dateBook")
      .exec();
    return res
      .status(200)
      .json({ message: "get orders successfully", result: orders });
  } catch (err) {
    console.log(err);
  }
};

// get order id
exports.getOrderedId = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const result = await Order.findById(orderId);
    return res
      .status(200)
      .json({ message: "get order id successfully", result: result });
  } catch (err) {
    console.log(err);
  }
};

//search products from name
exports.getSearchProd = async (req, res, next) => {
  try {
    const name = req.query.name;
    const skip = req.query.skip;
    const limit = req.query.limit;
    const result = await Product.find({ $text: { $search: name } })
      .skip(skip)
      .limit(limit)
      .exec();
    return res
      .status(200)
      .json({ message: "search successfully", result: result });
  } catch (err) {
    console.log(err);
  }
};
