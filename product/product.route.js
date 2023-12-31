import express from "express";
import { isBuyer, isSeller, isUser } from "../auth/auth.middleware.js";
import { Product } from "./product.model.js";
import {
  addProductValidationSchema,
  buyerProductListValidationSchema,
  paginationDetailValidationSchema,
} from "./product.validation.js";
import mongoose from "mongoose";

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
  newProduct.sellerId = req.loggedInUser._id;

  // create new product
  await Product.create(newProduct);

  // send response
  return res.status(201).send({ message: "Product is added successfully." });
});

// delete product
router.delete("/product/delete/:id", isSeller, async (req, res) => {
  // extract id from params
  const productId = req.params.id;

  // validate id for mongo id validity
  const isValidMongoId = mongoose.Types.ObjectId.isValid(productId);

  // if not valid mongo id, terminate
  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // find product
  const product = await Product.findOne({ _id: productId });

  // if, not product, terminate

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // check for product ownership
  // loggedInUser id must match with product's sellerId
  const isOwnerOfProduct = product.sellerId.equals(req.loggedInUser._id);

  // if no match, not allowed to delete
  if (!isOwnerOfProduct) {
    return res
      .status(403)
      .send({ message: "You are not owner of this product." });
  }

  // delete product
  await Product.deleteOne({ _id: productId });

  // send response
  return res.status(200).send({ message: "Product deleted successfully." });
});

// get product details
router.get("/product/details/:id", isUser, async (req, res) => {
  // extract id from params
  const productId = req.params.id;

  // check for mongo id validity
  const isValidMongoId = mongoose.Types.ObjectId.isValid(productId);

  // if not valid, terminate
  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // find product
  const product = await Product.findOne({ _id: productId });

  // if not product, terminate
  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // return product
  return res.status(200).send(product);
});

// get products
// seller point of view
router.post("/product/seller/all", isSeller, async (req, res) => {
  // extract pagination details from req.body
  const paginationDetails = req.body;

  //validate pagination details
  try {
    await paginationDetailValidationSchema.validateAsync(paginationDetails);
  } catch (error) {
    // if not valid, terminate
    return res.status(400).send({ message: error.message });
  }

  // calculate skip
  const skip = (paginationDetails.page - 1) * paginationDetails.limit;

  // extract searchText
  const searchText = paginationDetails?.searchText;

  let match = {};

  match.sellerId = req.loggedInUser._id;

  if (searchText) {
    match.name = { $regex: searchText, $options: "i" };
  }

  // start find query
  const products = await Product.aggregate([
    {
      $match: match,
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: paginationDetails.limit,
    },
    {
      $project: {
        name: 1,
        price: 1,
        company: 1,
        description: 1,
        category: 1,
        image: 1,
      },
    },
  ]);

  // total products
  const totalMatchingProduct = await Product.find({
    sellerId: req.loggedInUser._id,
  }).count();

  // page calculation
  const totalPage = Math.ceil(totalMatchingProduct / paginationDetails.limit);

  return res.status(200).send({ products, totalPage });
});

// get products
// buyer point of view
router.post("/product/buyer/all", isBuyer, async (req, res) => {
  // extract pagination details from req.body
  const input = req.body;

  //validate pagination details
  try {
    await buyerProductListValidationSchema.validateAsync(input);
  } catch (error) {
    // if not valid, terminate
    return res.status(400).send({ message: error.message });
  }

  // calculate skip
  // skip=(page-1)* limit
  const skip = (input.page - 1) * input.limit;

  // extract searchText
  let searchText = input?.searchText;
  let minPrice = input?.minPrice;
  let maxPrice = input?.maxPrice;
  let category = input?.category;

  let match = {};

  if (searchText) {
    match.name = { $regex: searchText, $options: "i" };
  }

  if (minPrice) {
    match.price = { $gte: minPrice };
  }

  if (maxPrice) {
    match.price = { ...match.price, $lte: maxPrice };
  }

  if (category?.length > 0) {
    match.category = { $in: category };
  }

  const products = await Product.aggregate([
    {
      $match: match,
    },
    {
      $skip: skip,
    },
    {
      $limit: input.limit,
    },
    {
      $project: {
        name: 1,
        price: 1,
        company: 1,
        description: 1,
        image: 1,
      },
    },
  ]);

  // calculate total page
  const totalProducts = await Product.find(match).count();

  const totalPage = Math.ceil(totalProducts / input.limit);

  return res.status(200).send({ products, totalPage });
});

// edit product
router.put("/product/edit/:id", isSeller, async (req, res) => {
  const productId = req.params.id;
  const newValues = req.body;

  // validate id for mongo id validity
  const isValidMongoId = mongoose.Types.ObjectId.isValid(productId);

  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // validate newValues from req.body

  try {
    await addProductValidationSchema.validateAsync(newValues);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  // check for product existence using productId
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // check if logged in user is owner of product
  const isOwnerOfProduct = product.sellerId.equals(req.loggedInUser._id);

  if (!isOwnerOfProduct) {
    return res
      .status(403)
      .send({ message: "You are not owner of this product." });
  }

  // update product
  await Product.updateOne({ _id: productId }, newValues);

  return res.status(200).send({ message: "Product updated successfully." });
});

// get latest 6 products
router.get("/product/latest", isUser, async (req, res) => {
  const products = await Product.aggregate([
    { $match: {} },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 6,
    },
    {
      $project: {
        name: 1,
        description: 1,
        company: 1,
        price: 1,
        image: 1,
      },
    },
  ]);

  return res.status(200).send(products);
});
export default router;
