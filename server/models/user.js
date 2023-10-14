const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  fullName: {
    type: String,
    required: true,
  },
  role: { type: String, required: true },
  roomId: [{ type: Schema.Types.ObjectId }],
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
});

//addToCart
userSchema.methods.addToCart = async function (product, quantityProduct) {
  try {
    // Đầu tiên, phương thức này tìm kiếm sản phẩm có cùng productId với sản phẩm được cung cấp trong giỏ hàng hiện tại (this.cart.items) bằng cách sử dụng findIndex.
    const cartProductIndex = this.cart.items.findIndex((cp) => {
      return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = Number(quantityProduct);
    const updatedCartItems = [...this.cart.items];

    //Nếu sản phẩm đã tồn tại (cartProductIndex >= 0), phương thức sẽ tăng số lượng của sản phẩm lên 1.
    if (cartProductIndex >= 0) {
      newQuantity = this.cart.items[cartProductIndex].quantity + newQuantity;

      //nếu quantityProduct được gửi đến là 1 số âm (trừ đi số lượng products đã đặt) và newQuantity =0 thì sẽ xóa luôn sản phầm đó trong giỏ hàng
      if (!newQuantity) {
        updatedCartItems.splice(cartProductIndex, 1);
      } else if (newQuantity < 0) {
        throw new Error("Invalid quantity Product!");
      } else {
        updatedCartItems[cartProductIndex].quantity = newQuantity;
      }
    } else {
      // newQuantity < 0 return error
      if (newQuantity < 0) {
        console.log("eror");
        throw new Error("Invalid quantity Product!");
      }

      //Nếu sản phẩm chưa có trong giỏ hàng, nó sẽ được thêm vào danh sách updatedCartItems với số lượng là 1.
      updatedCartItems.push({
        productId: product._id,
        quantity: newQuantity,
      });
    }

    //Cuối cùng, danh sách giỏ hàng (this.cart) sẽ được cập nhật với updatedCartItems và mô hình người dùng sẽ được lưu lại vào cơ sở dữ liệu thông qua this.save().
    this.cart = {
      items: updatedCartItems,
    };
    const result = await this.save();
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

//remove cart
userSchema.methods.removeFromCart = async function (productId) {
  //Phương thức này sử dụng filter để tạo danh sách mới updatedCartItems, bỏ qua sản phẩm có productId trùng với productId được cung cấp (để loại bỏ sản phẩm này khỏi giỏ hàng).
  try {
    const product = this.cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!product) {
      throw new Error("Product not found");
    }
    const updatedCartItems = this.cart.items.filter((item) => {
      return item.productId.toString() !== productId.toString();
    });

    //Sau đó, danh sách giỏ hàng (this.cart) sẽ được cập nhật với updatedCartItems và mô hình người dùng sẽ được lưu lại vào cơ sở dữ liệu thông qua this.save().
    this.cart.items = updatedCartItems;
    const result = await this.save();
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

//clearCart
//Phương thức này đơn giản chỉ cập nhật giỏ hàng (this.cart) thành một đối tượng rỗng với thuộc tính items là một mảng trống, để xóa toàn bộ sản phẩm trong giỏ hàng.
//Sau đó, mô hình người dùng sẽ được lưu lại vào cơ sở dữ liệu thông qua this.save().
userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

userSchema.methods.addRoomId = async function (roomId) {
  try {
    this.roomId = [roomId];
    const result = await this.save();
  } catch (err) {
    throw new Error(err);
  }
};
module.exports = mongoose.model("User", userSchema);
