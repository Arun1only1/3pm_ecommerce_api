import { randomBytes } from "crypto";

const generateRandomString = (strLength) => {
  const randomString = randomBytes(strLength).toString("hex");

  console.log(randomString);
};

generateRandomString(20);

export const convertDollarToCents = (dollar) => dollar * 100;

export const convertCentsToDollar = (cents) => cents / 100;
