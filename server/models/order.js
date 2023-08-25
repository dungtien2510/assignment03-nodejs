const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: {
    type: Array,

    //kiểm tra array có product không
    validate: {
      validator: function (arr) {
        // Kiểm tra mảng có ít nhất 1 phần tử
        return arr.length >= 1;
      },
      message: "Products array must contain at least one element.",
    },
    required: true,
  },
  status: { type: String, required: true },
  dateBook: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  user: {
    email: {
      type: String,
      required: true,
    },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
});

module.exports = mongoose.model("Order", orderSchema);
