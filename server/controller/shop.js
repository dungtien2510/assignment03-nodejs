const Product = require("../models/product");
const { check, body, validationResult } = require("express-validator");
const Order = require("../models/order");
const User = require("../models/user");
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
const Chat = require("../models/chat");
const { getIO } = require("../socket");

const transporter = nodemailer.createTransport(
  //sendgridTransport: Đây là một plugin được sử dụng với nodemailer để tạo ra transporter cho dịch vụ SendGrid. Nó giúp chúng ta gửi email qua SendGrid API bằng cách cung cấp khóa API của SendGrid.
  sendgridTransport({
    //auth: Đây là phần cấu hình cho việc xác thực với dịch vụ SendGrid. Trong trường hợp này, chúng ta sử dụng API key để xác thực.
    auth: {
      //"SG...": Đây là API key của bạn. Trong đoạn mã mẫu này, API key được truyền vào trực tiếp trong mã,
      // nhưng thường nên lưu trữ nó trong biến môi trường (environment variable) để bảo mật hơn.
      // API key này sẽ được cung cấp bởi SendGrid khi bạn đăng ký và sử dụng dịch vụ của họ.
      api_key: process.env.SENDGRID_KEY,
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
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getIdProduct = async (req, res, next) => {
  try {
    const idProduct = req.params.idProduct;
    const product = await Product.findById(idProduct);
    res.status(200).json(product);
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
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
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//get Cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = req.user.cart;
    const prodId = cart.items.map((prod) => prod.productId.toString());
    const prodCart = await Product.find({ _id: { $in: prodId } }).exec();

    const result = prodCart.map((prod) => {
      const quantity = cart.items.find(
        (id) => id.productId.toString() === prod._id.toString()
      ).quantity;
      return { ...prod.toObject(), quantity: quantity };
    });
    const totalPrice = result.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);
    return res.status(200).json({ result, totalPrice });
  } catch {
    (err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    };
  }
};

//add products to cart
exports.postAddProducts = async (req, res, next) => {
  try {
    const prodId = req.body.id;

    const quantityProduct = req.body.quantityProduct;
    const product = await Product.findById(prodId);

    const result = await req.user.addToCart(product, quantityProduct);
    const dataResult = result;
    return res.json({ message: "success", result: result });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//remove Product
exports.postRemoveProduct = async (req, res, next) => {
  try {
    const prodId = req.body.id;

    const result = await req.user.removeFromCart(prodId);
    const dataResult = result.cart.items;
    return res.json({
      message: "removed product successfully",
      dataResult: dataResult,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//clear cart
exports.postClearCart = async (req, res, next) => {
  try {
    const result = await req.user.clearCart();
    return res.json({ message: "cleared cart successfully" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
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
    const totalPrice = req.body.totalPrice;
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
      totalPrice: totalPrice,
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
    res.status(200).json({ message: "Order success" });
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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//search products from name
exports.getSearchProd = async (req, res, next) => {
  try {
    const name = req.query.name;
    const skip = req.query.skip;
    const limit = req.query.limit;

    const totalProducts = await Product.countDocuments({
      $text: { $search: name },
    });

    const result = await Product.find({ $text: { $search: name } })
      .skip(skip)
      .limit(limit)
      .exec();
    return res.status(200).json({
      message: "search successfully",
      products: result,
      totalProducts: totalProducts,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

///chat
exports.sendMessValid = [
  body("message").trim().notEmpty().withMessage("not empty message"),
];
// start chat
exports.postMessageChat = async (req, res, next) => {
  const roomId = req.user.roomId;
  const message = req.body.message;
  const messageData = {
    message: message,
    time: new Date(),
    from: "client",
  };
  try {
    if (!roomId) {
      return res.status(404).json({ message: "room chat not exist" });
    }
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({
        errorMessage: error.array()[0].msg,
        validationErrors: error.array(),
      });
    }
    const chat = await Chat.findById(roomId);
    if (!chat) {
      return res.status(422).json({ message: "chat not found" });
    }
    chat.messages.push(messageData);

    await chat.save();
    console.log(roomId.toString());

    // getIO().on("connection", function (socket) {
    //   console.log(socket.id, "connected");
    //   socket.on("sendMess-" + roomId.toString(), (data) => {
    //     socket.emit("sendMess-" + roomId.toString(), {
    //       action: "post",
    //       user: {
    //         role: "client",
    //         name: req.user.name,
    //         message: messageData,
    //         roomId: roomId,
    //       },
    //     });
    //     socket.on("disconnect", function () {
    //       console.log("disconnect");
    //     });
    //   });
    // });
    getIO().emit("sendMessage", {
      action: "post",
      user: {
        role: "client",
        name: req.user.name,
        message: messageData,
        roomId: roomId,
      },
    });
    res.status(200).json({ message: "sent message" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getMessage = async (req, res, next) => {
  const roomId = req.user.roomId;

  try {
    const chatRoom = await Chat.findById(roomId);
    if (!chatRoom) {
      const adviserArray = await User.aggregate([
        { $match: { role: "adviser" } },
        { $sample: { size: 1 } },
      ]);
      const adviser = adviserArray[0];

      const chatNew = new Chat({
        client: { email: req.user.email, id: req.user._id },
        ad: { email: adviser.email, id: adviser._id },
        messages: [
          { from: "adviser", time: new Date(), message: "Hi, Can I Help you?" },
        ],
      });
      const chatId = await chatNew.save();
      console.log(chatId);
      adviser.roomId.push(chatId._id);

      await User.findByIdAndUpdate(adviser._id, adviser, { new: true });
      req.user.addRoomId(chatId._id);
      // getIO().on("connection", function (socket) {
      //   console.log(socket.id, "connected");
      //   socket.on("sendMess-" + chatId._id, (data) => {
      //     socket.emit("sendMess-" + chatId._id, {
      //       action: "post",
      //       user: {
      //         role: "client",
      //         name: req.user.name,
      //         message: "start sending message",
      //         roomId: chatId._id,
      //       },
      //     });
      //     socket.on("disconnect", function () {
      //       console.log("disconnect");
      //     });
      //   });
      // });
      //
      getIO().emit("sendMessage", {
        action: "post",
        user: {
          role: "client",
          name: req.user.name,
          message: "send message",
          roomId: chatId._id,
        },
      });
      res.status(200).json({ result: chatId });
    } else {
      res.status(200).json({ result: chatRoom });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//
exports.postEndChat = async (req, res, next) => {
  try {
    await Chat.findByIdAndDelete(req.user.roomId[0]);

    res.status(200).json({ message: "delete Chat successfully" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
  }
};
