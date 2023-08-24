import express from "express";
import { isSeller } from "../auth/auth.middleware.js";
import { Product } from "./product.model.js";
import { addProductValidationSchema } from "./product.validation.js";

const router = express.Router();

// add product
router.post("/product/add", isSeller, async (req, res) => {
  //   extract product from req.body
  const newProduct = req.body;

  //   validate product using Joi
  try {
    await addProductValidationSchema.validateAsync(newProduct);
  } catch (error) {
    //   if validation fail, terminate
    return res.status(400).send({ message: error.message });
  }

  //   add seller id
  newProduct.sellerId = req.userInfo._id;

  // create new product
  await Product.create(newProduct);

  // send response
  return res.status(201).send({ message: "Product is added successfully." });
});

export default router;
