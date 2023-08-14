exports.postOrder = async (req, res, next) => {
  try {
    const { fullName, email, address, phoneNumber } = req.body;
    const products = req.user.cart.items;
    const dateBook = new Date();
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        errorMessage: errors.array()[0].msg,
        oldInput: { email, phoneNumber, dateBook, address, fullName },
        validationErrors: errors.array(),
      });
    }

    const order = new Order({
      products,
      status: "unconfirmed",
      dateBook,
      user: {
        email,
        fullName,
        phoneNumber,
        address,
        userId: req.user._id,
      },
    });

    const savedOrder = await order.save();

    // Send order confirmation email
    await sendOrderConfirmationEmail(email, fullName, address, products);

    // Clear user's cart after successful order
    await req.user.clearCart();

    return res.status(200).json({
      message: "Order saved successfully",
      result: savedOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errorMessage: "An error occurred" });
  }
};

async function sendOrderConfirmationEmail(email, fullName, address, products) {
  try {
    const transporter = nodemailer.createTransport({
      // Configure your email transporter here
    });

    const htmlContent = await generateOrderEmailContent(
      fullName,
      address,
      products
    );

    await transporter.sendMail({
      from: "dungptfx19575@funix.edu.vn",
      to: email,
      subject: "Order successfully created",
      html: htmlContent,
    });
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw error;
  }
}

async function generateOrderEmailContent(fullName, address, products) {
  try {
    const productDetails = await fetchProductDetails(products);
    const htmlfilePath = path.join(__dirname, "../unit", "template.html");
    const htmlContent = await fs.readFile(htmlfilePath, "utf8");

    const orderData = {
      fullName,
      address,
      products: productDetails,
    };

    return mustache.render(htmlContent, orderData);
  } catch (error) {
    console.error("Error generating order email content:", error);
    throw error;
  }
}

async function fetchProductDetails(products) {
  try {
    const productIds = products.map((product) => product.productId);
    const productsOrder = await Product.find({ _id: { $in: productIds } });

    return productsOrder.map((product) => {
      const cartProduct = products.find((p) => p.productId === product._id);
      return {
        name: product.name,
        photos: product.photos,
        price: product.price,
        quantity: cartProduct.quantity,
        total: product.price * cartProduct.quantity,
      };
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
}
