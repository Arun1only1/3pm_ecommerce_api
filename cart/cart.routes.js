import express from "express";
import { isBuyer } from "../auth/auth.middleware.js";
import {
  quantityValidationSchema,
  updateQuantityValidationSchema,
} from "./cart.validation.js";
import { Product } from "../product/product.model.js";
import mongoose from "mongoose";
import { Cart } from "./cart.model.js";

const router = express.Router();

// add item to cart
router.post("/cart/add/:id", isBuyer, async (req, res) => {
  const productId = req.params.id;
  const ownerId = req.loggedInUser._id;

  const quantityData = req.body;

  //   validate quantity data
  try {
    await quantityValidationSchema.validate(quantityData);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  //  validate productId
  const isValidMongoId = mongoose.Types.ObjectId.isValid(productId);

  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // check for product existence for this productId
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  const cart = await Cart.findOne({
    ownerId,
    "productList.productId": productId,
  });

  // update quantity of that productId
  if (cart) {
    await Cart.updateOne(
      { ownerId, "productList.productId": productId },
      {
        $inc: {
          "productList.$.quantity": quantityData.quantity,
        },
      }
    );
  } else {
    // push that product to cart
    await Cart.updateOne(
      { ownerId: ownerId },
      {
        $push: {
          productList: {
            productId: productId,
            quantity: quantityData.quantity,
          },
        },
      },
      {
        upsert: true,
      }
    );
  }

  return res
    .status(200)
    .send({ message: "Item is added to cart successfully." });
});

// count cart items
router.get("/cart/count", isBuyer, async (req, res) => {
  const ownerId = req.loggedInUser._id;

  const cart = await Cart.findOne({ ownerId });

  let count = 0;

  if (!cart) {
    count = 0;
  }

  count = cart?.productList.length || 0;

  return res.status(200).send({ count });
});

// get cart data
router.get("/cart/data", isBuyer, async (req, res) => {
  const ownerId = req.loggedInUser._id;

  const cartData = await Cart.aggregate([
    {
      $match: {
        ownerId: ownerId,
      },
    },
    {
      $unwind: "$productList",
    },
    {
      $lookup: {
        from: "products",
        localField: "productList.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $project: {
        _id: 0,
        productId: "$productList.productId",
        orderQuantity: "$productList.quantity",
        availableQuantity: { $first: "$productDetails.quantity" },
        image: { $first: "$productDetails.image" },
        name: { $first: "$productDetails.name" },
        brand: { $first: "$productDetails.company" },
        price: { $first: "$productDetails.price" },
      },
    },
    {
      $project: {
        productId: 1,
        orderQuantity: 1,
        image: 1,
        availableQuantity: 1,
        name: 1,
        brand: 1,
        price: 1,
        total: { $multiply: ["$price", "$orderQuantity"] },
      },
    },
  ]);

  let subTotal = 0;
  cartData.forEach((item) => {
    subTotal = subTotal + item.total;
  });

  // fixed subTotal to 2 decimal places
  subTotal = subTotal.toFixed(2);
  // discount => 5%
  const grandTotal = (0.95 * subTotal).toFixed(2);

  return res.status(200).send({ cartData, subTotal, grandTotal });
});

// remove item from cart
router.put("/cart/remove-item/:id", isBuyer, async (req, res) => {
  const productId = req.params.id;
  const ownerId = req.loggedInUser._id;

  // validate productId
  const isValidProductId = mongoose.Types.ObjectId.isValid(productId);

  if (!isValidProductId) {
    return res.status(400).send({ message: "Invalid product id." });
  }

  // check for product existence for this productId
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // remove item from cart
  await Cart.updateOne(
    {
      ownerId: ownerId,
    },
    {
      $pull: {
        productList: {
          productId: productId,
        },
      },
    }
  );

  return res
    .status(200)
    .send({ message: "Item is removed from cart successfully." });
});

// update item quantity
router.put("/cart/update/quantity/:id", isBuyer, async (req, res) => {
  const productId = req.params.id;
  const ownerId = req.loggedInUser._id;
  const optionData = req.body;

  // validate option data
  try {
    await updateQuantityValidationSchema.validate(optionData);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  // validate product Id
  // validate productId
  const isValidProductId = mongoose.Types.ObjectId.isValid(productId);

  if (!isValidProductId) {
    return res.status(400).send({ message: "Invalid product id." });
  }

  // check product available quantity
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // product available quantity
  const availableProductQuantity = product.quantity;

  // find product order quantity from cart
  const cart = await Cart.findOne({ ownerId: ownerId });

  if (!cart) {
    return res.status(403).send({ message: "Something went wrong." });
  }

  const matchedCartProduct = cart.productList.filter((item) => {
    return String(item.productId) === productId;
  });

  const oldOrderQuantity = matchedCartProduct[0].quantity;

  let newOrderQuantity;

  if (optionData.option === "increase") {
    newOrderQuantity = oldOrderQuantity + 1;
  }

  if (optionData.option === "decrease") {
    newOrderQuantity = oldOrderQuantity - 1;
  }

  if (newOrderQuantity > availableProductQuantity) {
    return res.status(403).send({
      message: "Order quantity cannot be greater than available quantity.",
    });
  }

  if (newOrderQuantity < 1) {
    return res
      .status(403)
      .send({ message: "Order quantity cannot be less than 1." });
  }

  // update product quantity
  await Cart.updateOne(
    {
      ownerId: ownerId,
      "productList.productId": productId,
    },
    {
      $inc: {
        "productList.$.quantity": optionData.option === "increase" ? 1 : -1,
      },
    }
  );

  return res
    .status(200)
    .send({ message: "Item quantity is updated successfully." });
});
export default router;
