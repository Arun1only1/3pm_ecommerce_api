import express from "express";
import { dbConnect } from "./db.connection.js";
import userRoutes from "./user/user.route.js";
import productRoutes from "./product/product.route.js";
import cors from "cors";
const app = express();

app.use(cors({ origin: "*" }));
// to make app understand json
app.use(express.json());

// db connection
await dbConnect();

// register routes
app.use(userRoutes);
app.use(productRoutes);

// allow cors
// CORS => Cross Origin Resource Sharing

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
