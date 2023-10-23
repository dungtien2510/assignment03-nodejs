const User = require("../models/user");
const bcrypt = require("bcryptjs");

const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const secretKey = "mysecretkey";

//Module path cung cấp các phương thức hữu ích để làm việc với các đường dẫn tệp tin và thư mục trong ứng dụng Node.js.
const path = require("path");

//pdfkit là một gói thư viện của Node.js được sử dụng để tạo và tùy chỉnh tập tin PDF
const pdfDocument = require("pdfkit");

//nodemailer là một thư viện Node.js cho phép gửi email thông qua các giao thức  hay thậm chí là các dịch vụ email của bên thứ ba
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
      api_key: process.env.SENDGRID_KEY,
    },
  })
);

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // const errors = validationResult(req);:
  // Hàm này sử dụng express-validator để kiểm tra và xác thực dữ liệu người dùng.
  // validationResult là một hàm trong express-validator giúp kiểm tra xem liệu có lỗi nào trong các trường đã nhập hay không.
  const errors = validationResult(req);

  //if (!errors.isEmpty()) { ... }:
  // Đoạn mã này kiểm tra xem có lỗi nào trong dữ liệu người dùng hay không.
  // Nếu có lỗi (mảng errors không trống),
  // chương trình sẽ xử lý lỗi và trả về một đối tượng JSON báo lỗi về phía người dùng.
  if (!errors.isEmpty()) {
    //console.log(errors.array());
    //: Hàm này in ra mảng các lỗi dưới dạng mảng JSON trong bản ghi console của máy chủ.
    // Điều này giúp bạn dễ dàng xem và debug lỗi nếu có.
    console.log(errors.array());

    //return res.status(422).json({ ... }):
    // Trả về một phản hồi JSON cho người dùng với mã trạng thái 422 (Unprocessable Entity) để báo lỗi.
    // Phản hồi JSON này bao gồm thông báo lỗi đầu tiên từ mảng errors, dữ liệu đã nhập (oldInput),
    // và tất cả các lỗi trong mảng errors (validationErrors).
    return res.status(422).json({
      message: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  //User.findOne({email: email}): Đoạn mã này tìm kiếm trong cơ sở dữ liệu để lấy thông tin người dùng có email trùng khớp.
  User.findOne({ email: email })
    .then((user) => {
      //Hàm này sử dụng bcrypt để so sánh mật khẩu đã nhập của người dùng với mật khẩu đã lưu trong cơ sở dữ liệu.
      // Nếu hai mật khẩu khớp nhau, doMatch sẽ là true, và ngược lại.
      bcrypt.compare(password, user.password).then((doMatch) => {
        if (doMatch) {
          // jwt.sign(payload, secretOrPrivateKey, [options], callback): Đây là hàm dùng để tạo JWT. Có một số đối số cần được truyền vào:
          //payload: Đây là đối tượng JSON chứa thông tin của người dùng (ví dụ: id, username, role, etc.) mà chúng ta muốn đính kèm vào token.
          //secretOrPrivateKey: Đây là chuỗi bí mật (secret key) được sử dụng để mã hóa dữ liệu trong token. Để tạo token, chúng ta sử dụng secret key này. Đảm bảo giữ secret key này bí mật và không chia sẻ công khai.
          //options: Đây là một đối tượng tùy chọn cho token. Trong ví dụ trên, chúng ta sử dụng thuộc tính expiresIn để chỉ định thời gian sống của token là 1 giờ (1h). Sau khi thời gian sống này kết thúc, token sẽ hết hiệu lực.
          //callback(err, token): Đây là hàm callback sẽ được gọi sau khi token được tạo. Nếu có lỗi trong quá trình tạo token, biến err sẽ chứa thông tin lỗi. Nếu token được tạo thành công, biến token sẽ chứa chuỗi JWT đã tạo.
          const token = jwt.sign({ user }, secretKey, { expiresIn: "1h" });

          // // Nếu mật khẩu khớp, đánh dấu người dùng đã đăng nhập và lưu thông tin người dùng vào session
          // req.session.isLoggedIn = true;
          // req.session.user = user;
          // req.session.token = token;
          // return req.session.save((err) => {
          //   console.log(err);

          //Lưu session và trả về một phản hồi JSON thành công với mã trạng thái 401
          return res.status(200).json({
            successMessage: "success",
            token: token,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
          });
          // });
        }

        //req.flash("error", "Invalid email or password") được sử dụng để đặt thông báo lỗi (error message) vào flash session trong ứng dụng sử dụng framework Express. Flash session là một dạng session đặc biệt trong Express, cho phép lưu trữ dữ liệu tạm thời để hiển thị cho người dùng trong một yêu cầu HTTP duy nhất, thường được sử dụng để hiển thị thông báo sau khi xảy ra một hành động nhất định (ví dụ: đăng nhập thất bại).
        //Khi bạn gọi req.flash("error", "Invalid email or password"), bạn đang đặt thông báo lỗi vào flash session với khóa là "error" và giá trị là "Invalid email or password". Sau đó, thông báo lỗi này sẽ tồn tại trong flash session và sẽ được sử dụng để hiển thị cho người dùng sau khi trình duyệt chuyển đổi sang trang khác (thông thường là sau khi gửi một yêu cầu và nhận được phản hồi).
        // req.flash("error", "Invalid email or password");
        res.status(403).json({ successMessage: "Invalid password" });
      });
    })

    //Nếu có lỗi trong quá trình xử lý, chương trình sẽ tạo một đối tượng Error với mã trạng thái 500 và gửi nó cho middleware next để xử lý lỗi.
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const fullName = req.body.fullName;
  const phone = req.body.phone;

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
  User.findOne({ email: email })
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
            role: "client",
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
