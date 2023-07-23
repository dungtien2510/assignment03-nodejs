const express = require("express");

const { check, body } = require("express-valiator");
const bcrypt = require("bcryptjs");

const authController = require("../controllers/auth");
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
    body("password", "Invalid password")
      .isLength({ min: 8 })
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
