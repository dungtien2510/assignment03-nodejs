const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const { validationResult } = require("express-validator");

const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  //sendgridTransport: Đây là một plugin được sử dụng với nodemailer để tạo ra transporter cho dịch vụ SendGrid. Nó giúp chúng ta gửi email qua SendGrid API bằng cách cung cấp khóa API của SendGrid.
  sendgridTransport({
    //auth: Đây là phần cấu hình cho việc xác thực với dịch vụ SendGrid. Trong trường hợp này, chúng ta sử dụng API key để xác thực.
    auth: {
      //"SG.u7": Đây là API key của bạn. Trong đoạn mã mẫu này, API key được truyền vào trực tiếp trong mã,
      // nhưng thường nên lưu trữ nó trong biến môi trường (environment variable) để bảo mật hơn.
      // API key này sẽ được cung cấp bởi SendGrid khi bạn đăng ký và sử dụng dịch vụ của họ.
      api_key:
        "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",
    },
  })
);

// post signup
exports.postSignup = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const fullName = req.body.fullName;
  const phone = req.body.phone;
  const role = req.body.role;
  // Sử dụng express-validator để kiểm tra và xác thực dữ liệu người dùng
  const errors = validationResult(req);

  // Nếu có lỗi trong dữ liệu người dùng
  if (!errors.isEmpty()) {
    // In ra mảng các lỗi dưới dạng JSON trong bản ghi console của máy chủ
    console.log(errors.array());

    // Trả về một phản hồi JSON cho người dùng với mã trạng thái 422 (Unprocessable Entity) để báo lỗi
    // Phản hồi JSON này bao gồm thông báo lỗi đầu tiên từ mảng errors, dữ liệu đã nhập (oldInput),
    // và tất cả các lỗi trong mảng errors (validationErrors)
    return res.status(422).json({
      message: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  // Kiểm tra xem mật khẩu và xác nhận mật khẩu có khớp nhau không
  if (password !== confirmPassword) {
    console.log("passwords do not match");
    return res.status(422).json({
      message: "Passwords do not match",
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        phone: phone,
        fullName: fullName,
      },
    });
  }

  // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
  User.findOne({ email: email, role: "admin" })
    .then((existingUser) => {
      if (existingUser) {
        console.log("existing user");
        return res.status(422).json({
          message: "User with this email already exists",
          oldInput: {
            email: email,
            password: password,
            confirmPassword: confirmPassword,
          },
        });
      }

      // Nếu người dùng không tồn tại, tiến hành mã hóa mật khẩu
      return bcrypt
        .hash(password, 12)
        .then((passwordBcrypt) => {
          const user = new User({
            email: email,
            password: passwordBcrypt,
            fullName: fullName,
            phone: phone,
            role: role,
            cart: { items: [] },
          });

          // Lưu thông tin người dùng vào cơ sở dữ liệu
          return user.save();
        })

        .then((result) => {
          // Trả về một phản hồi JSON thành công nếu đăng ký thành công
          transporter.sendMail({
            from: "dungptfx19575@funix.edu.vn",
            to: email,
            subject: "Signup successded!",
            html: "<h1>Signup success</h1>",
          });
          res.status(200).json({ message: "Signup success!" });
        });
    })
    .catch((err) => {
      // Nếu có lỗi trong quá trình xử lý, tạo một đối tượng Error với mã trạng thái 500 và gửi nó cho middleware next để xử lý lỗi
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//post add product
exports.postAddProduct = async (req, res, next) => {
  console.log(req.files);
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  // lấy danh sách tải lên
  const uploadedFile = req.files;
  console.log(uploadedFile);
  //
  const filesPath = uploadedFile.map((file) => "/photos/" + file.filename);

  const productData = {
    name: req.body.name,
    category: req.body.category,
    long_desc: req.body.long_desc,
    short_desc: req.body.short_desc,
    price: req.body.price,
    photos: filesPath,
  };

  try {
    const product = new Product(productData);
    await product.save();
    return res.status(200).json({ message: "Added product" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// put edit product
exports.putProduct = async (req, res, next) => {
  const uploadFiles = req.file;
  const filesPath = uploadFiles.map(
    (file) => BASE_PATH + "/uploads/" + file.filename
  );
  const productData = {
    name: req.body.name,
    category: req.body.category,
    long_desc: req.body.long_desc,
    short_desc: req.body.short_desc,
    price: req.body.price,
    photos: filesPath,
  };
  try {
    await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true } // Trả về người dùng sau khi đã được cập nhật;
    );
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// get order
exports.getOrder = async (req, res, next) => {
  try {
    const totalOrder = await Order.countDocuments();
    const result = await Order.find()
      .skip(req.query.skip)
      .limit(req.query.limit);
    return res
      .status(200)
      .json({ message: "success", result: result, totalOrder: totalOrder });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// get dashboard
exports.getDasboard = async (req, res, next) => {
  try {
    const totalClient = await User.countDocuments({ role: "client" });
    const priceOrder = await Order.find().select("totalPrice");

    console.log(priceOrder);
    const totalPrice = priceOrder.reduce(
      (acc, item) => acc + Number(item.totalPrice),
      0
    );

    return res
      .status(200)
      .json({ message: "Success", totalClient, totalPrice });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
