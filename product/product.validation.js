import Joi from "joi";

export const addProductValidationSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(55),
  company: Joi.string().required().trim().min(2).max(55),
  price: Joi.number().required().min(0),
  category: Joi.string()
    .required()
    .trim()
    .valid(
      "grocery",
      "kitchen",
      "clothing",
      "electronics",
      "furniture",
      "bakery",
      "liquor"
    ),
  freeShipping: Joi.boolean(),
  quantity: Joi.number().required().min(1).integer(),
  color: Joi.array().items(Joi.string().lowercase()),
});
