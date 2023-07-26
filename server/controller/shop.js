const Product = require("../models/product");

// get products
exports.getProducts = async (req, res, next) => {
  try {
    const skip = req.query.skip;
    const limit = req.query.limit;
    const totalProducts = await Product.countDocuments();
    const products = await Product.find({}).skip(skip).limit(limit).exec();
    res.status(200).json({ products: products, totalProducts: totalProducts });
  } catch {
    (error) => console.log(error);
  }
};

exports.getIdProduct = async (req, res, next) => {
  try {
    const idProduct = req.params.idProduct;
    const product = await Product.findById(idProduct);
    res.status(200).json(product);
  } catch {
    (error) => console.log(error);
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
  } catch {
    (error) => console.log(error);
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
    console.log("product", product);
    const result = await req.user.addToCart(product, quantityProduct);

    return res.json({ message: "success", result: result });
  } catch {
    (err) => {
      console.log(err);
    };
  }
};

//remove Product
exports.postRemoveProduct = async (req, res, next) => {
  try {
    const prodId = req.body.productId;

    const result = await req.user.removeFromCart(prodId);

    return res.json({ message: "removed product successfully" });
  } catch {
    (err) => {
      console.log(err);
    };
  }
};

//clear cart
exports.postClearCart = async (req, res, next) => {
  try {
    const result = await req.user.clearCart();
    return res.json({ message: "cleared cart successfully" });
  } catch {
    (err) => console.log(err);
  }
};
