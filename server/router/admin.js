const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator");

const adminController = require("../controller/admin");
const User = require("../models/user");
//router post signup

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
    body("role").custom((value, { req }) => {
      if (value !== ("client" || "advisor")) {
        throw new Error("Role must be Client or Advisor");
      }
      return true;
    }),
  ],
  authController.postSignup
);

// router add product
router.post(
  "/product/add",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("photos").trim().notEmpty().withMessage("photos is required"),
    body("longDesc").trim().notEmpty().withMessage("description is required"),
    body("price").trim().notEmpty().withMessage("price is required"),
    body("shortDesc")
      .trim()
      .notEmpty()
      .withMessage("short description is required"),
    body("category").trim().notEmpty().withMessage("category is required"),
  ],
  adminController.postAddProduct
);

//router edit product
router.put(
  "/product/edit/:id",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("photos").trim().notEmpty().withMessage("photos is required"),
    body("longDesc").trim().notEmpty().withMessage("description is required"),
    body("price").trim().notEmpty().withMessage("price is required"),
    body("shortDesc")
      .trim()
      .notEmpty()
      .withMessage("short description is required"),
    body("category").trim().notEmpty().withMessage("category is required"),
  ],
  adminController.putProduct
);

//router delete product
router.delete("/product/delete/:id", adminController.deleteProduct);

//router get order
router.get("/order", adminController.getOrder);

router.module.exports = router;
