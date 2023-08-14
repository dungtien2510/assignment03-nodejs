const Product = require("../models/product");
const { check, body, validationResult } = require("express-validator");
const Order = require("../models/order");

const fs = require("fs");

// thư viện mustache để thay thế một chuỗi trong tệp HTML bằng dữ liệu thực tế:
const mustache = require("mustache");

//Module path cung cấp các phương thức hữu ích để làm việc với các đường dẫn tệp tin và thư mục trong ứng dụng Node.js.
const path = require("path");

//pdfkit là một gói thư viện của Node.js được sử dụng để tạo và tùy chỉnh tập tin PDF
const PDFDocument = require("pdfkit");

//nodemailer là một thư viện Node.js cho phép gửi email thông qua các giao thức  hay thậm chí là các dịch vụ email của bên thứ ba
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  //sendgridTransport: Đây là một plugin được sử dụng với nodemailer để tạo ra transporter cho dịch vụ SendGrid. Nó giúp chúng ta gửi email qua SendGrid API bằng cách cung cấp khóa API của SendGrid.
  sendgridTransport({
    //auth: Đây là phần cấu hình cho việc xác thực với dịch vụ SendGrid. Trong trường hợp này, chúng ta sử dụng API key để xác thực.
    auth: {
      //"SG...": Đây là API key của bạn. Trong đoạn mã mẫu này, API key được truyền vào trực tiếp trong mã,
      // nhưng thường nên lưu trữ nó trong biến môi trường (environment variable) để bảo mật hơn.
      // API key này sẽ được cung cấp bởi SendGrid khi bạn đăng ký và sử dụng dịch vụ của họ.
      api_key:
        "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",
    },
  })
);

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

    //gửi một email xác nhận đơn hàng bằng hàm sendOrderConfirmationEmail
    await sendOrderConfirmationEmail(email, fullName, address, products);

    // hàm bất đồng bộ được sử dụng để gửi email xác nhận đơn hàng.
    async function sendOrderConfirmationEmail(
      email,
      fullName,
      address,
      products
    ) {
      try {
        //tạo nội dung email dựa trên thông tin đơn hàng
        const htmlContent = await generateOrderEmailContent(
          fullName,
          address,
          products
        );

        await transporter.sendMail({
          from: "dungptfx19575@funix.edu.vn",
          to: email,
          subject: "Order successfully created",
          html: htmlContent,
        });
      } catch (error) {
        console.error("Error sending order confirmation email:", error);
        throw error;
      }
    }

    async function generateOrderEmailContent(fullName, address, products) {
      try {
        const productDetailsAndTotal = await fetchProductDetails(products);
        const { prodHtml: productDetails, totalPrice } = productDetailsAndTotal;
        console.log("productDetails", productDetails);

        //__dirname là một biến toàn cục (global variable) trong Node.js, chứa đường dẫn thư mục chứa tệp JavaScript đang được thực thi.
        const htmlfilePath = path.join(__dirname, "../unit", "template.html");

        //fs.promises.readFile là một phương thức của Node.js dùng để đọc nội dung của một tệp.
        //Tham số thứ hai của fs.promises.readFile là "utf8", đây chỉ định mã hóa sử dụng khi đọc tệp. "utf8" là mã hóa cho văn bản.
        const htmlContentBuffer = await fs.promises.readFile(
          htmlfilePath,
          "utf8"
        );

        //Sau khi đọc nội dung tệp HTML bằng fs.promises.readFile, nội dung được lưu trong biến htmlContentBuffer là dạng buffer (bộ đệm).
        //Để sử dụng nội dung này, chúng ta cần chuyển nó thành chuỗi (string). Đoạn mã htmlContentBuffer.toString("utf8") thực hiện việc này bằng cách chuyển đổi buffer thành chuỗi sử dụng mã hóa "utf8" (cùng mã hóa như lúc đọc tệp).
        const htmlContent = htmlContentBuffer.toString("utf8");

        const orderData = {
          fullName: fullName,
          address: address,
          phoneNumber: phoneNumber,
          table: productDetails,
          totalPrice:
            totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "VNĐ",
        };
        console.log("orderData", orderData);
        return mustache.render(htmlContent, orderData);
      } catch (error) {
        console.error("Error generating order email content:", error);
        throw error;
      }
    }

    //hàm bất đồng bộ để lấy chi tiết các sản phẩm trong đơn hàng.
    async function fetchProductDetails(products) {
      try {
        const productIds = products.map((product) => product.productId);
        const productsOrder = await Product.find({ _id: { $in: productIds } });

        const prodHtml = productsOrder.map((product) => {
          const cartProduct = products.find(
            (p) => p.productId.toString() === product._id.toString()
          );
          return {
            name: product.name,
            photo: product.photos[0],
            price:
              product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") +
              "VNĐ",
            quantity: cartProduct.quantity,
            total: product.price * cartProduct.quantity,
          };
        });
        const totalPrice = prodHtml.reduce((acc, pro) => acc + pro.total, 0);
        return { prodHtml, totalPrice };
      } catch (error) {
        console.error("Error fetching product details:", error);
        throw error;
      }
    }

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
