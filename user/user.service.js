import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./user.model.js";
import {
  loginUserValidationSchema,
  registerUserValidationSchema,
} from "./user.validation.js";

//* register user
export const registerUser = async (req, res) => {
  // extract userData from req.body
  const newUser = req.body;

  // validate userData with Joi
  try {
    await registerUserValidationSchema.validateAsync(newUser);
  } catch (error) {
    // if validation fails,terminate
    return res.status(400).send({ message: error.message });
  }

  // check if user email is already used
  const user = await User.findOne({ email: newUser.email });

  // if already used email,terminate
  if (user) {
    return res
      .status(409)
      .send({ message: "User with this email already exists." });
  }

  // hash password using bcrypt.hash()
  const hashedPassword = await bcrypt.hash(newUser.password, 10);

  //   replace req.body.password/newUser.password with hashedPassword
  newUser.password = hashedPassword;

  // create user on db
  await User.create(newUser);

  // return response
  return res.status(201).send({ message: "User is registered successfully." });
};

// * login user
export const loginUser = async (req, res) => {
  // extract login credentials from req.body
  const loginCredentials = req.body;

  // validate login credentials
  try {
    await loginUserValidationSchema.validateAsync(loginCredentials);
  } catch (error) {
    // if validation fails, terminate
    return res.status(400).send({ message: error.message });
  }

  // check if user with provided email exists
  const user = await User.findOne({ email: loginCredentials.email });

  // is not user, terminate
  if (!user) {
    return res.status(404).send({ message: "Invalid credentials." });
  }

  // check for password match using bcrypt.compare()
  const passwordMatch = await bcrypt.compare(
    loginCredentials.password, //plain_password
    user.password //hashed_password
  );

  // if not password match, terminate
  if (!passwordMatch) {
    return res.status(404).send({ message: "Invalid credentials." });
  }

  // encrypt user information as a token using jsonwebtoken, jwt.sign(token,secret_key)
  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
    {
      expiresIn: "1d",
    }
  );

  //   hide user password
  user.password = undefined;

  //   return user and token as response
  return res.status(200).send({ user, token });
};
