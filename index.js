import express from "express";
import { dbConnect } from "./db.connection.js";
import userRoutes from "./user/user.route.js";
import productRoutes from "./product/product.route.js";

const app = express();
// to make app understand json
app.use(express.json());

// db connection
dbConnect();

// register routes
app.use(userRoutes);
app.use(productRoutes);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
