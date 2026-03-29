import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import UserPreference from "../models/userPreferences.model";

//GENERATE JWT TOKEN

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "300" },
  );
};

//REGISTER NEW USER
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    //VALIDATION
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password and name",
      });
    }

    //CHECK IF USER EXISTS
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    //CREATE USER
    const user = await User.create({ email, password, name });

    //CREATE DEFAULT PREFERENCES
    await UserPreference.upsert(user.id, {
      dietary_restrictions: [],
      allergies: [],
      preferred_cuisines: [],
      default_servings: 4,
      measurement_unit: "metric",
    });

    //GENERATE TOKEN
    const token = generateToken(User);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*LOGIN FUNCTION*/
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }
    //finding the user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //verify password
    const isPasswordValid = await User.verifyPassword(
      password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
