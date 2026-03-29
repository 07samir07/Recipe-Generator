import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";

//import routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

const app = express();

//MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//TEST ROUTE
app.get("/", (req, res) => {
  res.json({ message: "AI Recipe Generator API" });
});

//api routes
app.use("api/auth", authRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
