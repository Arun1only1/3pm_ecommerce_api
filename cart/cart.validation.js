import * as Yup from "yup";

export const quantityValidationSchema = Yup.object({
  quantity: Yup.number()
    .required()
    .min(1, "Quantity must be at least one.")
    .integer(),
});

export const updateQuantityValidationSchema = Yup.object({
  option: Yup.string().oneOf[("increase", "decrease")],
});
