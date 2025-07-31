import { catchAsyncErrorHandler, createCustomError } from "src/middlewares/error.middleware";
import User from "src/models/user.model";
import generateToken from "src/utils/generateToken";
import { Request, Response } from "express";
import { generateUsernameFromEmail } from "src/helper/generateUsernameFromEmail";

// Local Register new user
export const register = catchAsyncErrorHandler(async (req, res) => {
  const { email, _password, confirmPassword } = req.body;

  let user = null;

  user = await User.findOne({ email });

  // Check if this is an existing user 
  if (user) throw createCustomError({ statusCode: 401, message: "There is an account with this email already. Please Try login with this email instead." });


  // Create new user
  user = new User({
    email,
    passwordHash: confirmPassword,
    username: generateUsernameFromEmail(email)
  });
  // Save changes 
  user = await user.save();
  if (!user) throw createCustomError({ statusCode: 500, message: "Failed to create user" });

  // Send a welcome mail to new user

  // Send Verification OTP mail to user

  // Update emailVerificationToken and emailVerificationTokenExpiringdate,

  // and save changes to db  

  res.json({
    success: true,
    message: "New user have be successfully create. User can now login with his/her login credentials",
    loginEndPoint: "/api/auth/login",
    email: user.email,
  });
});

// Local login 
export const localLogin = catchAsyncErrorHandler(async (req, res) => {
  const { identity, password } = req.body;

  // Find user by username or email
  const user = await User.findOne({
    $or: [{ username: identity }, { email: identity }],
  });

  // If user does not exist either by username or email, then
  if (!user) throw createCustomError({ statusCode: 401, message: "Identity: Invalid credentials" });

  // Compare incoming password with hashed password
  const isMatch = await user.isValidPassword(password);
  if (!isMatch) throw createCustomError({ statusCode: 401, message: "Password: Invalid credentials", });

  // Generate a jwt user token
  const token = generateToken(String(user._id));

  res.json({
    success: true,
    message: `Welcome back ${user.firstName || user.username || identity}. You've successfully login into your account`,
    token,
  });

});

// Logout
export const logout = (req: Request, res: Response) => {
  // Remove the req.user property
  req.user = undefined;
  res.json({
    success: true,
    message: "You've successfully logout from your account!",
    user: req.user
  });
};

