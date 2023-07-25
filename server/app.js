const express = require("express");
const app = express();
const cors = require("cors");
//moongoose
const mongoose = require("mongoose");

// express-session: Đây là mô-đun chịu trách nhiệm quản lý session trong ứng dụng Express.
// Nó cung cấp middleware để tạo và quản lý dữ liệu session.
const session = require("express-session");

//connect-mongodb-session: Đây là một thư viện cung cấp một cơ chế lưu trữ session cho express-session sử dụng MongoDB.
const MongoDBStore = require("connect-mongodb-session")(session);

//Thư viện csurf (Cross-Site Request Forgery) được sử dụng để bảo vệ ứng dụng web khỏi tấn công CSRF.
const csrf = require("csurf");

//Thư viện connect-flash được sử dụng trong các ứng dụng web Node.js để hiển thị thông báo tạm thời (flash messages) cho người dùng
const flash = require("connect-flash");

//router auth
const authRouter = require("./router/auth");

//router shop
const shopRouter = require("./router/shop");

const MONGODB_URI =
  "mongodb+srv://dungtien2510:Dung25101997@cluster0.jyqoacf.mongodb.net/shop";

//chúng ta tạo một đối tượng mới của MongoDBStore bằng từ khóa new
//và truyền một đối tượng cấu hình cho nó.
// MongoDBStore là một cơ chế lưu trữ session sử dụng MongoDB.
const store = new MongoDBStore({
  //uri: Thuộc tính này được đặt là MONGODB_URI,
  // mô tả chuỗi kết nối đến cơ sở dữ liệu MongoDB mà dữ liệu session sẽ được lưu trữ.
  uri: MONGODB_URI,
  //collection: Thuộc tính này xác định tên bảng (collection) trong cơ sở dữ liệu MongoDB mà dữ liệu session sẽ được lưu trữ.
  //Trong trường hợp này, nó được đặt là "sessions".
  collection: "sessions",
});

app.use(
  session({
    //Đây là chuỗi bí mật (secret) được sử dụng để mã hóa dữ liệu session trước khi lưu trữ nó vào cookie.
    secret: "my secret",

    //resave: Thuộc tính này quy định liệu session có được lưu lại vào cơ sở dữ liệu sau mỗi lần yêu cầu hay không.
    resave: false,

    //saveUninitialized: Thuộc tính này xác định liệu session sẽ được lưu lại vào cơ sở dữ liệu ngay cả khi nó chưa được sử dụng hay không.
    saveUninitialized: false,
    store: store,

    // thời gian cookie bị xóa
    cookie: { maxAge: 60000 * 60 },
  })
);

//app.use(csrf()): Dòng này khai báo việc sử dụng middleware csurf trong ứng dụng Express. Middleware csurf sẽ xử lý việc tạo và kiểm tra mã CSRF (CSRF token) cho các yêu cầu POST, PUT và DELETE.
// app.use(csrf());

// Sử dụng connect-flash middleware
app.use(flash());

// app.use((req, res, next) => {
//   //res.locals là một đối tượng trong Express.js dùng để lưu trữ các biến cục bộ (local variables) trong quá trình xử lý yêu cầu và trả về đến các view template. Biến cục bộ là các biến chỉ tồn tại trong phạm vi của một yêu cầu cụ thể và chỉ có thể truy cập từ trong route hoặc từ view template được render cho yêu cầu đó.
//   res.locals.isAuthenticated = req.session.isLoggedIn;

//   //res.locals.csrfToken = req.csrfToken(): Dòng này thêm một biến csrfToken vào đối tượng res.locals, đảm bảo mã CSRF sẽ được truyền vào view template và có thể được sử dụng trong các yêu cầu POST, PUT và DELETE.
//   //req.csrfToken(): Đây là một phương thức của middleware csurf để tạo mã CSRF (CSRF token) cho yêu cầu hiện tại. Mã CSRF này sẽ được sử dụng để xác thực các yêu cầu POST, PUT và DELETE và ngăn chặn tấn công CSRF.
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });

app.use(cors());

//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//router shopRouter
app.use("/shop", shopRouter);

//router auth
app.use("/auth", authRouter);

mongoose
  .connect(MONGODB_URI)
  .then((result) => app.listen(5000))
  .catch((error) => console.log(error));
