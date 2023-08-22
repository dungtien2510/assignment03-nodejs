const express = require("express");

const { check, body } = require("express-validator");
const bcrypt = require("bcryptjs");

const authController = require("../controller/auth");
const User = require("../models/user");

const router = express.Router();

router.post(
  "/login",
  [
    //check("email"): Middleware này kiểm tra trường "email" trong body của yêu cầu và xác nhận nó là một địa chỉ email hợp lệ bằng cách sử dụng phương thức isEmail() từ thư viện express-validator.
    check("email")
      .isEmail()

      // Nếu trường "email" không hợp lệ, thông báo lỗi "Please enter a valid email." sẽ được trả về.
      .withMessage("Please enter a valid email.")

      //Middleware custom này cho phép bạn thực hiện kiểm tra tùy chỉnh cho trường "email".
      .custom(async (value, { req }) => {
        // tìm kiếm người dùng trong cơ sở dữ liệu dựa trên email được cung cấp.
        const userDoc = await User.findOne({ email: value });

        if (!userDoc) {
          //Nếu không tìm thấy email tương ứng trong cơ sở dữ liệu, chúng ta sẽ sử dụng throw new Error("Invalid email") để ném một lỗi và middleware check sẽ hiểu rằng kiểm tra không thành công và yêu cầu sẽ không được xử lý tiếp theo theo luồng chính, mà thay vào đó sẽ chuyển tới middleware xử lý lỗi.
          throw new Error("Invalid email");
        }
      }),

    //body("password", "Invalid password"): Middleware này kiểm tra trường "password" trong body của yêu cầu và đảm bảo nó có ít nhất 8 ký tự và chỉ bao gồm số và chữ cái bằng phương thức isLength({ min: 8 }) và isAlphanumeric().
    //"Invalid password": Đối số thứ hai là thông báo lỗi tùy chỉnh mà chúng ta muốn hiển thị nếu kiểm tra không thành công. Nếu trường "password" không đáp ứng yêu cầu, thông báo lỗi "Invalid password" sẽ được trả về.
    body("password", "Invalid password")
      .isLength({ min: 8 })

      //.isAlphanumeric(): Phương thức này kiểm tra xem trường "password" chỉ bao gồm số và chữ cái (không bao gồm các ký tự đặc biệt) hay không.
      .isAlphanumeric()

      //: Middleware custom này kiểm tra mật khẩu đã nhập so với mật khẩu đã lưu trong cơ sở dữ liệu bằng cách sử dụng await bcrypt.compare() để so sánh hai mật khẩu
      .custom(async (value, { req }) => {
        const userDoc = await User.findOne({ email: req.body.email });
        if (userDoc) {
          const doMatch = await bcrypt.compare(value, userDoc.password);
          if (!doMatch) {
            // Nếu mật khẩu không khớp, chúng ta sẽ sử dụng throw new Error("Invalid Password") để ném một lỗi và middleware body sẽ hiểu rằng kiểm tra không thành công và yêu cầu sẽ không được xử lý tiếp theo theo luồng chính, mà thay vào đó sẽ chuyển tới middleware xử lý lỗi.
            throw new Error("Invalid Password");
          }
        }
      }),
  ],
  authController.postLogin
);

// router post signup
router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter your email address")
      .custom(async (value, { req }) => {
        const userDoc = await User.findOne({ email: req.body.email });
        if (userDoc) {
          throw new Error("email already exists");
        }
      }),
    body("password")
      //.trim() được sử dụng để loại bỏ các khoảng trắng (space) thừa ở đầu và cuối của một chuỗi.
      .trim()
      .isLength({ min: 8 })
      .withMessage("Please enter a password with at least 8 characters.")
      .isAlphanumeric()
      .withMessage("Please enter a password with only numbers and letters."),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match");
        }
        return true;
      }),
    body("fullName")
      // ^: Đây là anchor, kiểm tra xem chuỗi phải bắt đầu từ đầu.
      //[A-Z]: Kiểm tra ký tự đầu tiên phải là chữ cái in hoa (uppercase).
      //[a-z]*: Kiểm tra phần còn lại của tên có thể có một hoặc nhiều chữ cái thường (lowercase).
      //(?:\s[A-Z][a-z]*)+: Đây là một nhóm non-capturing, kiểm tra chuỗi có thể có một hoặc nhiều từ (được phân tách bởi khoảng trắng), trong đó từ đầu tiên viết hoa và các từ sau đó viết thường.
      //$: Đây là anchor, kiểm tra xem chuỗi phải kết thúc ở đây.
      .matches(/^[A-Z][a-z]*(?:\s[A-Z][a-z]*)+$/g)
      .withMessage(
        "Please Enter your full name, the first letter must be capitalized"
      ),
    body("phone")
      .matches(/^0\d+$/g)
      .withMessage("Phone number dose not match format"),
  ],
  authController.postSignup
);

//router logout
// router.post("/logout", authController.postLogout);

module.exports = router;
