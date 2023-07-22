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

const MONGODB_URI =
  "mongodb+srv://dungtien2510:Dung2501997@cluster0.jyqoacf.mongodb.net/shop";

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
    cookie: { maxAge: 60000 * 60, expires },
  })
);

app.use(cors());

//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//router auth

mongoose
  .connect(MONGODB_URI)
  .then((result) => app.listen(5000))
  .catch((error) => console.log(error));
