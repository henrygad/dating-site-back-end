import { createCustomError } from "src/middlewares/error.middleware";
import User from "src/models/user.model";
import generateToken from "src/utils/generateToken.util";

type localLoginUserProps = { identity: string, password: string };

const localLoginUser = async (body: localLoginUserProps) => { 
    const { identity, password } = body;
    
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
    

    return {token, user};
};

export default localLoginUser;
