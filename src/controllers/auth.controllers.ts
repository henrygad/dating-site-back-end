import { catchAsyncErrorHandler } from "src/middlewares/error.middleware";
import { Request, Response } from "express";
import registerUser from "src/services/registerUser.service";
import localLoginUser from "src/services/localLoginUser.service";
import logoutUser from "src/services/logoutUser.service";

// Local Register new user
export const register = catchAsyncErrorHandler(async (req, res) => {
  const user = await registerUser(req.body);
  res.json({
    success: true,
    message: "New user have be successfully create. User can now login with his/her login credentials",
    loginEndPoint: "/api/auth/login",
    email: user.email,
  });
});

// Local login 
export const localLogin = catchAsyncErrorHandler(async (req, res) => {
  const {token, user} = await localLoginUser(req.body);
  res.json({
    success: true,
    message: `Welcome back ${user.firstName || user.username}. You've successfully login into your account`,
    token,
  });

});

// Logout
export const logout = (req: Request, res: Response) => {
  logoutUser(req);

  res.json({
    success: true,
    message: "You've successfully logout from your account!",
    user: req.user
  });
};

