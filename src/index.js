import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    const port = process.env.PORT || 2000;
    app.listen(port, () => console.log(`App is running on port: ${port}`));
  })
  .catch((error) => console.log("Error in database:" + error));
