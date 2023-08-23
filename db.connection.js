import mongoose from "mongoose";

export const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB Connection: OK");
  } catch (error) {
    console.log("DB Connection:Failed");
    console.log(error.message);
  }
};
