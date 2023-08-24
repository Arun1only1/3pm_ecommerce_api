import jwt from "jsonwebtoken";
import { User } from "../user/user.model.js";

export const isSeller = async (req, res, next) => {
  try {
    // extract token from headers
    const authorization = req?.headers?.authorization;
    const splittedArray = authorization?.split(" ");
    const token = splittedArray?.length === 2 && splittedArray[1];

    // if not token, terminate
    if (!token) {
      throw new Error("Unauthorized.");
    }

    // decrypt token using jwt.verify(token, secret_key)
    const userData = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);

    // find user from email decrypted from token
    const user = await User.findOne({ email: userData.email });

    // if not user, terminate
    if (!user) {
      throw new Error("Unauthorized.");
    }

    // if user role is not seller, terminate
    if (user.role !== "seller") {
      throw new Error("Unauthorized.");
    }

    // add user to req.userInfo
    req.userInfo = user;

    // call next function
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized." });
  }
};

export const isBuyer = async (req, res, next) => {
  try {
    // extract token from headers
    const authorization = req?.headers?.authorization;
    const splittedArray = authorization?.split(" ");
    const token = splittedArray?.length === 2 && splittedArray[1];

    // if not token, terminate
    if (!token) {
      throw new Error("Unauthorized.");
    }

    // decrypt token using jwt.verify(token, secret_key)
    const userData = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);

    // find user from email decrypted from token
    const user = await User.findOne({ email: userData.email });

    // if not user, terminate
    if (!user) {
      throw new Error("Unauthorized.");
    }

    // if user role is not seller, terminate
    if (user.role !== "buyer") {
      throw new Error("Unauthorized.");
    }

    // add user to req.userInfo
    req.userInfo = user;

    // call next function
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized." });
  }
};
