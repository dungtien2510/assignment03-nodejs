const express = require("express");
const { check, body } = require("express-validator");

const adminController = require("../controller/admin");
const User = require("../models/user");
const router = express.Router();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////

//thư viện multer để xử lý việc tải lên (upload) các tệp (file) từ client lên máy chủ.
// Đây là một công cụ hữu ích khi bạn cần cho phép người dùng tải lên hình ảnh, tệp âm thanh, video hoặc bất kỳ loại tệp nào lên ứng dụng của bạn.
const multer = require("multer");

//cấu hình storage engine (bộ lưu trữ) cho Multer.
// Mỗi khi Multer nhận được tệp từ yêu cầu tải lên, nó sẽ sử dụng bộ lưu trữ này để xác định nơi lưu trữ tệp và đặt tên cho tệp.
const fileStorage = multer.diskStorage({
  //destination: Đây là một hàm dùng để xác định thư mục mà bạn muốn lưu trữ tệp tải lên. Nó nhận vào ba tham số
  destination: (req, file, cb) => {
    //req: Đối tượng yêu cầu từ client.
    //file: Thông tin về tệp đang được tải lên.
    //cb: Một hàm callback được gọi sau khi bạn xác định thư mục đích.
    //cb(null, 'image/') chỉ định rằng tất cả các tệp tải lên sẽ được lưu trong thư mục "image/" trên server.
    // null là tham số đầu tiên thường là một đối tượng lỗi (error object).
    cb(null, "photos/");
  },

  //filename: Đây là hàm được sử dụng để tạo tên cho tệp được lưu trữ. Nó cũng nhận vào ba tham số tương tự như destination
  //req: Đối tượng yêu cầu từ client.
  //file: Thông tin về tệp đang được tải lên.
  //cb: Hàm callback để xác định tên tệp sau khi bạn xử lý.
  filename: (req, file, cb) => {
    //file.originalname là tên gốc của tệp được tải lên từ client.
    //fieldname là tên của trường (field) mà tệp (file) được gửi lên từ client
    cb(null, Date.now() + "-" + file.originalname);
  },
});

//lọc các file không phải là file ảnh
const fileFilter = (req, file, cb) => {
  //Trong hàm fileFilter, chúng ta kiểm tra kiểu MIME của tệp (mimetype) để xác định xem tệp có phải là hình ảnh hay không.
  console.log(file.mimetype);
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("file không hợp lệ"), false);
  }
};

//Trong đoạn mã trên, .single('image') được thêm vào sau cấu hình Multer để chỉ định rằng bạn muốn xử lý duy nhất một tệp được gửi lên thông qua trường có tên "image" trong biểu mẫu HTML.
// Điều này có nghĩa là khi người dùng chọn một tệp để tải lên, chỉ tệp này sẽ được xử lý bởi Multer.
//Nếu bạn muốn cho phép người dùng tải lên nhiều tệp thông qua cùng một trường hoặc các trường khác nhau, bạn có thể sử dụng .array() hoặc .fields() thay vì .single().
//.array('images', 5) cho phép người dùng tải lên nhiều tệp thông qua trường có tên "images" trong biểu mẫu HTML. Tham số thứ hai 5 là số lượng tệp tối đa được phép tải lên cùng một lúc.
const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
// const upload = multer({ debug: true });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
///////////////////////////

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
      if (value !== ("client" || "adviser")) {
        throw new Error("Role must be Client or Adviser");
      }
      return true;
    }),
  ],
  adminController.postSignup
);

// router add product
router.post(
  "/product/add",
  upload.array("photos", 5),
  [
    check("name").not().isEmpty().withMessage("name is required"),
    // body("photos").trim().notEmpty().withMessage("photos is required"),
    body("long_desc").not().isEmpty().withMessage("description is required"),
    body("price").not().isEmpty().withMessage("price is required"),
    body("short_desc")
      .not()
      .isEmpty()
      .withMessage("short description is required"),
    body("category").not().isEmpty().withMessage("category is required"),
  ],

  adminController.postAddProduct
);

//router edit product
router.put(
  "/product/edit/:id",
  upload.array("photos", 5),
  [
    check("name").not().isEmpty().withMessage("name is required"),
    // body("photos").trim().notEmpty().withMessage("photos is required"),
    body("long_desc").not().isEmpty().withMessage("description is required"),
    body("price").not().isEmpty().withMessage("price is required"),
    body("short_desc")
      .not()
      .isEmpty()
      .withMessage("short description is required"),
    body("category").not().isEmpty().withMessage("category is required"),
  ],

  adminController.putProduct
);

//router delete product
router.delete("/product/delete/:id", adminController.deleteProduct);

//router get order
router.get("/order", adminController.getOrder);

//router add product
router.get("/transactions", adminController.getDasboard);

///// router chat
//router chat send message
router.post("/sendMess", adminController.postChat);

//router get chats
router.get("/chatList", adminController.getChat);

//router get chat Id
router.get("/chat/:id", adminController.getChatId);

//router end support
router.get("/endChat/:id", adminController.getEndChat);

module.exports = router;
