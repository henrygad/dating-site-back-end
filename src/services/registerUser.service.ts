import { generateUsernameFromEmail } from "src/helper/generateUsernameFromEmail.helper";
import { createCustomError } from "src/middlewares/error.middleware";
import User from "src/models/user.model";


type registerProps = { email: string, confirmPassword: string };

const registerUser = async (body: registerProps) => { 
    const { email, confirmPassword } = body;;
    
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
    
    
    return user;
};

export default registerUser;