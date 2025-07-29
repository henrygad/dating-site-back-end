import { HydratedDocument, model, Schema, Types } from "mongoose";
import userTypes from "src/types/user.type";
import bcrypt from "bcryptjs";

// User types
export type IUser = HydratedDocument<userTypes>; //Document & userTypes 

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    passwordHash: String,
    dateOfBirth: Date,
    gender: String,
    lookingFor: [String],
    location: {
        city: String,
        country: String,
    },
    bio: String,
    interests: [String],
    profilePhotos: [String],
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date,
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    preferences: {
        ageRange: {
            min: Number,
            max: Number
        },
        distance: Number
    },
    likesSent: [{ type: Types.ObjectId, ref: "User" }],
    likesReceived: [{ type: Types.ObjectId, ref: "User" }],
    matches: [{ type: Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: Types.ObjectId, ref: "User" }],
    reportedUsers: [{ type: Types.ObjectId, ref: "User" }],
    accountStatus: { type: String, default: "active" },
    emailVerificationToken: String,
    emailVerificationTokenExpiringdate: Number,    
});

const User = model<IUser>("User", userSchema);

// On document save to db, do
userSchema.pre<IUser>("save", async function (next) {
    // Hash and save password on the go 
    if (this.isModified("passwordHash")) {
        this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    };
    
    next();
});

// Create helpfull method to doc

// 1) A method that save changes made on user data 
userSchema.methods.saveChanges = async function () {
    console.log(this, "from saveChanges");
    const user = await User.findByIdAndUpdate(this._id, this, {
        new: true,
        runValidators: true,
    });    
    return user;
};

// 2) A method that delete user data 
userSchema.methods.delete = async function () {    
    const user = await User.findByIdAndDelete(this._id);    
    return user;
};

// 3) A Method that compares req and res password
userSchema.methods.isValidPassword = async function (password: string) {
    const isMatch = await bcrypt.compare(password, this.passwordHash);
    return isMatch;
};

export default User;
