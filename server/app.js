const express = require("express");
const app = express();
const cors = require("cors");
//moongoose
const mongoose = require("mongoose");

//jsonwebToken
const jwt = require("jsonwebtoken");
//secret jwt
const secretJWT = "mysecretkey";

// express-session: Đây là mô-đun chịu trách nhiệm quản lý session trong ứng dụng Express.
// Nó cung cấp middleware để tạo và quản lý dữ liệu session.
const session = require("express-session");

//connect-mongodb-session: Đây là một thư viện cung cấp một cơ chế lưu trữ session cho express-session sử dụng MongoDB.
const MongoDBStore = require("connect-mongodb-session")(session);

//Thư viện csurf (Cross-Site Request Forgery) được sử dụng để bảo vệ ứng dụng web khỏi tấn công CSRF.
const csrf = require("csurf");

//Thư viện connect-flash được sử dụng trong các ứng dụng web Node.js để hiển thị thông báo tạm thời (flash messages) cho người dùng
// const flash = require("connect-flash");

//router auth
const authRouter = require("./router/auth");

//router shop
const shopRouter = require("./router/shop");

//router client
const clientRouter = require("./router/client");

//router admin
const adminRouter = require("./router/admin");

const MONGODB_URI =
  "mongodb+srv://dungtien2510:Dung25101997@cluster0.jyqoacf.mongodb.net/shop";

//chúng ta tạo một đối tượng mới của MongoDBStore bằng từ khóa new
//và truyền một đối tượng cấu hình cho nó.
// MongoDBStore là một cơ chế lưu trữ session sử dụng MongoDB.
// const store = new MongoDBStore({
//   //uri: Thuộc tính này được đặt là MONGODB_URI,
//   // mô tả chuỗi kết nối đến cơ sở dữ liệu MongoDB mà dữ liệu session sẽ được lưu trữ.
//   uri: MONGODB_URI,
//   //collection: Thuộc tính này xác định tên bảng (collection) trong cơ sở dữ liệu MongoDB mà dữ liệu session sẽ được lưu trữ.
//   //Trong trường hợp này, nó được đặt là "sessions".
//   collection: "sessions",
// });

// app.use(
//   session({
//     //Đây là chuỗi bí mật (secret) được sử dụng để mã hóa dữ liệu session trước khi lưu trữ nó vào cookie.
//     secret: "my secret",

//     //resave: Thuộc tính này quy định liệu session có được lưu lại vào cơ sở dữ liệu sau mỗi lần yêu cầu hay không.
//     resave: false,

//     //saveUninitialized: Thuộc tính này xác định liệu session sẽ được lưu lại vào cơ sở dữ liệu ngay cả khi nó chưa được sử dụng hay không.
//     saveUninitialized: false,
//     store: store,

//     // thời gian cookie bị xóa
//     cookie: { maxAge: 60000 * 60 },
//   })
// );

//tạo 1 middleware lưu user vào request
//. Sau đó, req.user có thể được sử dụng trong các middleware và xử lý yêu cầu tiếp theo, và bạn có thể sử dụng methods của user từ req.user.

// app.use((req, res, next) => {
//   const token = req.headers.authorization
//     ? req.headers.authorization.split(" ")[1]
//     : undefined;
//   //Sau đó, middleware kiểm tra xem biến token hoặc biến req.session.isLoggedIn và token trong session có tồn tại hay không.
//   if (!token) {
//     //Nếu không tìm thấy token hoặc req.session.isLoggedIn là false (người dùng chưa đăng nhập), nó sẽ trả về mã trạng thái 401 và thông báo rằng người dùng phải đăng nhập để truy cập tài nguyên bảo vệ.
//     return next();
//   }

//   //Cuối cùng, middleware sử dụng thư viện JWT để giải mã mã thông báo JWT (token) bằng cách sử dụng khóa bí mật (secretJWT).
//   //Nếu mã thông báo JWT hợp lệ, nó sẽ được giải mã thành một JavaScript object (decodeToken), chứa các thông tin mà bạn đã định nghĩa trong mã thông báo.
//   //Nếu mã thông báo không hợp lệ, middleware sẽ trả về mã trạng thái 401 và thông báo rằng token không hợp lệ.
//   jwt.verify(token, secretJWT, (err, decodeToken) => {
//     req.user = decodeToken.user;
//     return next();
//   });
// });
// app.use((req, res, next) => {
//   if (!req.session.user) {
//     return next();
//   }
//   User.findById(req.session.user._id)
//     .then((user) => {
//       if (!user) {
//         return next();
//       }

//       //Dòng req.user = user; không tạo instance mới của lớp User.
//       // Thay vào đó, nó chỉ đơn giản là gán đối tượng user (đã lấy từ cơ sở dữ liệu) vào thuộc tính req.user.
//       // Điều này cho phép bạn truy cập thông tin của người dùng từ req.user trong các route và middleware tiếp theo mà không cần phải lấy lại từ cơ sở dữ liệu.
//       //Khi bạn lưu thông tin người dùng vào req.user, nó chỉ đơn giản là việc lưu một tham chiếu đến đối tượng user đã tìm thấy từ cơ sở dữ liệu,
//       // và không phải là việc tạo một instance mới của lớp User.
//       // Các methods của user được định nghĩa trong model userSchema vẫn sẽ được sử dụng thông qua đối tượng này, bởi vì nó vẫn là một instance của model User, dù được tạo mới hoặc lấy từ cơ sở dữ liệu.
//       req.user = user;
//       next();
//     })
//     .catch((error) => {
//       next(new Error(error));
//     });
// });

//app.use(csrf()): Dòng này khai báo việc sử dụng middleware csurf trong ứng dụng Express. Middleware csurf sẽ xử lý việc tạo và kiểm tra mã CSRF (CSRF token) cho các yêu cầu POST, PUT và DELETE.
// app.use(csrf());

// Sử dụng connect-flash middleware
// app.use(flash());

// app.use((req, res, next) => {
//   //res.locals là một đối tượng trong Express.js dùng để lưu trữ các biến cục bộ (local variables) trong quá trình xử lý yêu cầu và trả về đến các view template. Biến cục bộ là các biến chỉ tồn tại trong phạm vi của một yêu cầu cụ thể và chỉ có thể truy cập từ trong route hoặc từ view template được render cho yêu cầu đó.
//   res.locals.isAuthenticated = req.session.isLoggedIn;

//   //res.locals.csrfToken = req.csrfToken(): Dòng này thêm một biến csrfToken vào đối tượng res.locals, đảm bảo mã CSRF sẽ được truyền vào view template và có thể được sử dụng trong các yêu cầu POST, PUT và DELETE.
//   //req.csrfToken(): Đây là một phương thức của middleware csurf để tạo mã CSRF (CSRF token) cho yêu cầu hiện tại. Mã CSRF này sẽ được sử dụng để xác thực các yêu cầu POST, PUT và DELETE và ngăn chặn tấn công CSRF.
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
app.use(cors());

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
//router shopRouter
app.use("/shop", shopRouter);

//router auth
app.use("/auth", authRouter);

//router admin

const User = require("./models/user");
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
    console.log(file);
    cb(null, "image/");
  },

  //filename: Đây là hàm được sử dụng để tạo tên cho tệp được lưu trữ. Nó cũng nhận vào ba tham số tương tự như destination
  //req: Đối tượng yêu cầu từ client.
  //file: Thông tin về tệp đang được tải lên.
  //cb: Hàm callback để xác định tên tệp sau khi bạn xử lý.
  filename: (req, file, cb) => {
    //file.originalname là tên gốc của tệp được tải lên từ client.
    //fieldname là tên của trường (field) mà tệp (file) được gửi lên từ client
    console.log(file);
    cb(null, file.originalname + "-" + Date.now());
  },
});

//lọc các file không phải là file ảnh
const fileFilter = (req, file, cb) => {
  //Trong hàm fileFilter, chúng ta kiểm tra kiểu MIME của tệp (mimetype) để xác định xem tệp có phải là hình ảnh hay không.
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
const upload = multer({ storage: fileStorage });
const adminController = require("./controller/admin");
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
// function protection: tạo hàm bảo vệ các router khi đăng nhập mới sử dụng được
const protection = (requestRole) => {
  return (req, res, next) => {
    //Đầu tiên, middleware kiểm tra xem header "Authorization" có tồn tại hay không.
    const token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    //Sau đó, middleware kiểm tra xem biến token hoặc biến req.session.isLoggedIn và token trong session có tồn tại hay không.
    if (!token) {
      //Nếu không tìm thấy token hoặc req.session.isLoggedIn là false (người dùng chưa đăng nhập), nó sẽ trả về mã trạng thái 401 và thông báo rằng người dùng phải đăng nhập để truy cập tài nguyên bảo vệ.
      return res
        .status(401)
        .json({ message: "You must be logged in", status: 401 });
    }

    //Cuối cùng, middleware sử dụng thư viện JWT để giải mã mã thông báo JWT (token) bằng cách sử dụng khóa bí mật (secretJWT).
    //Nếu mã thông báo JWT hợp lệ, nó sẽ được giải mã thành một JavaScript object (decodeToken), chứa các thông tin mà bạn đã định nghĩa trong mã thông báo.
    //Nếu mã thông báo không hợp lệ, middleware sẽ trả về mã trạng thái 401 và thông báo rằng token không hợp lệ.
    jwt.verify(token, secretJWT, (err, decodeToken) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Token is invalid", status: 401 });
      }

      if (!decodeToken.user || !decodeToken.user._id) {
        return res
          .status(401)
          .json({ message: "Invalid user data in token", status: 401 });
      }
      if (
        (decodeToken.user.role !== requestRole) &
        (decodeToken.user.role !== "admin") &
        (decodeToken.user.role === "client")
      ) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const userId = decodeToken.user._id.toString();

      User.findById(userId)
        .then((user) => {
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }

          req.user = user;

          next();
        })
        .catch((err) => next(err));
    });
  };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
//router client
app.use("/client", protection("client"), clientRouter);

// router admin
app.use("/admin", protection("admin"), adminRouter);

app.post(
  "/products/add",
  protection("admin"),
  upload.array("image", 5),
  adminController.postAddProduct
);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
// middleware xữ lý lỗi
app.use((req, res, next) => {
  res.status(404).json({ message: "API Not Found" });
});

//middleware xữ lý lỗi 500
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: "sever error" });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
////Tạo text index cho trường cần tìm kiếm (text index) là một cơ chế cải thiện hiệu suất cho việc tìm kiếm văn bản trong cơ sở dữ liệu.
// Khi bạn thực hiện tìm kiếm văn bản trong một trường mà không có text index, MongoDB sẽ phải quét toàn bộ dữ liệu trong trường đó để tìm các giá trị khớp với từ khoá tìm kiếm.
const createTextIndex = async () => {
  try {
    //Kết nối tới cơ sở dữ liệu MongoDB và lưu trữ kết nối trong biến client. Hàm mongoose.connect trả về một kết nối MongoDB.
    const client = await mongoose.connect(MONGODB_URI);

    //const db = client.connection.db;: Lấy cơ sở dữ liệu từ kết nối MongoDB đã tạo.
    const db = client.connection.db;

    // Sử dụng phương thức createIndex để tạo text index cho trường "name" trong bộ sưu tập "products" trong cơ sở dữ liệu.
    await db.collection("products").createIndex({ name: "text" });
    console.log('Text index for "name" field created successfully.');
  } catch (error) {
    console.error("Error creating text index:", error);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
//
mongoose
  .connect(MONGODB_URI)
  //đặt tạo text index ở tệp chạy ứng dụng là vì nó là một nhiệm vụ cấu hình cơ sở dữ liệu và chỉ cần thực hiện một lần khi ứng dụng bắt đầu chạy.
  .then(() => createTextIndex())
  .then((result) => app.listen(5000))
  .catch((error) => console.log(error));
