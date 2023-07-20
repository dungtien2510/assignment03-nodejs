const express = require("express");
const app = express();
const cors = require("cors");
//moongoose
const mongoose = require("mongoose");

// session
const session = require("session");

const MongoDBStore = require("connect-mongodb-session")(session);

const MONGODB_URI =
  "mongodb+srv://dungtien2510:Dung2501997@cluster0.jyqoacf.mongodb.net/shop";

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.use(cors());

//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
  .connect(MONGODB_URI)
  .then((result) => app.listen(5000))
  .catch((error) => console.log(error));
