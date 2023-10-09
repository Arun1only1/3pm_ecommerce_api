import mongoose from "mongoose";

// set rule for product list
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

// set rule for cart
const cartSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.ObjectId,
    ref: "User",
    required: true,
  },

  productList: {
    type: [cartItemSchema],
  },
});

// create model
export const Cart = mongoose.model("Cart", cartSchema);
