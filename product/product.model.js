import mongoose from "mongoose";

// set rule/schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 55,
  },
  company: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 55,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  category: {
    type: String,
    required: true,
    trim: true,
    enum: [
      "grocery",
      "kitchen",
      "clothing",
      "electronics",
      "furniture",
      "bakery",
      "liquor",
    ],
  },

  freeShipping: {
    type: Boolean,
    default: false,
  },

  sellerId: {
    type: mongoose.ObjectId,
    required: true,
    ref: "User",
  },
  quantity: {
    type: Number,
    min: 0,
    required: true,
  },

  color: {
    type: [String],
    required: false,
  },

  inStock: {
    type: Boolean,
    default: true,
  },
});

// create table/model

export const Product = mongoose.model("Product", productSchema);
