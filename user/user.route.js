import express from "express";
import { registerUser, loginUser } from "./user.service.js";
import { isUser } from "../auth/auth.middleware.js";
import { updateUserValidationSchema } from "./user.validation.js";
import { User } from "./user.model.js";
import bcrypt from "bcrypt";
import { Product } from "../product/product.model.js";

const router = express.Router();

// register user
router.post("/user/register", registerUser);

// login user
router.post("/user/login", loginUser);

// edit user data
// password
// firstName
// lastName
// location
// gender
router.put("/user/edit", isUser, async (req, res) => {
  // extract new values from req.body
  const updatedValues = req.body;

  // validate new values
  try {
    await updateUserValidationSchema.validateAsync(updatedValues);
  } catch (error) {
    // if validation fails, terminate
    return res.status(400).send({ message: error.message });
  }

  // extract logged in user id from req.loggedInUser._id
  const userId = req.loggedInUser._id;

  //   hashPassword
  const hashedPassword = await bcrypt.hash(updatedValues.password, 10);

  //   update user data
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        password: hashedPassword,
        gender: updatedValues.gender,
        firstName: updatedValues.firstName,
        lastName: updatedValues.lastName,
        location: updatedValues.location,
      },
    }
  );

  // return res
  return res.status(200).send({ message: "Profile is updated successfully." });
});

// delete own account
router.delete("/user/delete/account", isUser, async (req, res) => {
  // before removing user, remove all  associated data with that user
  //   delete all products if user is seller
  const user = req.loggedInUser;

  if (user.role === "seller") {
    // delete all products created by that seller
    await Product.deleteMany({ sellerId: user._id });
  }

  // delete user
  await User.deleteOne({ _id: user._id });

  return res
    .status(200)
    .send({ message: "You account has been permanently deleted." });
});
export default router;
