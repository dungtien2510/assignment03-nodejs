const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validation");

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
      errorMessage: errors.array()[0].msg,
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
          // // Nếu mật khẩu khớp, đánh dấu người dùng đã đăng nhập và lưu thông tin người dùng vào session
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            console.log(err);

            // // Lưu session và trả về một phản hồi JSON thành công với mã trạng thái 401
            res.status(401).json({ successMessage: "success" });
          });
        }

        //req.flash("error", "Invalid email or password") được sử dụng để đặt thông báo lỗi (error message) vào flash session trong ứng dụng sử dụng framework Express. Flash session là một dạng session đặc biệt trong Express, cho phép lưu trữ dữ liệu tạm thời để hiển thị cho người dùng trong một yêu cầu HTTP duy nhất, thường được sử dụng để hiển thị thông báo sau khi xảy ra một hành động nhất định (ví dụ: đăng nhập thất bại).
        //Khi bạn gọi req.flash("error", "Invalid email or password"), bạn đang đặt thông báo lỗi vào flash session với khóa là "error" và giá trị là "Invalid email or password". Sau đó, thông báo lỗi này sẽ tồn tại trong flash session và sẽ được sử dụng để hiển thị cho người dùng sau khi trình duyệt chuyển đổi sang trang khác (thông thường là sau khi gửi một yêu cầu và nhận được phản hồi).
        req.flash("error", "Invalid email or password");
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
      errorMessage: errors.array()[0].msg,
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
    return res.status(422).json({
      errorMessage: "Passwords do not match",
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
    });
  }

  // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
  User.findOne({ email: email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(422).json({
          errorMessage: "User with this email already exists",
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
            cart: { items: [] },
          });

          // Lưu thông tin người dùng vào cơ sở dữ liệu
          return user.save();
        })
        .then((result) => {
          // Trả về một phản hồi JSON thành công nếu đăng ký thành công
          res.status(200).json({ successMessage: "Signup success!" });
        });
    })
    .catch((err) => {
      // Nếu có lỗi trong quá trình xử lý, tạo một đối tượng Error với mã trạng thái 500 và gửi nó cho middleware next để xử lý lỗi
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  // Hủy session của người dùng
  req.session.destroy((error) => {
    if (error) {
      // Nếu có lỗi trong quá trình hủy session, gửi lỗi cho middleware next để xử lý lỗi
      const err = new Error(error);
      err.httpStatusCode = 500;
      return next(err);
    }

    // Nếu hủy session thành công, chuyển hướng người dùng về trang chủ
    res.status(200).json({ message: "success" });
  });
};
